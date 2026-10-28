import { IProvedorVetorial } from './tipos.js';
import { ambiente } from '../../configuracao/ambiente.js';

export class ProvedorVetorSimulado implements IProvedorVetorial {
  readonly nome = 'simulado';
  readonly dimensao: number;

  constructor(dimensao: number = ambiente.DIMENSAO_VETOR) {
    this.dimensao = dimensao;
  }

  async gerar(texto: string): Promise<number[]> {
    const vetor = new Array(this.dimensao).fill(0);
    const textoLimpo = texto.toLowerCase().trim();

    for (let i = 0; i < textoLimpo.length; i++) {
      const codigo = textoLimpo.charCodeAt(i);
      const indice1 = (codigo * 31 + i * 17) % this.dimensao;
      const indice2 = (codigo * 13 + i * 7) % this.dimensao;
      vetor[indice1] += 0.5;
      vetor[indice2] += 0.25;
    }

    let norma = 0;
    for (let i = 0; i < this.dimensao; i++) {
      norma += vetor[i] * vetor[i];
    }
    norma = Math.sqrt(norma) || 1;

    for (let i = 0; i < this.dimensao; i++) {
      vetor[i] = parseFloat((vetor[i] / norma).toFixed(6));
    }

    return vetor;
  }

  async gerarLote(textos: string[]): Promise<number[][]> {
    return Promise.all(textos.map((t) => this.gerar(t)));
  }
}

