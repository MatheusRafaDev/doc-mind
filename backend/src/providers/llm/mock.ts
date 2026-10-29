import { IProvedorLLM } from './types.js';

export class ProvedorLLMSimulado implements IProvedorLLM {
  readonly nome = 'simulado';

  async gerar(comando: string, instrucaoSistema?: string): Promise<string> {
    if (comando.includes('Nenhum trecho de documentação relevante encontrado')) {
      return 'Não encontrei informações suficientes na documentação cadastrada para responder com precisão. Recomendo verificar se o manual do módulo correspondente foi importado.';
    }

    if (comando.includes('DIAGNÓSTICO TÉCNICO DE ERRO') || comando.includes('DIAGNÓSTICO ESTRUTURADO')) {
      return JSON.stringify(
        {
          fatosDocumentados: [
            'O código de erro reportado está associado a validações de campos obrigatórios no módulo correspondente.',
            'A documentação indica que a integração requer autenticação prévia via token Bearer.',
          ],
          hipotesesTecnicas: [
            'Possível ausência de preenchimento de campo obrigatório no payload enviado.',
            'O token de integração pode ter expirado durante o envio.',
          ],
          passosInvestigacao: [
            '1. Verificar se o endpoint chamado é o correto para a versão em execução.',
            '2. Validar se todos os campos obrigatórios listados no manual estão presentes no payload JSON.',
            '3. Inspecionar a tabela de logs da integração no banco de dados do ERP.',
          ],
          confianca: 'alta',
        },
        null,
        2
      );
    }

    return `Com base na documentação consultada do sistema ERP:

1. O fluxo operacional exige a parametrização inicial do módulo correspondente.
2. Certifique-se de que as permissões de usuário e perfis fiscais/financeiros estejam configurados corretamente.
3. Para operações via API, verifique a correspondência dos campos de cabeçalho e detalhe descritos na especificação.

Consulte os manuais indicados nas referências para detalhes adicionais de telas e campos.`;
  }
}

