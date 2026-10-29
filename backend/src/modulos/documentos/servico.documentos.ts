import fs from 'fs/promises';
import path from 'path';
import { eq, and } from 'drizzle-orm';
import { banco } from '../../banco/index.js';
import { documentos, fragmentosDocumentos } from '../../banco/esquema.js';
import { analisarPdf } from '../../utilitarios/analisadorPdf.js';
import { analisarMarkdown } from '../../utilitarios/analisadorMarkdown.js';
import { dividirTexto, FragmentoBruto } from '../../utilitarios/divisorTexto.js';
import { obterProvedorVetorial } from '../../provedores/vetores/index.js';
import { ambiente } from '../../configuracao/ambiente.js';

export interface EntradaIngestaoDocumento {
  titulo: string;
  sistema: string;
  modulo: string;
  versao?: string;
  tipoDocumento?: string;
  nomeArquivo: string;
  tipoMime: string;
  buffer: Buffer;
}

export class ServicoDocumentos {
  private provedorVetorial = obterProvedorVetorial();

  async uploadEIngestao(entrada: EntradaIngestaoDocumento) {
    // 1. Assegura diretório de uploads
    await fs.mkdir(ambiente.DIRETORIO_UPLOADS, { recursive: true });
    const nomeArmazenado = `${Date.now()}-${entrada.nomeArquivo}`;
    const caminhoArquivo = path.join(ambiente.DIRETORIO_UPLOADS, nomeArmazenado);
    await fs.writeFile(caminhoArquivo, entrada.buffer);

    // 2. Insere registro de documento como 'processando'
    const [doc] = await banco
      .insert(documentos)
      .values({
        titulo: entrada.titulo,
        sistema: entrada.sistema,
        modulo: entrada.modulo,
        versao: entrada.versao || 'padrao',
        tipoDocumento: entrada.tipoDocumento || 'manual',
        nomeArquivo: entrada.nomeArquivo,
        tipoMime: entrada.tipoMime,
        caminhoArquivo,
        status: 'processando',
      })
      .returning();

    try {
      // 3. Extração estruturada de texto (PDF, Markdown ou Texto Plano)
      let fragmentosBrutos: FragmentoBruto[] = [];

      const nomeMinusculo = entrada.nomeArquivo.toLowerCase();
      const ehPdf = entrada.tipoMime === 'application/pdf' || nomeMinusculo.endsWith('.pdf');
      const ehMarkdown =
        entrada.tipoMime === 'text/markdown' ||
        entrada.tipoMime === 'text/x-markdown' ||
        nomeMinusculo.endsWith('.md') ||
        nomeMinusculo.endsWith('.markdown');

      if (ehPdf) {
        const pdfAnalisado = await analisarPdf(entrada.buffer);
        for (const pagina of pdfAnalisado.paginas) {
          const fragmentosPagina = dividirTexto(
            pagina.texto,
            { tamanhoMaximo: 1000, sobreposicao: 150 },
            pagina.numeroPagina
          );
          fragmentosBrutos.push(...fragmentosPagina);
        }
      } else if (ehMarkdown) {
        const resultadoMarkdown = analisarMarkdown(entrada.buffer);
        fragmentosBrutos = resultadoMarkdown.fragmentos;
      } else {
        const conteudoTexto = entrada.buffer.toString('utf-8');
        fragmentosBrutos = dividirTexto(conteudoTexto, { tamanhoMaximo: 1000, sobreposicao: 150 }, 1);
      }

      if (fragmentosBrutos.length === 0) {
        throw new Error('Nenhum conteúdo de texto pôde ser extraído do arquivo enviado.');
      }

      /**
       * ======================================================================
       * 📐 [CONCEITO: EMBEDDINGS (VETORIZAÇÃO DE TEXTO)]
       * ======================================================================
       * Um modelo de embedding (como text-embedding-004 do Google ou o
       * text-embedding-3-small da OpenAI) lê o texto em linguagem natural
       * e o transforma em uma lista de números (um vetor de 768 dimensões).
       * Textos com significados parecidos geram números muito próximos no espaço.
       */
      const conteudos = fragmentosBrutos.map((f) => f.conteudo);
      const vetores = await this.provedorVetorial.gerarLote(conteudos);

      /**
       * ======================================================================
       * 🐘 [CONCEITO: PGVECTOR (PERSISTÊNCIA VETORIAL)]
       * ======================================================================
       * Gravamos o texto bruto, o número da página E o vetor resultante dentro
       * do PostgreSQL na coluna do tipo `vector(768)`.
       */
      for (let i = 0; i < fragmentosBrutos.length; i++) {
        const fragmento = fragmentosBrutos[i];
        const vetor = vetores[i];

        await banco.insert(fragmentosDocumentos).values({
          documentoId: doc.id,
          indiceFragmento: i,
          conteudo: fragmento.conteudo,
          numeroPagina: fragmento.numeroPagina,
          tituloCapitulo: fragmento.tituloCapitulo,
          vetor,
          metadados: {
            sistema: entrada.sistema,
            modulo: entrada.modulo,
            versao: entrada.versao || 'padrao',
            tipoDocumento: entrada.tipoDocumento || 'manual',
            tituloDocumento: entrada.titulo,
          },
        });
      }

      // 6. Atualiza status do documento para 'indexado'
      await banco
        .update(documentos)
        .set({
          status: 'indexado',
          quantidadeFragmentos: fragmentosBrutos.length,
          atualizadoEm: new Date(),
        })
        .where(eq(documentos.id, doc.id));

      return {
        id: doc.id,
        titulo: doc.titulo,
        status: 'indexado',
        quantidadeFragmentos: fragmentosBrutos.length,
        sistema: doc.sistema,
        modulo: doc.modulo,
        versao: doc.versao,
      };
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      await banco
        .update(documentos)
        .set({
          status: 'falha',
          mensagemErro: msg,
          atualizadoEm: new Date(),
        })
        .where(eq(documentos.id, doc.id));
      throw erro;
    }
  }

