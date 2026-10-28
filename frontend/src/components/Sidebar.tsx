'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Stethoscope,
  BookOpen,
  Search,
  BarChart3,
  BrainCircuit,
  Radio,
  FileCode2,
} from 'lucide-react';
import { checarSaudeApi } from '../lib/api';

const itensNavegacao = [
  {
    nome: 'Chat Inteligente (RAG)',
    href: '/',
    icone: MessageSquare,
    descricao: 'Tirar dúvidas com fontes',
  },
  {
    nome: 'Diagnóstico de Erros',
    href: '/diagnostico',
    icone: Stethoscope,
    descricao: 'LangGraph & Fatos vs Hipóteses',
  },
  {
    nome: 'Biblioteca de Manuais',
    href: '/documentos',
    icone: BookOpen,
    descricao: 'Upload e gestão de PDFs/APIs',
  },
  {
    nome: 'Pesquisa Técnica',
    href: '/busca',
    icone: Search,
    descricao: 'Busca híbrida de trechos',
  },
  {
    nome: 'Métricas & Lacunas',
    href: '/metricas',
    icone: BarChart3,
    descricao: 'Auditoria de conhecimento',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const nomeApp = process.env.NEXT_PUBLIC_NOME_APP || 'DocMind — ERP Knowledge AI';

  useEffect(() => {
    async function verificar() {
      const { online } = await checarSaudeApi();
      setApiOnline(online);
    }
    verificar();
    const intervalo = setInterval(verificar, 15000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 h-screen sticky top-0">
      <div>
        {/* Cabeçalho / Logo */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800 mb-6">
          <div className="bg-blue-600/20 p-2 rounded-xl text-blue-400 border border-blue-500/30">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">DocMind</h1>
            <p className="text-xs text-slate-400">ERP Knowledge AI</p>
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="space-y-1">
          {itensNavegacao.map((item) => {
            const Icone = item.icone;
            const ativo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  ativo
                    ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icone className="w-4 h-4 shrink-0" />
                <div className="overflow-hidden">
                  <div className="truncate">{item.nome}</div>
                  <div className="text-[10px] text-slate-400/80 truncate">{item.descricao}</div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Rodapé: Status da API Backend */}
      <div className="border-t border-slate-800 pt-4 px-2 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            Backend API:
          </span>
          <span
            className={`flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-full text-[11px] ${
              apiOnline === true
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : apiOnline === false
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiOnline === true
                  ? 'bg-emerald-400 animate-pulse'
                  : apiOnline === false
                  ? 'bg-red-400'
                  : 'bg-amber-400'
              }`}
            />
            {apiOnline === true ? 'Online (3000)' : apiOnline === false ? 'Offline' : 'Checando...'}
          </span>
        </div>

        <a
          href="http://localhost:3000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700/50"
        >
          <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
          Swagger OpenAPI
        </a>
      </div>
    </aside>
  );
}

