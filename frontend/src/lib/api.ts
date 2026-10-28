import {
  Documento,
  MensagemChat,
  RespostaDiagnostico,
  FragmentoBusca,
  VisaoGeralMetricas,
  LacunaConhecimento,
} from './tipos';

const URL_API = process.env.NEXT_PUBLIC_URL_API || 'http://localhost:3000';

export async function checarSaudeApi(): Promise<{ online: boolean; dados?: any }> {
  try {
    const res = await fetch(`${URL_API}/saude`, { cache: 'no-store' });
    if (!res.ok) return { online: false };
    const dados = await res.json();
    return { online: true, dados };
  } catch {
    return { online: false };
  }
}

export async function listarDocumentos(filtros?: {
  sistema?: string;
  modulo?: string;
  versao?: string;
}): Promise<Documento[]> {
  const params = new URLSearchParams();
  if (filtros?.sistema) params.append('sistema', filtros.sistema);
  if (filtros?.modulo) params.append('modulo', filtros.modulo);
  if (filtros?.versao) params.append('versao', filtros.versao);

  const res = await fetch(`${URL_API}/api/v1/documentos?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Falha ao listar documentos.');
  return res.json();
}

export async function uploadDocumento(formData: FormData): Promise<any> {
  const res = await fetch(`${URL_API}/api/v1/documentos/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.erro || 'Falha no upload do manual.');
  }
  return res.json();
}

export async function excluirDocumento(id: string): Promise<boolean> {
  const res = await fetch(`${URL_API}/api/v1/documentos/${id}`, {
    method: 'DELETE',
  });
  return res.ok;
}

export async function enviarPerguntaChat(dados: {
  pergunta: string;
  conversaId?: string;
  sistema?: string;
  modulo?: string;
  versao?: string;
}): Promise<{ conversaId: string; resposta: string; fontes: any[] }> {
  const res = await fetch(`${URL_API}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Falha ao enviar mensagem no chat.');
  return res.json();
}

export async function executarBuscaHibrida(dados: {
  termoBusca: string;
  sistema?: string;
  modulo?: string;
  versao?: string;
  limite?: number;
}): Promise<FragmentoBusca[]> {
  const res = await fetch(`${URL_API}/api/v1/busca/hibrida`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Falha na busca técnica.');
  return res.json();
}

export async function diagnosticarErro(dados: {
  sistema: string;
  modulo: string;
  codigoErro?: string;
  logErro: string;
  dadosEnviados?: string;
  operacao?: string;
}): Promise<RespostaDiagnostico> {
  const res = await fetch(`${URL_API}/api/v1/diagnostico`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Falha ao processar diagnóstico de erro.');
  return res.json();
}

export async function obterVisaoGeralMetricas(): Promise<VisaoGeralMetricas> {
  const res = await fetch(`${URL_API}/api/v1/metricas/visao-geral`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Falha ao obter visão geral de métricas.');
  return res.json();
}

export async function obterLacunasConhecimento(resolvido?: boolean): Promise<LacunaConhecimento[]> {
  const params = resolvido !== undefined ? `?resolvido=${resolvido}` : '';
  const res = await fetch(`${URL_API}/api/v1/metricas/lacunas${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Falha ao obter lacunas de conhecimento.');
  return res.json();
}

export async function resolverLacuna(id: string): Promise<boolean> {
  const res = await fetch(`${URL_API}/api/v1/metricas/lacunas/${id}/resolver`, {
    method: 'PATCH',
  });
  return res.ok;
}

