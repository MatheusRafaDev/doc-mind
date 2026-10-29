/**
 * ============================================================================
 * ✂️ DIVISOR ESTRUTURADO DE TEXTO / CHUNKER (backend/src/utilitarios/divisorTexto.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Divide textos longos de manuais em fragmentos (*chunks*) de tamanho controlado
 * (~1000 caracteres) aplicando uma sobreposição (*overlap* de 150 caracteres).
 * 
 * 💡 POR QUE USAR SOBREPOSIÇÃO (OVERLAP)?
 * Se uma regra de negócio ou exemplo de API começar no final de um parágrafo e
 * terminar no início do próximo, o corte seco romperia o sentido semântico.
 * A sobreposição garante que o modelo de embedding capture o contexto completo.
 * 
 * 🔄 QUEM CHAMA:
 * - `ServicoDocumentos.uploadEIngestao()` em `src/modulos/documentos/servico.documentos.ts`
 * ============================================================================
 */

export interface FragmentoBruto {
  conteudo: string;
  numeroPagina?: number;
  tituloCapitulo?: string;
}

export interface OpcoesDivisao {
  tamanhoMaximo?: number; // Caracteres máximos por fragmento (padrão: 1000)
  sobreposicao?: number;  // Caracteres de sobreposição entre fragmentos vizinhos (padrão: 150)
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

    // Detecta títulos e seções comuns em documentações técnicas (ex: # Capítulo, 1.2 Parâmetros)
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

        // Mantém as últimas palavras do fragmento anterior como introdução do próximo
        const palavras = fragmentoAtual.split(/\s+/);
        const palavrasSobreposicao = palavras
          .slice(-Math.min(palavras.length, Math.floor(sobreposicao / 6)))
          .join(' ');
        fragmentoAtual = palavrasSobreposicao + '\n\n' + limpo;
      } else {
        // Se um parágrafo isolado for maior que tamanhoMaximo, fatia diretamente
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
