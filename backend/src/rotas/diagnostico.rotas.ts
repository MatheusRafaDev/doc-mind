import { FastifyInstance } from 'fastify';
import { ServicoDiagnostico } from '../modulos/diagnostico/servico.diagnostico.js';

export async function rotasDiagnostico(app: FastifyInstance) {
  const servicoDiagnostico = new ServicoDiagnostico();

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

