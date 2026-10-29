/**
 * ============================================================================
 * 📝 ANALISADOR ESTRUTURADO DE MARKDOWN (backend/src/utilitarios/analisadorMarkdown.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Realiza o parse inteligente de arquivos Markdown (.md, .markdown) técnicos.
 * Diferente de textos planos, documentos Markdown possuem hierarquia semântica
 * explícita (# Título, ## Subtítulo, blocos de código e metadados frontmatter).
 * 
 * 💡 BENEFÍCIOS:
 * 1. Extrai seções e títulos de capítulos contextuais (`tituloCapitulo`).
 * 2. Mapeia seções lógicas para números de página virtuais (`numeroPagina = 1, 2, 3...`),
 *    permitindo que as respostas do RAG façam citações exatas da seção/página do manual.
 * 3. Preserva blocos de código e tabelas dentro do contexto semântico correto.
 * ============================================================================
 */

import { dividirTexto, FragmentoBruto } from './divisorTexto.js';

export interface SecaoMarkdown {
  titulo: string;
  nivel: number;
  conteudo: string;
  numeroSecao: number;
}

export interface ResultadoAnaliseMarkdown {
  metadadosFrontmatter?: Record<string, string>;
  secoes: SecaoMarkdown[];
  fragmentos: FragmentoBruto[];
  totalCaracteres: number;
}

/**
 * Analisa o conteúdo de um arquivo Markdown e o converte em fragmentos prontos para vetorização.
 */
export function analisarMarkdown(conteudoBufferOuTexto: Buffer | string): ResultadoAnaliseMarkdown {
  const texto = typeof conteudoBufferOuTexto === 'string'
    ? conteudoBufferOuTexto
    : conteudoBufferOuTexto.toString('utf-8');

  let textoProcessado = texto.replace(/\r\n/g, '\n');
  const metadadosFrontmatter: Record<string, string> = {};

  // 1. Extrai Frontmatter YAML opcional (ex: --- title: API Financeira ---)
  if (textoProcessado.startsWith('---')) {
    const fimFrontmatter = textoProcessado.indexOf('\n---', 3);
    if (fimFrontmatter !== -1) {
      const blocoFrontmatter = textoProcessado.substring(3, fimFrontmatter).trim();
      const linhas = blocoFrontmatter.split('\n');
      for (const linha of linhas) {
        const divisor = linha.indexOf(':');
        if (divisor !== -1) {
          const chave = linha.substring(0, divisor).trim();
          const valor = linha.substring(divisor + 1).trim().replace(/^["']|["']$/g, '');
          metadadosFrontmatter[chave] = valor;
        }
      }
      textoProcessado = textoProcessado.substring(fimFrontmatter + 4).trim();
    }
  }

  // 2. Divide o documento por cabeçalhos Markdown (#, ##, ###)
  const regexCabecalho = /^(#{1,6})\s+(.+)$/gm;
  const secoes: SecaoMarkdown[] = [];
  const fragmentos: FragmentoBruto[] = [];

  const ocorrencias: { indice: number; nivel: number; titulo: string }[] = [];
  let correspondencia: RegExpExecArray | null;

  while ((correspondencia = regexCabecalho.exec(textoProcessado)) !== null) {
    ocorrencias.push({
      indice: correspondencia.index,
      nivel: correspondencia[1].length,
      titulo: correspondencia[2].trim(),
    });
  }

  // Se não houver cabeçalhos explícitos, processa como documento contínuo de página única
  if (ocorrencias.length === 0) {
    const frags = dividirTexto(textoProcessado, { tamanhoMaximo: 1000, sobreposicao: 150 }, 1);
    return {
      metadadosFrontmatter,
      secoes: [{ titulo: 'Documento Principal', nivel: 1, conteudo: textoProcessado, numeroSecao: 1 }],
      fragmentos: frags,
      totalCaracteres: textoProcessado.length,
    };
  }

  // Se houver introdução antes do primeiro cabeçalho
  if (ocorrencias[0].indice > 0) {
    const textoIntroducao = textoProcessado.substring(0, ocorrencias[0].indice).trim();
    if (textoIntroducao.length > 0) {
      secoes.push({
        titulo: 'Introdução / Visão Geral',
        nivel: 1,
        conteudo: textoIntroducao,
        numeroSecao: 1,
      });

      const fragsIntro = dividirTexto(
        textoIntroducao,
        { tamanhoMaximo: 1000, sobreposicao: 150 },
        1
      );
      for (const f of fragsIntro) {
        f.tituloCapitulo = 'Introdução / Visão Geral';
      }
      fragmentos.push(...fragsIntro);
    }
  }

  // Itera pelas seções identificadas
  for (let i = 0; i < ocorrencias.length; i++) {
    const atual = ocorrencias[i];
    const proximoIndice = i + 1 < ocorrencias.length ? ocorrencias[i + 1].indice : textoProcessado.length;
    const conteudoSecao = textoProcessado.substring(atual.indice, proximoIndice).trim();
    const numeroSecao = secoes.length + 1; // Atua como número de página virtual

    secoes.push({
      titulo: atual.titulo,
      nivel: atual.nivel,
      conteudo: conteudoSecao,
      numeroSecao,
    });

    // Subdivide a seção caso ela ultrapasse o tamanho máximo de chunk
    const fragsSecao = dividirTexto(
      conteudoSecao,
      { tamanhoMaximo: 1000, sobreposicao: 150 },
      numeroSecao
    );

    for (const f of fragsSecao) {
      f.tituloCapitulo = atual.titulo;
    }

    fragmentos.push(...fragsSecao);
  }

  return {
    metadadosFrontmatter,
    secoes,
    fragmentos,
    totalCaracteres: textoProcessado.length,
  };
}
