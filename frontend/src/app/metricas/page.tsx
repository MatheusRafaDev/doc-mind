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
} from 'lucide-react';
import {
  obterVisaoGeralMetricas,
  obterLacunasConhecimento,
  resolverLacuna,
} from '../../lib/api';
import { VisaoGeralMetricas, LacunaConhecimento } from '../../lib/tipos';

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
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <BarChart3 className="w-4 h-4" />
            <span>Governança & Auditoria</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Métricas & Lacunas de Conhecimento</h1>
          <p className="text-sm text-slate-400 mt-1">
            Acompanhe o volume indexado e identifique dúvidas dos usuários que a documentação atual do ERP não responde.
          </p>
        </div>

        <button
          onClick={carregarDados}
          disabled={carregando}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Manuais Cadastrados</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metricas ? metricas.totalDocumentos : '...'}
          </div>
          <p className="text-[11px] text-slate-500">PDFs, APIs e tabelas no banco</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Fragmentos / Páginas</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metricas ? metricas.totalFragmentos : '...'}
          </div>
          <p className="text-[11px] text-slate-500">Vetores indexados no pgvector</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Conversas Realizadas</span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metricas ? metricas.totalConversas : '...'}
          </div>
          <p className="text-[11px] text-slate-500">Consultas de suporte e devs</p>
        </div>

        <div className="bg-slate-900 border border-amber-900/40 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span>Lacunas Pendentes</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {metricas ? metricas.lacunasPendentes : '...'}
          </div>
          <p className="text-[11px] text-slate-500">Dúvidas sem evidência nos manuais</p>
        </div>
      </div>

      {/* Tabela de Lacunas de Conhecimento */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            Relatório de Lacunas de Documentação (Knowledge Gaps)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Cada registro abaixo representa uma pergunta real feita por um usuário na qual o RAG não encontrou informações suficientes nos manuais.
            Use esta lista para direcionar a equipe a escrever novos manuais.
          </p>
        </div>

        {carregando ? (
          <div className="text-center py-8 text-slate-400 text-xs">Carregando lacunas...</div>
        ) : lacunas.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-slate-800/80 rounded-xl bg-slate-950/40">
            🎉 Parabéns! Nenhuma lacuna de conhecimento registrada até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 px-3">Pergunta do Usuário</th>
                  <th className="pb-3 px-3">Sistema / Módulo</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lacunas.map((lacuna) => (
                  <tr key={lacuna.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-white font-medium max-w-md">
                      <div>{lacuna.pergunta}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{lacuna.motivo}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {lacuna.sistema || 'Geral'} • {lacuna.modulo || 'Todos'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {lacuna.resolvido === 1 ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolvida
                        </span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {lacuna.resolvido === 0 ? (
                        <button
                          onClick={() => handleResolver(lacuna.id)}
                          className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                        >
                          Marcar Resolvida
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Concluída</span>
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

