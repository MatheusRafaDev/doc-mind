export interface FragmentoBruto {
  conteudo: string;
  numeroPagina?: number;
  tituloCapitulo?: string;
}

export interface OpcoesDivisao {
  tamanhoMaximo?: number; // Caracteres por fragmento (padrão: 1000)
  sobreposicao?: number;  // Sobreposição entre fragmentos (padrão: 150)
}

export function dividirTexto(
  texto: string,
  opcoes: OpcoesDivisao = {},
  numeroPagina?: number
): FragmentoBruto[] {
  const tamanhoMaximo = opcoes.tamanhoMaximo ?? 1000;
  const sobreposicao = opcoes.sobreposicao ?? 150;

  if (!texto || texto.trim().length === 0) {
    return [];
  }

  const textoLimpo = texto.replace(/\r\n/g, '\n').trim();
  const paragrafos = textoLimpo.split(/\n\s*\n/);
  const fragmentos: FragmentoBruto[] = [];

  let fragmentoAtual = '';
  let tituloDetectado: string | undefined = undefined;

  for (const paragrafo of paragrafos) {
    const limpo = paragrafo.trim();
    if (!limpo) continue;

    // Detecta títulos comuns em manuais técnicos
    if (limpo.length < 100 && (limpo.startsWith('#') || /^[0-9]+\.[0-9]*/.test(limpo))) {
      tituloDetectado = limpo.replace(/^#+\s*/, '');
    }

    if (fragmentoAtual.length + limpo.length <= tamanhoMaximo) {
      fragmentoAtual += (fragmentoAtual ? '\n\n' : '') + limpo;
    } else {
      if (fragmentoAtual.length > 0) {
        fragmentos.push({
          conteudo: fragmentoAtual.trim(),
          numeroPagina,
          tituloCapitulo: tituloDetectado,
        });

        // Mantém overlap com o final do fragmento anterior
        const palavras = fragmentoAtual.split(/\s+/);
        const palavrasSobreposicao = palavras
          .slice(-Math.min(palavras.length, Math.floor(sobreposicao / 6)))
          .join(' ');
        fragmentoAtual = palavrasSobreposicao + '\n\n' + limpo;
      } else {
        // Se o parágrafo isolado for maior que tamanhoMaximo
        for (let i = 0; i < limpo.length; i += tamanhoMaximo - sobreposicao) {
          fragmentos.push({
            conteudo: limpo.substring(i, i + tamanhoMaximo).trim(),
            numeroPagina,
            tituloCapitulo: tituloDetectado,
          });
        }
        fragmentoAtual = '';
      }
    }
  }

  if (fragmentoAtual.trim().length > 0) {
    fragmentos.push({
      conteudo: fragmentoAtual.trim(),
      numeroPagina,
      tituloCapitulo: tituloDetectado,
    });
  }

  return fragmentos;
}

