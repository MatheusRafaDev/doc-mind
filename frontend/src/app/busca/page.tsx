'use client';

import React, { useState } from 'react';
import { Search, BookOpen, Layers, CheckCircle2, SlidersHorizontal, Sparkles, Database } from 'lucide-react';
import { executarBuscaHibrida } from '../../lib/api';
import { FragmentoBusca } from '../../lib/types';
import MarkdownRenderer from '../../components/MarkdownRenderer';

export default function PaginaBusca() {
  const [termo, setTermo] = useState('');
  const [sistema, setSistema] = useState(process.env.NEXT_PUBLIC_SISTEMA_PADRAO || 'Volpe');
  const [modulo, setModulo] = useState(process.env.NEXT_PUBLIC_MODULO_PADRAO || 'Financeiro');
  const [versao, setVersao] = useState(process.env.NEXT_PUBLIC_VERSAO_PADRAO || '2026.1');

  const [carregando, setCarregando] = useState(false);
  const [resultados, setResultados] = useState<FragmentoBusca[]>([]);
  const [buscou, setBuscou] = useState(false);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!termo.trim() || carregando) return;

    setCarregando(true);
    setBuscou(true);

    try {
      const res = await executarBuscaHibrida({
        termoBusca: termo,
        sistema,
        modulo,
        versao,
        limite: 8,
      });
      setResultados(res);
    } catch (err) {
      console.error(err);
      setResultados([]);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Cabeçalho */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold mb-3">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Motor de Recuperação Vetorial & Textual</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Pesquisa Técnica Híbrida</span>
            <span className="text-xs bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full font-mono font-normal">
              pgvector + BM25
            </span>
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            Combina <strong>pgvector</strong> (distância de cosseno semântica a 75%) com busca textual exata (25%) para localizar
            tabelas SQL, endpoints REST, rotinas e manuais de implementação em milissegundos.
          </p>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <form onSubmit={handleBuscar} className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Digite o nome da tabela, endpoint, código de erro ou procedimento (ex: SP_INTEGRA_TITULO)..."
              className="w-full bg-slate-950/80 border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
              required
            />
          </div>
          <button
            type="submit"
            disabled={carregando || !termo.trim()}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold px-7 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-600/25 active:scale-95 shrink-0"
          >
            {carregando ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Buscar Trechos</span>
          </button>
        </div>

        {/* Filtros Opcionais */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-2 border-t border-white/[0.06]">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            Escopo da Indexação:
          </span>
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-white/[0.08]">
            <span className="text-slate-500">Sistema:</span>
            <input
              type="text"
              value={sistema}
              onChange={(e) => setSistema(e.target.value)}
              className="bg-transparent text-slate-200 w-16 focus:outline-none font-medium"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-white/[0.08]">
            <span className="text-slate-500">Módulo:</span>
            <input
              type="text"
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              className="bg-transparent text-slate-200 w-24 focus:outline-none font-medium"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-white/[0.08]">
            <span className="text-slate-500">Versão:</span>
            <input
              type="text"
              value={versao}
              onChange={(e) => setVersao(e.target.value)}
              className="bg-transparent text-slate-200 w-16 focus:outline-none font-mono font-medium"
            />
          </div>
        </div>
      </form>

      {/* Resultados */}
      <div className="space-y-4">
        {buscou && (
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider px-1">
            <span>
              {carregando
                ? 'Recuperando vetores similares no pgvector...'
                : `Resultados Encontrados (${resultados.length})`}
            </span>
            <span className="font-mono text-[11px] lowercase text-slate-500">
              similaridade por cosseno
            </span>
          </div>
        )}

        {resultados.length > 0 ? (
          <div className="grid gap-4">
            {resultados.map((item) => (
              <div
                key={item.id}
                className="glass-panel rounded-2xl p-6 space-y-4 hover:border-cyan-500/40 transition-all hover:scale-[1.003]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-white text-sm">{item.tituloDocumento}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300 font-medium">{item.modulo}</span>
                    <span className="text-slate-500 font-mono text-[11px]">v{item.versao}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-slate-950/80 border border-white/[0.08] px-2.5 py-1 rounded-md text-[11px] text-slate-300 font-mono">
                      Pág. {item.numeroPagina || 'N/A'}
                    </span>
                    <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold">
                      {(item.pontuacao * 100).toFixed(1)}% match
                    </span>
                  </div>
                </div>

                {item.tituloCapitulo && (
                  <div className="text-xs text-cyan-300 font-medium bg-cyan-950/30 px-3 py-1 rounded-lg border border-cyan-500/20 inline-block">
                    {item.tituloCapitulo}
                  </div>
                )}

                <div className="bg-slate-950/80 p-5 rounded-xl border border-white/[0.08]">
                  <MarkdownRenderer conteudo={item.conteudo} />
                </div>
              </div>
            ))}
          </div>
        ) : buscou && !carregando ? (
          <div className="glass-panel border-dashed border-white/10 rounded-2xl p-14 text-center text-slate-400 text-xs">
            Nenhum trecho documental atingiu o score mínimo de relevância para "{termo}".
          </div>
        ) : null}
      </div>
    </div>
  );
}