  async listarDocumentos(filtros?: { sistema?: string; modulo?: string; versao?: string }) {
    const condicoes = [];
    if (filtros?.sistema) condicoes.push(eq(documentos.sistema, filtros.sistema));
    if (filtros?.modulo) condicoes.push(eq(documentos.modulo, filtros.modulo));
    if (filtros?.versao) condicoes.push(eq(documentos.versao, filtros.versao));

    if (condicoes.length > 0) {
      return banco.select().from(documentos).where(and(...condicoes));
    }
    return banco.select().from(documentos);
  }

  async obterDocumentoPorId(id: string) {
    const [doc] = await banco.select().from(documentos).where(eq(documentos.id, id));
    if (!doc) return null;

    const fragmentos = await banco
      .select({
        id: fragmentosDocumentos.id,
        indiceFragmento: fragmentosDocumentos.indiceFragmento,
        numeroPagina: fragmentosDocumentos.numeroPagina,
        tituloCapitulo: fragmentosDocumentos.tituloCapitulo,
        conteudo: fragmentosDocumentos.conteudo,
        vetor: fragmentosDocumentos.vetor,
        metadados: fragmentosDocumentos.metadados,
        criadoEm: fragmentosDocumentos.criadoEm,
      })
      .from(fragmentosDocumentos)
      .where(eq(fragmentosDocumentos.documentoId, id))
      .orderBy(fragmentosDocumentos.indiceFragmento);

    return { ...doc, fragmentos };
  }

  async excluirDocumento(id: string) {
    const [doc] = await banco.select().from(documentos).where(eq(documentos.id, id));
    if (!doc) return false;

    try {
      await fs.unlink(doc.caminhoArquivo);
    } catch {
      // Arquivo já não existe em disco
    }

    await banco.delete(documentos).where(eq(documentos.id, id));
    return true;
  }
}

