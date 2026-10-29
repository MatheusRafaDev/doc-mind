import { eq } from 'drizzle-orm';
import { banco } from '../../database/index.js';
import { conversas, mensagens, lacunasConhecimento } from '../../database/schema.js';
import { ServicoBusca } from '../search/search.service.js';
import { obterProvedorLLM } from '../../providers/llm/index.js';

export interface EntradaChat {
  pergunta: string;
  conversaId?: string;
  sistema?: string;
  modulo?: string;
  versao?: string;
}

export interface RespostaChat {
  conversaId: string;
  resposta: string;
  fontes: Array<{
    tituloDocumento: string;
    sistema: string;
    modulo: string;
    versao: string;
    numeroPagina: number | null;
    tituloCapitulo: string | null;
    trecho: string;
    pontuacao: number;
  }>;
}

export class ServicoChat {
  private servicoBusca = new ServicoBusca();
  private provedorLlm = obterProvedorLLM();

  async perguntar(entrada: EntradaChat): Promise<RespostaChat> {
    const { pergunta, sistema, modulo, versao } = entrada;

    // 1. Obtém ou cria conversa
    let conversaId = entrada.conversaId;
    if (!conversaId) {
      const [novaConversa] = await banco
        .insert(conversas)
        .values({
          titulo: pergunta.length > 50 ? `${pergunta.substring(0, 47)}...` : pergunta,
          sistema,
          modulo,
          versao,
        })
        .returning();
      conversaId = novaConversa.id;
    }

    // 2. Salva pergunta do usuário
    await banco.insert(mensagens).values({
      conversaId,
      papel: 'usuario',
      conteudo: pergunta,
    });

    /**
     * ========================================================================
     * 🔍 [CONCEITO RAG — ETAPA 1: RETRIEVAL (RECUPERAÇÃO)]
     * ========================================================================
     * Em vez de mandar a pergunta pura para a IA (onde ela inventaria coisas),
     * primeiro vamos ao PostgreSQL com pgvector e buscamos os trechos mais
     * próximos semanticamente da pergunta do usuário.
     */
    const fragmentosRelevantes = await this.servicoBusca.buscaHibrida({
      termoBusca: pergunta,
      sistema,
      modulo,
      versao,
      limite: 4,
    });

    /**
     * ========================================================================
     * 🛡️ [CONCEITO: GUARDRAIL / ANTI-ALUCINAÇÃO]
     * ========================================================================
     * Se nenhum trecho atingir o corte mínimo de similaridade (0.25), NÃO
     * geramos resposta com IA. Admitimos a falta de dados e registramos uma
     * Lacuna de Conhecimento (Knowledge Gap).
     */
    const temEvidenciaSuficiente =
      fragmentosRelevantes.length > 0 && fragmentosRelevantes[0].pontuacao > 0.25;

    if (!temEvidenciaSuficiente) {
      await banco.insert(lacunasConhecimento).values({
        pergunta,
        sistema,
        modulo,
        motivo: 'Nenhum trecho de documentação relevante ou índice de similaridade muito baixo.',
      });

      const respostaPadrao =
        'Não encontrei informações suficientes na documentação cadastrada para responder com precisão. ' +
        'Para evitar informações incorretas, recomendo verificar se os manuais e notas de versão deste módulo foram importados na biblioteca.';

      await banco.insert(mensagens).values({
        conversaId,
        papel: 'assistente',
        conteudo: respostaPadrao,
        fontes: [],
      });

      return {
        conversaId,
        resposta: respostaPadrao,
        fontes: [],
      };
    }

    /**
     * ========================================================================
     * 📝 [CONCEITO RAG — ETAPA 2: AUGMENTATION (AUMENTO DE CONTEXTO)]
     * ========================================================================
     * Pegamos os trechos recuperados do banco e injetamos dentro do prompt
     * identificando o manual e a página de cada um.
     */
    const fontes = fragmentosRelevantes.map((f) => ({
      tituloDocumento: f.tituloDocumento,
      sistema: f.sistema,
      modulo: f.modulo,
      versao: f.versao,
      numeroPagina: f.numeroPagina,
      tituloCapitulo: f.tituloCapitulo,
      trecho: f.conteudo.length > 300 ? `${f.conteudo.substring(0, 297)}...` : f.conteudo,
      pontuacao: f.pontuacao,
    }));

    const textoContexto = fragmentosRelevantes
      .map(
        (f, idx) =>
          `[FONTE ${idx + 1}]: "${f.tituloDocumento}" (Sistema: ${f.sistema}, Módulo: ${f.modulo}, Versão: ${f.versao}, Página: ${f.numeroPagina || 'N/A'})\n${f.conteudo}`
      )
      .join('\n\n---\n\n');

    const instrucaoSistema = `Você é o assistente técnico do DocMind especializado em documentação de sistemas ERP, APIs e procedimentos operacionais.
Sua missão é responder à dúvida do usuário ESTRITAMENTE com base nos trechos de documentos fornecidos.
Diretrizes fundamentais:
1. Nunca invente procedimentos, tabelas, campos ou telas que não constem no contexto.
2. Indique explicitamente em sua resposta as fontes consultadas (Manual, Módulo e Página).
3. Seja direto, técnico e didático. Se a documentação tiver passos numerados ou parâmetros, formate em listas claras.`;

    const comando = `TRECHOS DE DOCUMENTAÇÃO RECUPERADOS:\n\n${textoContexto}\n\nPERGUNTA DO USUÁRIO:\n${pergunta}\n\nResponda com base unicamente nas fontes acima, citando-as.`;

    /**
     * ========================================================================
     * 🤖 [CONCEITO RAG — ETAPA 3: GENERATION (GERAÇÃO)]
     * ========================================================================
     * O LLM (Gemini, OpenAI ou Simulado) recebe o prompt "aumentado" com as
     * evidências e gera a resposta fundamentada com citações.
     */
    const resposta = await this.provedorLlm.gerar(comando, instrucaoSistema);

    // 7. Salva resposta no banco
    await banco.insert(mensagens).values({
      conversaId,
      papel: 'assistente',
      conteudo: resposta,
      fontes,
    });

    return {
      conversaId,
      resposta,
      fontes,
    };
  }

  async obterHistoricoConversa(conversaId: string) {
    return banco
      .select()
      .from(mensagens)
      .where(eq(mensagens.conversaId, conversaId))
      .orderBy(mensagens.criadoEm);
  }
}

