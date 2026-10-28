export interface IProvedorVetorial {
  readonly nome: string;
  readonly dimensao: number;
  gerar(texto: string): Promise<number[]>;
  gerarLote(textos: string[]): Promise<number[][]>;
}

