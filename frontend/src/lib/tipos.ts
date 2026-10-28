export interface Documento {
  id: string;
  titulo: string;
  sistema: string;
  modulo: string;
  versao: string;
  tipoDocumento: string;
  nomeArquivo: string;
  tipoMime: string;
  status: 'pendente' | 'processando' | 'indexado' | 'falha';
  quantidadeFragmentos: number;
  mensagemErro?: string;
  criadoEm: string;
}

export interface FonteConsultada {
  tituloDocumento: string;
  sistema: string;
  modulo: string;
  versao: string;
  numeroPagina: number | null;
  tituloCapitulo: string | null;
  trecho: string;
  pontuacao: number;
}

export interface MensagemChat {
  id: string;
  papel: 'usuario' | 'assistente';
  conteudo: string;
  fontes?: FonteConsultada[];
  horario: string;
}

export interface RespostaDiagnostico {
  id: string;
  sistema: string;
  modulo: string;
  codigoErro?: string;
  confianca: 'alta' | 'media' | 'baixa' | 'insuficiente';
  fatosDocumentados: string[];
  hipotesesTecnicas: string[];
  passosInvestigacao: string[];
  fontes: Array<{
    tituloDocumento: string;
    sistema: string;
    modulo: string;
    numeroPagina: number | null;
    tituloCapitulo: string | null;
  }>;
}

export interface FragmentoBusca {
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

export interface VisaoGeralMetricas {
  totalDocumentos: number;
  totalFragmentos: number;
  totalConversas: number;
  totalDiagnosticos: number;
  lacunasPendentes: number;
}

export interface LacunaConhecimento {
  id: string;
  pergunta: string;
  sistema: string | null;
  modulo: string | null;
  motivo: string;
  resolvido: number;
  criadoEm: string;
}

