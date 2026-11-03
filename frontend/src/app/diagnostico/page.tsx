'use client';

import React, { useState } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Lightbulb,
  ListOrdered,
  Search,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { diagnosticarErro } from '../../lib/api';
import { RespostaDiagnostico } from '../../lib/types';

export default function PaginaDiagnostico() {
  const [sistema, setSistema] = useState(process.env.NEXT_PUBLIC_SISTEMA_PADRAO || 'Volpe');
  const [modulo, setModulo] = useState(process.env.NEXT_PUBLIC_MODULO_PADRAO || 'Financeiro');
  const [codigoErro, setCodigoErro] = useState('HTTP 400');
  const [operacao, setOperacao] = useState('Cadastrar Título Financeiro');
  const [logErro, setLogErro] = useState(
    'Erro 400: Campo obrigatório "cod_historico" ausente no objeto de rateio.'
  );
  const [dadosEnviados, setDadosEnviados] = useState(
    JSON.stringify(
      {
        valor: 1500.5,
        tipo: 'P',
        fornecedor: '10293',
        parcelas: [{ numero: 1, vencimento: '2026-11-15' }],
      },
      null,
      2
    )
  );

  const [carregando, setCarregando] = useState(false);
  const [diagnostico, setDiagnostico] = useState<RespostaDiagnostico | null>(null);
  const [erroApi, setErroApi] = useState<string | null>(null);

  async function handleDiagnosticar(e: React.FormEvent) {
    e.preventDefault();
    if (!logErro.trim() || carregando) return;

    setCarregando(true);
    setErroApi(null);

    try {
      const res = await diagnosticarErro({
        sistema,
        modulo,
        codigoErro,
        logErro,
        dadosEnviados,
        operacao,
      });
      setDiagnostico(res);
    } catch (err: any) {
      setErroApi(err.message || 'Falha ao processar diagnóstico.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-semibold mb-3">
            <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
            <span>Triagem Técnica Automatizada</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Diagnóstico Guiado de Erros & Logs</span>
            <span className="text-xs bg-blue-500/15 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full font-mono font-normal">
              LangGraph Reasoner
            </span>
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            Orquestrado via <strong>LangGraph</strong>: a IA analisa exceções, códigos de erro e payloads enviados,
            separando categoricamente <strong>Fatos Documentados</strong> de <strong>Hipóteses Técnicas</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário de Entrada */}
        <form
          onSubmit={handleDiagnosticar}
          className="lg:col-span-5 glass-panel rounded-2xl p-6 space-y-4"
        >
          <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Dados do Incidente Reportado</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-mono uppercase bg-slate-950/80 px-2 py-0.5 rounded border border-white/[0.06]">
              Input Telemetry
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Sistema ERP:</label>
              <input
                type="text"
                value={sistema}
                onChange={(e) => setSistema(e.target.value)}
                className="w-full mt-1.5 bg-slate-950/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Módulo Afetado:</label>
              <input
                type="text"
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                className="w-full mt-1.5 bg-slate-950/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium">Código do Erro:</label>
              <input
                type="text"
                value={codigoErro}
                onChange={(e) => setCodigoErro(e.target.value)}
                className="w-full mt-1.5 bg-slate-950/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                placeholder="Ex: HTTP 400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium">Operação:</label>
              <input
                type="text"
                value={operacao}
                onChange={(e) => setOperacao(e.target.value)}
                className="w-full mt-1.5 bg-slate-950/80 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Ex: Importar NF"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>Mensagem de Erro / Stack Trace:</span>
            </label>
            <textarea
              rows={3}
              value={logErro}
              onChange={(e) => setLogErro(e.target.value)}
              className="w-full mt-1.5 bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
              <span>Payload / Dados Enviados:</span>
              <span className="text-[10px] text-slate-500 font-mono">JSON / XML</span>
            </label>
            <textarea
              rows={4}
              value={dadosEnviados}
              onChange={(e) => setDadosEnviados(e.target.value)}
              className="w-full mt-1.5 bg-slate-950/80 border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={carregando || !logErro.trim()}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25 active:scale-95"
          >
            {carregando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executando Grafo LangGraph...</span>
              </>
            ) : (
              <>
                <Stethoscope className="w-4 h-4" />
                <span>Diagnosticar Problema</span>
              </>
            )}
          </button>

          {erroApi && (
            <p className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              {erroApi}
            </p>
          )}
        </form>

        {/* Painel de Resultados do Diagnóstico */}
        <div className="lg:col-span-7 space-y-6">
          {diagnostico ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Badge de Confiança */}
              <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-white text-sm">Nível de Confiança da Análise</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Classificação analítica baseada nas evidências encontradas no manual.</p>
                </div>
                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold capitalize font-mono ${
                    diagnostico.confianca === 'alta'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : diagnostico.confianca === 'media'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  Confiança: {diagnostico.confianca}
                </span>
              </div>

              {/* Card 1: Fatos Documentados */}
              <div className="glass-panel border-emerald-500/20 rounded-2xl p-6 space-y-3.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. Fatos Comprovados na Documentação</span>
                </div>
                <ul className="space-y-2">
                  {diagnostico.fatosDocumentados.map((fato, i) => (
                    <li key={i} className="text-xs text-slate-200 bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/20 leading-relaxed">
                      {fato}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 2: Hipóteses Técnicas */}
              <div className="glass-panel border-amber-500/20 rounded-2xl p-6 space-y-3.5">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                  <Lightbulb className="w-4 h-4" />
                  <span>2. Hipóteses Analíticas da IA (Exigem Verificação)</span>
                </div>
                <ul className="space-y-2">
                  {diagnostico.hipotesesTecnicas.map((hipotese, i) => (
                    <li key={i} className="text-xs text-slate-200 bg-amber-950/30 p-3 rounded-xl border border-amber-500/20 leading-relaxed">
                      {hipotese}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 3: Próximos Passos */}
              <div className="glass-panel border-blue-500/20 rounded-2xl p-6 space-y-3.5">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                  <ListOrdered className="w-4 h-4" />
                  <span>3. Checklist de Investigação Recomendado</span>
                </div>
                <ul className="space-y-2">
                  {diagnostico.passosInvestigacao.map((passo, i) => (
                    <li key={i} className="text-xs text-slate-200 bg-blue-950/30 p-3 rounded-xl border border-blue-500/20 leading-relaxed">
                      {passo}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 4: Fontes Consultadas */}
              {diagnostico.fontes && diagnostico.fontes.length > 0 && (
                <div className="glass-panel rounded-2xl p-6 space-y-3.5">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Manuais e Páginas Consultadas pelo Grafo:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {diagnostico.fontes.map((src, i) => (
                      <div key={i} className="bg-slate-950/80 p-3 rounded-xl border border-white/[0.08] text-xs">
                        <div className="font-medium text-white truncate">{src.tituloDocumento}</div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1.5">
                          <span>{src.modulo}</span>
                          <span className="font-mono bg-white/[0.05] px-2 py-0.5 rounded text-[10px]">Pág. {src.numeroPagina || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel border-dashed border-white/10 rounded-2xl p-14 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-500">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Nenhum diagnóstico gerado ainda</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Preencha os dados do erro ou log no painel à esquerda e clique em "Diagnosticar Problema" para rodar o fluxo no LangGraph.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
