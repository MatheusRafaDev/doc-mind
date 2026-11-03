'use client';

import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  FileCheck,
  Send,
  Building2,
  Workflow,
  Cpu,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Layers,
} from 'lucide-react';
import { executarMultiagente, responderAprovacaoHitl } from '../../lib/api';
import { RespostaMultiagente } from '../../lib/types';
import MarkdownRenderer from '../../components/MarkdownRenderer';

const CASO_XPTO_PROMPT =
  'Preciso preparar a renovação do contrato do cliente XPTO. Verifique o histórico comercial, identifique possíveis pendências financeiras, consulte as cláusulas contratuais vigentes e avalie se podemos oferecer um desconto de 10%. Caso seja viável, gere uma proposta comercial atualizada e encaminhe para aprovação do responsável.';

export default function PaginaMultiagente() {
  const [solicitacao, setSolicitacao] = useState(CASO_XPTO_PROMPT);
  const [solicitante, setSolicitante] = useState('Carlos Eduardo (Vendas)');
  const [departamento, setDepartamento] = useState('Comercial');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<RespostaMultiagente | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Estados para aprovação HITL
  const [aprovadorNome, setAprovadorNome] = useState('Roberto Silva (Diretor Comercial)');
  const [justificativaAprovacao, setJustificativaAprovacao] = useState(
    'Aprovado com base no LTV de R$ 1.2M e zero inadimplência.'
  );
  const [processandoAprovacao, setProcessandoAprovacao] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'sintese' | 'dag' | 'dominios' | 'telemetria'>('sintese');

  async function handleExecutar(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!solicitacao.trim() || carregando) return;

    setCarregando(true);
    setErro(null);

    try {
      const res = await executarMultiagente({
        solicitacao,
        solicitante,
        departamento,
      });
      setResultado(res);
      setAbaAtiva('sintese');
    } catch (err: any) {
      setErro(err.message || 'Falha ao processar solicitação multi-agente.');
    } finally {
      setCarregando(false);
    }
  }

  async function handleResponderAprovacao(decisao: 'aprovado' | 'rejeitado') {
    if (!resultado?.aprovacaoHitl?.id || processandoAprovacao) return;

    setProcessandoAprovacao(true);
    try {
      await responderAprovacaoHitl(resultado.aprovacaoHitl.id, {
        decisao,
        aprovador: aprovadorNome,
        justificativa: justificativaAprovacao,
      });

      setResultado((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: decisao === 'aprovado' ? 'concluido' : 'rejeitado',
          aprovacaoHitl: {
            ...prev.aprovacaoHitl!,
            status: decisao,
            aprovador: aprovadorNome,
            justificativa: justificativaAprovacao,
          },
        };
      });
    } catch (err: any) {
      alert(`Erro ao registrar aprovação: ${err.message}`);
    } finally {
      setProcessandoAprovacao(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho da Plataforma */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold mb-3">
              <Workflow className="w-3.5 h-3.5 text-purple-400" />
              <span>Arquitetura Multi-Agents Corporativa • 5.000+ Colaboradores</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Orquestrador Multi-Agents & HITL</span>
              <span className="text-xs bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-mono font-normal">
                LangGraph + MCP
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Resolução orquestrada de solicitações transversais (Comercial, Financeiro e Jurídico), com Guardrails
              de segurança, ferramentas via protocolo MCP e aprovações formais <strong>Human-in-the-Loop</strong>.
            </p>
          </div>

          <button
            onClick={() => {
              setSolicitacao(CASO_XPTO_PROMPT);
              setDepartamento('Comercial');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] shadow-sm hover:border-purple-400"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Carregar Caso XPTO (Desconto de 10%)</span>
          </button>
        </div>
      </div>

      {/* Formulário de Solicitação */}
      <form onSubmit={handleExecutar} className="glass-panel rounded-2xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pb-4 border-b border-white/[0.08]">
          <span className="font-semibold text-slate-200 flex items-center gap-2 text-sm">
            <Bot className="w-4 h-4 text-cyan-400" />
            Solicitação em Linguagem Natural
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-white/[0.08] text-slate-400 text-xs">
              <span className="text-slate-500">Solicitante:</span>
              <input
                type="text"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none w-36"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-white/[0.08] text-slate-400 text-xs">
              <span className="text-slate-500">Departamento:</span>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none"
              >
                <option value="Comercial" className="bg-slate-900">Comercial</option>
                <option value="Financeiro" className="bg-slate-900">Financeiro</option>
                <option value="Jurídico" className="bg-slate-900">Jurídico</option>
                <option value="RH" className="bg-slate-900">RH</option>
                <option value="Operações" className="bg-slate-900">Operações</option>
              </select>
            </div>
          </div>
        </div>

        <textarea
          rows={3}
          value={solicitacao}
          onChange={(e) => setSolicitacao(e.target.value)}
          placeholder="Digite o que deseja solicitar para a inteligência artificial multi-agentes..."
          className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/50 transition-all font-sans leading-relaxed"
          required
        />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Protegido por Input Guardrails: Presidio PII Masking + Anti-Prompt Injection</span>
          </div>

          <button
            type="submit"
            disabled={carregando || !solicitacao.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-purple-600/25 active:scale-95"
          >
            {carregando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Orquestrando Agentes & MCP...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Disparar Orquestrador Multi-Agentes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {erro && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{erro}</span>
        </div>
      )}

      {/* ÁREA DE RESULTADOS DA ORQUESTRAÇÃO */}
      {resultado && (
        <div className="space-y-6">
          {/* BANNER 1: HUMAN-IN-THE-LOOP (CARD INTERATIVO DE APROVAÇÃO) */}
          {resultado.status === 'aguardando_aprovacao' && resultado.aprovacaoHitl && (
            <div className="glass-panel-glow rounded-2xl p-6 sm:p-7 border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-950 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/30">
                <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <span>Human-in-the-Loop (HITL): Alçada de Aprovação Requerida</span>
                    <span className="block text-xs font-normal text-amber-400/80">
                      Gatilho de governança disparado automaticamente pela análise contratual
                    </span>
                  </div>
                </div>
                <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-mono font-semibold">
                  STATUS: SUSPENDED_AWAITING_APPROVAL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/[0.08]">
                  <span className="text-slate-400 block mb-1">Cliente & Proposta:</span>
                  <span className="font-bold text-white text-base">{resultado.decisao?.descontoSolicitado}% de Desconto</span>
                  <p className="text-slate-400 mt-1 font-mono text-[11px]">Ref: {resultado.propostaGerada?.propostaId}</p>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/[0.08]">
                  <span className="text-slate-400 block mb-1">Impacto Financeiro:</span>
                  <span className="font-bold text-emerald-400 text-base">Margem Final: {resultado.decisao?.margemFinalPercentual}%</span>
                  <p className="text-slate-400 mt-1 text-[11px]">Piso Corporativo Mínimo: 18%</p>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/[0.08]">
                  <span className="text-slate-400 block mb-1">Motivo do Gatilho:</span>
                  <span className="font-semibold text-amber-300">Cláusula 8.2 do Contrato</span>
                  <p className="text-slate-400 mt-1 text-[11px]">Descontos acima de 5% exigem anuência da Diretoria Comercial.</p>
                </div>
              </div>

              {/* Controles de Ação do Aprovador */}
              <div className="bg-slate-950/90 p-5 rounded-xl border border-amber-500/25 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1.5">Nome do Diretor / Aprovador:</label>
                    <input
                      type="text"
                      value={aprovadorNome}
                      onChange={(e) => setAprovadorNome(e.target.value)}
                      className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1.5">Justificativa / Parecer Formal:</label>
                    <input
                      type="text"
                      value={justificativaAprovacao}
                      onChange={(e) => setJustificativaAprovacao(e.target.value)}
                      className="w-full bg-slate-900 border border-white/[0.1] rounded-lg px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleResponderAprovacao('rejeitado')}
                    disabled={processandoAprovacao}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rejeitar Desconto</span>
                  </button>

                  <button
                    onClick={() => handleResponderAprovacao('aprovado')}
                    disabled={processandoAprovacao}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprovar Desconto & Despachar Proposta</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BANNER 2: CASO JÁ APROVADO */}
          {resultado.status === 'concluido' && resultado.aprovacaoHitl?.aprovador && (
            <div className="glass-panel border-emerald-500/40 bg-emerald-950/20 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="font-semibold text-white block">
                    Aprovado formalmente por {resultado.aprovacaoHitl.aprovador}
                  </span>
                  <span className="text-emerald-400/90 italic">"{resultado.aprovacaoHitl.justificativa}"</span>
                </div>
              </div>
              <span className="font-mono bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 text-emerald-300">
                Workflow Finalizado & Despachado
              </span>
            </div>
          )}

          {/* BARRA DE NAVEGAÇÃO DE ABAS */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3 text-xs">
            <button
              onClick={() => setAbaAtiva('sintese')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                abaAtiva === 'sintese'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/[0.05]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Relatório Executivo</span>
            </button>

            <button
              onClick={() => setAbaAtiva('dag')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                abaAtiva === 'dag'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/[0.05]'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Grafo de Execução (DAG)</span>
            </button>

            <button
              onClick={() => setAbaAtiva('dominios')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                abaAtiva === 'dominios'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/[0.05]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Evidências por Domínio (MCP)</span>
            </button>

            <button
              onClick={() => setAbaAtiva('telemetria')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                abaAtiva === 'telemetria'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/[0.05]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>FinOps & Telemetria</span>
            </button>
          </div>

          {/* ABA 1: SÍNTESE EXECUTIVA */}
          {abaAtiva === 'sintese' && (
            <div className="glass-panel rounded-2xl p-6 sm:p-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08] text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Parecer Consolidado do Orquestrador
                </span>
                <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/25 px-2.5 py-1 rounded-full font-mono">
                  Groundedness Score: {Math.round(resultado.guardrails.scoreGroundedness * 100)}%
                </span>
              </div>

              <div className="p-2">
                <MarkdownRenderer conteudo={resultado.respostaSintetizada} />
              </div>

              {resultado.propostaGerada && (
                <div className="mt-4 p-4 bg-slate-950/80 border border-white/[0.08] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold text-white block">{resultado.propostaGerada.titulo}</span>
                      <span className="text-slate-400">Minuta Oficial gerada pelo servidor CLM Legal MCP</span>
                    </div>
                  </div>
                  <a
                    href={resultado.propostaGerada.arquivoGerado}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                  >
                    <span>Baixar Minuta PDF</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ABA 2: GRAFO DE EXECUÇÃO (DAG) */}
          {abaAtiva === 'dag' && (
            <div className="glass-panel rounded-2xl p-6 sm:p-7 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-purple-400" />
                  Orquestração de Tarefas em Grafo (LangGraph + Workers)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  O Supervisor decompôs a intenção em sub-tarefas especializadas, executando as consultas aos sistemas de forma coordenada.
                </p>
              </div>

              <div className="grid gap-3 pt-2">
                {resultado.plano.map((task, idx) => (
                  <div
                    key={task.id}
                    className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.08] flex items-center justify-between text-xs hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-white text-sm block">{task.agente}</span>
                        <span className="text-slate-400">{task.descricao}</span>
                      </div>
                    </div>

                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-mono text-[11px] font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Concluído
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 3: EVIDÊNCIAS COLETADAS POR DOMÍNIO (MCP) */}
          {abaAtiva === 'dominios' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card Comercial */}
              <div className="glass-panel rounded-2xl p-6 space-y-4 border-blue-500/20">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <span className="font-bold text-blue-400 text-xs flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Comercial (Salesforce MCP)
                  </span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded font-mono">CRM</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Classificação:</span>
                    <span className="font-semibold text-white">{resultado.resultadosAgentes.comercial?.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">LTV Acumulado:</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      R$ {resultado.resultadosAgentes.comercial?.ltvTotal?.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tempo de Casa:</span>
                    <span>{resultado.resultadosAgentes.comercial?.tempoDeCasaAnos} anos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Churn Risk:</span>
                    <span className="text-emerald-400 font-semibold">{resultado.resultadosAgentes.comercial?.churnRisk}</span>
                  </div>
                </div>
              </div>

              {/* Card Financeiro */}
              <div className="glass-panel rounded-2xl p-6 space-y-4 border-emerald-500/20">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Financeiro (SAP ERP MCP)
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">ERP</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Títulos Vencidos:</span>
                    <span className="font-bold text-emerald-400">{resultado.resultadosAgentes.financeiro?.titulosVencidos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Score de Crédito:</span>
                    <span className="font-mono text-white font-semibold">{resultado.resultadosAgentes.financeiro?.scoreCreditoSerasa} / 1000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bloqueio Financeiro:</span>
                    <span className="text-emerald-400 font-semibold">Nenhum</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conceito:</span>
                    <span className="text-blue-300 font-semibold">{resultado.resultadosAgentes.financeiro?.conceitoFinanceiro}</span>
                  </div>
                </div>
              </div>

              {/* Card Jurídico */}
              <div className="glass-panel rounded-2xl p-6 space-y-4 border-purple-500/20">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <span className="font-bold text-purple-400 text-xs flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Jurídico (CLM Legal MCP)
                  </span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-mono">CLM</span>
                </div>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contrato Ref:</span>
                    <span className="font-mono text-white">{resultado.resultadosAgentes.juridico?.contratoNumero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vigência Atual:</span>
                    <span>Até {resultado.resultadosAgentes.juridico?.vigenciaFim}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Índice Reajuste:</span>
                    <span className="text-blue-300 font-mono">{resultado.resultadosAgentes.juridico?.indiceReajusteAnual}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic pt-2 border-t border-white/[0.08] leading-relaxed">
                    "{resultado.resultadosAgentes.juridico?.clausulaRenovacao?.texto}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: FINOPS & TELEMETRIA OPENTELEMETRY */}
          {abaAtiva === 'telemetria' && (
            <div className="glass-panel rounded-2xl p-6 sm:p-7 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Painel de FinOps & Atribuição de Custos por Departamento
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Métricas capturadas em tempo real via OpenTelemetry: consumo de tokens e custos segregados.
                </p>
              </div>

              {/* Indicadores Globais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/[0.08]">
                  <span className="text-xs text-slate-400 block mb-1">Duração Total</span>
                  <span className="text-xl font-bold text-white font-mono">{resultado.telemetria.duracaoTotalMs} ms</span>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/[0.08]">
                  <span className="text-xs text-slate-400 block mb-1">Total de Tokens</span>
                  <span className="text-xl font-bold text-cyan-400 font-mono">{resultado.telemetria.totalTokens}</span>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/[0.08]">
                  <span className="text-xs text-slate-400 block mb-1">Custo Total (USD)</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono">US$ {resultado.telemetria.totalCustoUsd}</span>
                </div>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/[0.08]">
                  <span className="text-xs text-slate-400 block mb-1">Custo Total (BRL)</span>
                  <span className="text-xl font-bold text-purple-400 font-mono">R$ {resultado.telemetria.totalCustoBrl}</span>
                </div>
              </div>

              {/* Rateio por Departamento */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Rateio Contábil de Tokens por Departamento
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(resultado.telemetria.custoPorDepartamento).map(([depto, dados]) => (
                    <div key={depto} className="bg-slate-950/80 p-4 rounded-xl border border-white/[0.08] text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span>{depto}</span>
                        <span className="text-cyan-400 font-mono">{dados.tokens} tokens</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>Custo Real:</span>
                        <span className="font-mono text-emerald-400">US$ {dados.custoUsd} (R$ {dados.custoBrl})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabela de Spans */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Traces & Spans de Execução (OpenTelemetry)
                </h4>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-white/[0.08] divide-y divide-white/[0.05] bg-slate-950/80 text-xs">
                  {resultado.telemetria.spans.map((span) => (
                    <div key={span.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white block">{span.nome}</span>
                        <span className="text-[11px] text-slate-400">
                          {span.agente || span.tipo} • Depto: {span.departamento}
                        </span>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <span className="text-purple-400 block">{span.duracaoMs} ms</span>
                        <span className="text-slate-400">{span.tokensEntrada + span.tokensSaida} tokens</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
