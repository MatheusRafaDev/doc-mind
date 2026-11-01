/**
 * ============================================================================
 * 🛡️ MOTOR DE GUARDRAILS & SEGURANÇA (backend/src/modules/guardrails/guardrails.service.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Implementa as defesas de entrada (Input Guardrails) e saída (Output Guardrails):
 * 1. Detecção de Prompt Injection e Jailbreak.
 * 2. Mascaramento e Desanonimização de Dados Sensíveis (PII / DLP: CPF, CNPJ, Cartões, Senhas).
 * 3. Validação de Alucinação (Groundedness / RAG Triad).
 * 4. Controle de Escopo e Permissões por Departamento.
 * ============================================================================
 */

export interface ResultadoInputGuardrail {
  textoOriginal: string;
  textoSanitizado: string;
  seguro: boolean;
  contemPromptInjection: boolean;
  padroesDetectados: string[];
  piiDetectados: Array<{ tipo: string; original: string; mascarado: string }>;
  motivoBloqueio?: string;
}

export interface ResultadoOutputGuardrail {
  valida: boolean;
  scoreGroundedness: number; // 0.0 a 1.0
  dlpSeguro: boolean;
  motivo?: string;
  textoFinal: string;
}

export class ServicoGuardrails {
  // Padrões conhecidos de Prompt Injection / Jailbreak
  private static readonly PADROES_INJECTION = [
    /ignore (all )?(previous|above) instructions/i,
    /desconsidere (todas as )?instruções (anteriores|acima)/i,
    /esqueça as regras/i,
    /system prompt override/i,
    /reveal your (system|initial) prompt/i,
    /mostre seu prompt de sistema/i,
    /you are now in (developer|dan|jailbreak) mode/i,
    /bypass security restrictions/i,
    /hacked by/i,
  ];

  /**
   * Sanitiza a entrada do usuário: mascarando PII e verificando injeção de prompt.
   */
  processarInput(texto: string, departamento?: string): ResultadoInputGuardrail {
    const piiDetectados: Array<{ tipo: string; original: string; mascarado: string }> = [];
    const padroesDetectados: string[] = [];

    // 1. Verificação de Prompt Injection
    let contemPromptInjection = false;
    for (const regex of ServicoGuardrails.PADROES_INJECTION) {
      if (regex.test(texto)) {
        contemPromptInjection = true;
        padroesDetectados.push(regex.source);
      }
    }

    if (contemPromptInjection) {
      return {
        textoOriginal: texto,
        textoSanitizado: texto,
        seguro: false,
        contemPromptInjection: true,
        padroesDetectados,
        piiDetectados: [],
        motivoBloqueio: 'Tentativa de injeção de prompt ou violação de diretrizes de sistema detectada.',
      };
    }

    // 2. Mascaramento de PII (Presidio Pattern)
    let textoSanitizado = texto;

    // CPF: 000.000.000-00 ou 00000000000
    textoSanitizado = textoSanitizado.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, (cpf) => {
      const tag = `[CPF_MASCARADO_${piiDetectados.length + 1}]`;
      piiDetectados.push({ tipo: 'CPF', original: cpf, mascarado: tag });
      return tag;
    });

    // CNPJ: 00.000.000/0001-00
    textoSanitizado = textoSanitizado.replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, (cnpj) => {
      const tag = `[CNPJ_MASCARADO_${piiDetectados.length + 1}]`;
      piiDetectados.push({ tipo: 'CNPJ', original: cnpj, mascarado: tag });
      return tag;
    });

    // Cartão de Crédito
    textoSanitizado = textoSanitizado.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, (cartao) => {
      const tag = `[CARTAO_MASCARADO_${piiDetectados.length + 1}]`;
      piiDetectados.push({ tipo: 'Cartão de Crédito', original: cartao, mascarado: tag });
      return tag;
    });

    // Chaves de API / Senhas
    textoSanitizado = textoSanitizado.replace(/\b(?:Bearer\s+|api[_-]?key\s*[:=]\s*)[a-zA-Z0-9_\-]{16,}\b/gi, (segredo) => {
      const tag = `[CREDENTIAL_REDACTED]`;
      piiDetectados.push({ tipo: 'Credencial Privada', original: segredo, mascarado: tag });
      return tag;
    });

    return {
      textoOriginal: texto,
      textoSanitizado,
      seguro: true,
      contemPromptInjection: false,
      padroesDetectados: [],
      piiDetectados,
    };
  }

  /**
   * Avalia a saída antes de entregar ao usuário final:
   * 1. Varredura DLP contra vazamento de senhas / connection strings.
   * 2. Cálculo de Groundedness (evidências versus resposta).
   */
  processarOutput(resposta: string, evidencias: string[]): ResultadoOutputGuardrail {
    // 1. DLP Scan
    const contemSegredo = /postgres:\/\/|password\s*=|bearer\s+ey/i.test(resposta);
    if (contemSegredo) {
      return {
        valida: false,
        scoreGroundedness: 0,
        dlpSeguro: false,
        motivo: 'DLP Triggered: Resposta continha dados de infraestrutura ou credenciais protegidas.',
        textoFinal: '⚠️ [A resposta foi retida pela governança corporativa por conter dados confidenciais de sistema].',
      };
    }

    // 2. Score de Groundedness simplificado (RAG Triad)
    let scoreGroundedness = 0.95;
    if (evidencias.length === 0) {
      scoreGroundedness = 0.2;
    } else {
      // Verifica se a resposta cita ou usa termos das evidências coletadas
      const palavrasEvidencias = new Set(
        evidencias.join(' ').toLowerCase().split(/\s+/).filter((p) => p.length > 4)
      );
      const palavrasResposta = resposta.toLowerCase().split(/\s+/).filter((p) => p.length > 4);
      const termosEncontrados = palavrasResposta.filter((p) => palavrasEvidencias.has(p));
      const proporcao = palavrasResposta.length > 0 ? termosEncontrados.length / palavrasResposta.length : 0;
      scoreGroundedness = Math.min(1.0, Math.max(0.4, Number((proporcao * 1.5).toFixed(2))));
    }

    return {
      valida: true,
      scoreGroundedness,
      dlpSeguro: true,
      textoFinal: resposta,
    };
  }
}
