/**
 * ============================================================================
 * 📄 ANALISADOR DE PDF POR PÁGINA (backend/src/utilitarios/analisadorPdf.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Recebe o Buffer binário de um arquivo PDF e extrai o texto preservando
 * estritamente a numeração de cada página através do callback `pagerender`.
 * Isso é fundamental para que o RAG possa citar "Página 42" com precisão.
 * 
 * 🔄 QUEM CHAMA:
 * - `ServicoDocumentos.uploadEIngestao()` em `src/modulos/documentos/servico.documentos.ts`
 * 
 * ➡️ QUEM ESTE ARQUIVO CHAMA:
 * - A biblioteca `pdf-parse`
 * ============================================================================
 */

import pdfParse from 'pdf-parse';

export interface ConteudoPagina {
  numeroPagina: number;
  texto: string;
}

export async function analisarPdf(
  buffer: Buffer
): Promise<{ totalPaginas: number; paginas: ConteudoPagina[] }> {
  const paginas: ConteudoPagina[] = [];

  // Configurações personalizadas para iterar sobre cada página individualmente
  const opcoes = {
    pagerender: async (dadosPagina: any) => {
      const conteudoTexto = await dadosPagina.getTextContent();
      let ultimoY: number | null = null;
      let texto = '';

      // Agrupa os itens de texto respeitando quebras de linha verticais
      for (const item of conteudoTexto.items) {
        if (ultimoY === item.transform[5] || ultimoY === null) {
          texto += item.str;
        } else {
          texto += '\n' + item.str;
        }
        ultimoY = item.transform[5];
      }

      // Salva o texto isolado com o número real da página no PDF (1-indexado)
      paginas.push({
        numeroPagina: dadosPagina.pageIndex + 1,
        texto: texto.trim(),
      });

      return texto;
    },
  };

  const analisado = await pdfParse(buffer, opcoes);

  // Fallback caso o pagerender não preencha páginas
  if (paginas.length === 0 && analisado.text) {
    paginas.push({
      numeroPagina: 1,
      texto: analisado.text.trim(),
    });
  }

  return {
    totalPaginas: analisado.numpages || paginas.length,
    paginas,
  };
}
