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

export interface FragmentoDetalhado {
  id: string;
  indiceFragmento: number;
  numeroPagina: number | null;
  tituloCapitulo: string | null;
  conteudo: string;
  vetor?: number[];
  metadados?: any;
  criadoEm?: string;
}

export interface DocumentoDetalhado extends Documento {
  caminhoArquivo?: string;
  atualizadoEm?: string;
  fragmentos: FragmentoDetalhado[];
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

export interface TarefaPlano {
  id: string;
  agente: string;
  descricao: string;
  status: 'pendente' | 'executando' | 'concluido';
}

export interface AprovacaoHitl {
  id: string;
  tipo: string;
  titulo: string;
  solicitante: string;
  departamento: string;
  dados: any;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  aprovador?: string;
  justificativa?: string;
  criadoEm: string;
  respondidoEm?: string;
}

export interface SpanTelemetria {
  id: string;
  nome: string;
  agente?: string;
  departamento: string;
  tipo: string;
  duracaoMs: number;
  tokensEntrada: number;
  tokensSaida: number;
  custoUsd: number;
}

export interface RespostaMultiagente {
  id: string;
  solicitacaoOriginal: string;
  solicitacaoSanitizada: string;
  status: 'concluido' | 'aguardando_aprovacao' | 'rejeitado' | 'erro';
  guardrails: {
    seguro: boolean;
    piiDetectados: Array<{ tipo: string; original: string; mascarado: string }>;
    scoreGroundedness: number;
    dlpSeguro: boolean;
  };
  plano: TarefaPlano[];
  resultadosAgentes: {
    comercial: any;
    financeiro: any;
    juridico: any;
  };
  decisao: {
    viavel: boolean;
    motivo: string;
    descontoSolicitado: number;
    margemFinalPercentual: number;
    necessitaAprovacaoAlcada: boolean;
  };
  propostaGerada: any;
  aprovacaoHitl: AprovacaoHitl | null;
  respostaSintetizada: string;
  telemetria: {
    execucaoId: string;
    duracaoTotalMs: number;
    totalTokens: number;
    totalCustoUsd: number;
    totalCustoBrl: number;
    spans: SpanTelemetria[];
    custoPorDepartamento: Record<string, { tokens: number; custoUsd: number; custoBrl: number }>;
  };
}

