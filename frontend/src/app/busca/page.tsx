'use client';

import React, { useState } from 'react';
import { Search, BookOpen, Layers, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { executarBuscaHibrida } from '../../lib/api';
import { FragmentoBusca } from '../../lib/types';

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
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
          <Search className="w-4 h-4" />
          <span>Motor de Recuperação</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">Pesquisa Técnica Híbrida</h1>
        <p className="text-sm text-slate-400 mt-1">
          Combina <strong>pgvector</strong> (distância de cosseno semântica 75%) com busca textual exata (25%) para localizar
          tabelas SQL, endpoints REST e procedimentos.
        </p>
      </div>

      {/* Barra de Pesquisa */}
      <form onSubmit={handleBuscar} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Digite o nome da tabela, endpoint, código de erro ou procedimento (ex: SP_INTEGRA_TITULO)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={carregando || !termo.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
          >
            {carregando ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Buscar</span>
          </button>
        </div>

        {/* Filtros Opcionais */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            Filtrar por:
          </span>
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
            <span className="text-slate-500">Sistema:</span>
            <input
              type="text"
              value={sistema}
              onChange={(e) => setSistema(e.target.value)}
              className="bg-transparent text-slate-200 w-16 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
            <span className="text-slate-500">Módulo:</span>
            <input
              type="text"
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              className="bg-transparent text-slate-200 w-20 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
            <span className="text-slate-500">Versão:</span>
            <input
              type="text"
              value={versao}
              onChange={(e) => setVersao(e.target.value)}
              className="bg-transparent text-slate-200 w-14 focus:outline-none"
            />
          </div>
        </div>
      </form>

      {/* Resultados */}
      <div className="space-y-4">
        {buscou && (
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {carregando
              ? 'Buscando nos vetores do pgvector...'
              : `Resultados Encontrados (${resultados.length})`}
          </h2>
        )}

        {resultados.length > 0 ? (
          <div className="grid gap-4">
            {resultados.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-white">{item.tituloDocumento}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{item.modulo}</span>
                    <span className="text-slate-600 font-mono">v{item.versao}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 font-mono">
                      Pág. {item.numeroPagina || 'N/A'}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px] font-mono font-medium">
                      {(item.pontuacao * 100).toFixed(1)}% match
                    </span>
                  </div>
                </div>

                {item.tituloCapitulo && (
                  <div className="text-xs text-blue-300 font-medium bg-blue-950/20 px-2.5 py-1 rounded border border-blue-900/30 inline-block">
                    {item.tituloCapitulo}
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap">
                  {item.conteudo}
                </p>
              </div>
            ))}
          </div>
        ) : buscou && !carregando ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
            Nenhum trecho documental atingiu o score mínimo de relevância para "{termo}".
          </div>
        ) : null}
      </div>
    </div>
  );
}

