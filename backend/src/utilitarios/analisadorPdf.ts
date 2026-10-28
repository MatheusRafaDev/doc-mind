import pdfParse from 'pdf-parse';

export interface ConteudoPagina {
  numeroPagina: number;
  texto: string;
}

export async function analisarPdf(
  buffer: Buffer
): Promise<{ totalPaginas: number; paginas: ConteudoPagina[] }> {
  const paginas: ConteudoPagina[] = [];

  const opcoes = {
    pagerender: async (dadosPagina: any) => {
      const conteudoTexto = await dadosPagina.getTextContent();
      let ultimoY: number | null = null;
      let texto = '';

      for (const item of conteudoTexto.items) {
        if (ultimoY === item.transform[5] || ultimoY === null) {
          texto += item.str;
        } else {
          texto += '\n' + item.str;
        }
        ultimoY = item.transform[5];
      }

      paginas.push({
        numeroPagina: dadosPagina.pageIndex + 1,
        texto: texto.trim(),
      });

      return texto;
    },
  };

  const analisado = await pdfParse(buffer, opcoes);

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

