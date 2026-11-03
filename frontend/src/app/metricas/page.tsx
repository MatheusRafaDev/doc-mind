'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Layers,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  obterVisaoGeralMetricas,
  obterLacunasConhecimento,
  resolverLacuna,
} from '../../lib/api';
import { VisaoGeralMetricas, LacunaConhecimento } from '../../lib/types';

export default function PaginaMetricas() {
  const [metricas, setMetricas] = useState<VisaoGeralMetricas | null>(null);
  const [lacunas, setLacunas] = useState<LacunaConhecimento[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarDados() {
    setCarregando(true);
    try {
      const [m, l] = await Promise.all([
        obterVisaoGeralMetricas(),
        obterLacunasConhecimento(),
      ]);
      setMetricas(m);
      setLacunas(l);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function handleResolver(id: string) {
    try {
      await resolverLacuna(id);
      await carregarDados();
    } catch (err) {
      alert('Erro ao marcar lacuna como resolvida.');
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-3">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Governança & Observabilidade de Conhecimento</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Métricas & Lacunas de Documentação</span>
              <span className="text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-mono font-normal">
                Continuous Learning
              </span>
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Acompanhe o volume indexado no cluster vetorial e identifique proativamente dúvidas reais de colaboradores
              que os manuais existentes ainda não cobrem.
            </p>
          </div>

          <button
            onClick={carregarDados}
            disabled={carregando}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] text-slate-200 text-xs font-medium rounded-xl transition-all shadow-sm hover:scale-[1.02]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>Atualizar Indicadores</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-panel rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-60" />
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-300">Manuais Cadastrados</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {metricas ? metricas.totalDocumentos : '...'}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">PDFs, APIs e tabelas catalogadas</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-60" />
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-300">Fragmentos Vetorizados</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {metricas ? metricas.totalFragmentos : '...'}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Chunks indexados no pgvector</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60" />
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-300">Consultas & Diálogos</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {metricas ? metricas.totalConversas : '...'}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Interações com RAG atendidas</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400 opacity-60" />
          <div className="flex items-center justify-between text-amber-300 text-xs">
            <span className="font-medium text-amber-300">Lacunas Pendentes</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-300 tracking-tight">
            {metricas ? metricas.lacunasPendentes : '...'}
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Dúvidas sem respaldo documental</p>
        </div>
      </div>

      {/* Tabela de Lacunas de Conhecimento */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Relatório de Lacunas de Conhecimento (Knowledge Gaps)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Cada registro abaixo representa uma dúvida real submetida por um colaborador em que a base documental não continha
            informações com score suficiente. Utilize este mapa de oportunidades para guiar a criação de novos manuais.
          </p>
        </div>

        {carregando ? (
          <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Consolidando auditoria de gaps...</span>
          </div>
        ) : lacunas.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-2xl bg-slate-950/40">
            🎉 Base 100% calibrada! Nenhuma lacuna documental pendente registrada no sistema.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-slate-950/70">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 font-medium bg-white/[0.02]">
                  <th className="py-3.5 px-4">Pergunta do Usuário</th>
                  <th className="py-3.5 px-4">Sistema / Módulo</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ação de Auditoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {lacunas.map((lacuna) => (
                  <tr key={lacuna.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-white font-medium max-w-md">
                      <div>{lacuna.pergunta}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{lacuna.motivo}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="bg-slate-900 border border-white/[0.08] px-2.5 py-1 rounded-md text-[11px]">
                        {lacuna.sistema || 'Geral'} • {lacuna.modulo || 'Todos'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {lacuna.resolvido === 1 ? (
                        <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolvida
                        </span>
                      ) : (
                        <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 w-fit">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {lacuna.resolvido === 0 ? (
                        <button
                          onClick={() => handleResolver(lacuna.id)}
                          className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors hover:border-blue-400"
                        >
                          Marcar Resolvida
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-mono">Concluída</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
