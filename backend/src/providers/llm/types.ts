export interface IProvedorLLM {
  readonly nome: string;
  gerar(comando: string, instrucaoSistema?: string): Promise<string>;
}

