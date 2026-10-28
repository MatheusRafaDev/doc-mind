/**
 * ============================================================================
 * 🩺 ROTAS DE DIAGNÓSTICO GUIADO (backend/src/rotas/diagnostico.rotas.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Expõe o endpoint `/api/v1/diagnostico` para envio de códigos de erro,
 * logs de exceção e payloads de API de ERPs.
 * 
 * 🔄 QUEM CHAMA:
 * - A tela de diagnóstico em `frontend/src/app/diagnostico/page.tsx`
 * - A função `diagnosticarErro()` em `frontend/src/lib/api.ts`
 * 
 * ➡️ QUEM ESTE ARQUIVO CHAMA:
 * - `ServicoDiagnostico` em `src/modulos/diagnostico/servico.diagnostico.ts`
 *   (que por sua vez orquestra o grafo compilado do **LangGraph** em `grafoDiagnostico.ts`)
 * ============================================================================
 */

import { FastifyInstance } from 'fastify';
import { ServicoDiagnostico } from '../modulos/diagnostico/servico.diagnostico.js';

export async function rotasDiagnostico(app: FastifyInstance) {
  const servicoDiagnostico = new ServicoDiagnostico();

  /**
   * POST /api/v1/diagnostico
   * Submete erro e payload para obter um relatório em JSON estruturado com:
   * fatosDocumentados, hipotesesTecnicas, passosInvestigacao e confianca.
   */
  app.post(
    '/',
    {
      schema: {
        summary: 'Diagnóstico guiado de erro ou log de ERP',
        description:
          'Submete uma mensagem de erro, código, log ou payload para obter um diagnóstico estruturado separando Fatos Documentados de Hipóteses Técnicas.',
        tags: ['Diagnóstico Técnico'],
        body: {
          type: 'object',
          required: ['sistema', 'modulo', 'logErro'],
          properties: {
            sistema: { type: 'string', description: 'Sistema ERP (ex: Volpe)' },
            modulo: { type: 'string', description: 'Módulo onde ocorreu o erro (ex: Integração Fiscal)' },
            codigoErro: { type: 'string', description: 'Código do erro (ex: HTTP 400, ORA-00001)' },
            logErro: { type: 'string', description: 'Texto da exceção ou trecho de log' },
            dadosEnviados: { type: 'string', description: 'Payload JSON ou dados que estavam sendo enviados' },
            operacao: { type: 'string', description: 'Operação que o usuário tentava executar' },
          },
        },
      },
    },
    async (requisicao) => {
      const corpo = requisicao.body as any;
      return servicoDiagnostico.diagnosticar({
        sistema: corpo.sistema || corpo.system,
        modulo: corpo.modulo || corpo.module,
        codigoErro: corpo.codigoErro || corpo.errorCode,
        logErro: corpo.logErro || corpo.errorLog,
        dadosEnviados: corpo.dadosEnviados || corpo.payload,
        operacao: corpo.operacao || corpo.operation,
      });
    }
  );
}
