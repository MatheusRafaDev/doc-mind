import { poolConexao } from '../../banco/index.js';
import { obterProvedorVetorial } from '../../provedores/vetores/index.js';

export interface ParametrosBusca {
  termoBusca: string;
  sistema?: string;
  modulo?: string;
  versao?: string;
  limite?: number;
}

export interface ResultadoFragmentoBusca {
  id: string;
  documentoId: string;
  tituloDocumento: string;
  sistema: string;
  modulo: string;
  versao: string;
  numeroPagina: number | null;
  tituloCapitulo: string | null;
  conteudo: string;
  pontuacao: number;
}

export class ServicoBusca {
  private provedorVetorial = obterProvedorVetorial();

  async buscaHibrida(parametros: ParametrosBusca): Promise<ResultadoFragmentoBusca[]> {
    const { termoBusca, sistema, modulo, versao, limite = 5 } = parametros;

    /**
     * ========================================================================
     * 📐 [CONCEITO: BUSCA VETORIAL + PGVECTOR + BUSCA HÍBRIDA]
     * ========================================================================
     * 1. `this.provedorVetorial.gerar(termoBusca)`: transforma a dúvida do usuário
     *    em um vetor numérico de 768 dimensões.
     * 2. `f.vetor <=> $1::vector`: operador nativo do pgvector para distância de cosseno.
     *    - Distância 0.0 = Vetores idênticos (100% similares).
     *    - Portanto, `1 - (f.vetor <=> $1::vector)` é a Similaridade de Cosseno (0 a 1).
     * 3. Busca Híbrida: combinamos 75% da similaridade vetorial (semântica) com 25%
     *    de correspondência textual exata (ILIKE) para códigos de erro e nomes de tabelas.
     * ========================================================================
     */
    const vetorConsulta = await this.provedorVetorial.gerar(termoBusca);
    const vetorString = `[${vetorConsulta.join(',')}]`;

    // 2. Monta consulta SQL com pgvector e ILIKE
    const condicoes: string[] = [];
    const valores: any[] = [vetorString, `%${termoBusca.trim()}%`];
    let indiceParametro = 3;

    if (sistema) {
      condicoes.push(`d.sistema = $${indiceParametro++}`);
      valores.push(sistema);
    }
    if (modulo) {
      condicoes.push(`d.modulo = $${indiceParametro++}`);
      valores.push(modulo);
    }
    if (versao) {
      condicoes.push(`d.versao = $${indiceParametro++}`);
      valores.push(versao);
    }

    const clausulaOnde = condicoes.length > 0 ? `AND ${condicoes.join(' AND ')}` : '';

    const sql = `
      SELECT 
        f.id,
        f.documento_id AS "documentoId",
        d.titulo AS "tituloDocumento",
        d.sistema,
        d.modulo,
        d.versao,
        f.numero_pagina AS "numeroPagina",
        f.titulo_capitulo AS "tituloCapitulo",
        f.conteudo,
        (
          (1 - (f.vetor <=> $1::vector)) * 0.75 + 
          (CASE WHEN f.conteudo ILIKE $2 THEN 0.25 ELSE 0.0 END)
        ) AS pontuacao
      FROM fragmentos_documentos f
      JOIN documentos d ON f.documento_id = d.id
      WHERE d.status = 'indexado' ${clausulaOnde}
      ORDER BY pontuacao DESC
      LIMIT $${indiceParametro};
    `;

    valores.push(limite);

    const resultado = await poolConexao.query(sql, valores);

    return resultado.rows.map((linha: any) => ({
      id: linha.id,
      documentoId: linha.documentoId,
      tituloDocumento: linha.tituloDocumento,
      sistema: linha.sistema,
      modulo: linha.modulo,
      versao: linha.versao,
      numeroPagina: linha.numeroPagina,
      tituloCapitulo: linha.tituloCapitulo,
      conteudo: linha.conteudo,
      pontuacao: parseFloat(parseFloat(linha.pontuacao).toFixed(4)),
    }));
  }
}

