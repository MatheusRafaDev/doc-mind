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
  Radio,
  FileCode2,
  Bot,
  Database,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { checarSaudeApi } from '../lib/api';
import Logo from './Logo';

interface ItemNavegacao {
  nome: string;
  href: string;
  icone: any;
  descricao: string;
  destaque?: string;
}

interface GrupoNavegacao {
  categoria: string;
  itens: ItemNavegacao[];
}

const gruposNavegacao: GrupoNavegacao[] = [
  {
    categoria: 'WORKSPACE & IA',
    itens: [
      {
        nome: 'Chat Inteligente (RAG)',
        href: '/',
        icone: MessageSquare,
        descricao: 'Perguntas com citações de páginas',
      },
      {
        nome: 'Multi-Agentes & HITL',
        href: '/multi-agente',
        icone: Bot,
        descricao: 'LangGraph, MCP & Aprovações',
        destaque: 'v2.0',
      },
      {
        nome: 'Diagnóstico de Erros',
        href: '/diagnostico',
        icone: Stethoscope,
        descricao: 'Análise de logs e incidentes',
      },
    ],
  },
  {
    categoria: 'BASE DE CONHECIMENTO',
    itens: [
      {
        nome: 'Biblioteca de Manuais',
        href: '/documentos',
        icone: BookOpen,
        descricao: 'Upload e gestão de PDFs e MD',
      },
      {
        nome: 'Pesquisa Técnica',
        href: '/busca',
        icone: Search,
        descricao: 'Busca híbrida de trechos',
      },
    ],
  },
  {
    categoria: 'GOVERNANÇA',
    itens: [
      {
        nome: 'Métricas & Lacunas',
        href: '/metricas',
        icone: BarChart3,
        descricao: 'Auditoria e tópicos sem cobertura',
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    async function verificar() {
      const { online } = await checarSaudeApi();
      setApiOnline(online);
    }
    verificar();
    const intervalo = setInterval(verificar, 12000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <aside className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 backdrop-blur-md">
      {/* Topo / Logo */}
      <div className="p-4 overflow-y-auto">
        <div className="px-2 py-2 border-b border-slate-800/60 mb-5">
          <Link href="/" className="hover:opacity-90 transition-opacity block">
            <Logo tamanho="md" comTexto comSubtitulo />
          </Link>
        </div>

        {/* Grupos de Navegação */}
        <div className="space-y-6">
          {gruposNavegacao.map((grupo) => (
            <div key={grupo.categoria} className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 block font-mono">
                {grupo.categoria}
              </span>

              {grupo.itens.map((item) => {
                const Icone = item.icone;
                const ativo = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                      ativo
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/10 text-white font-semibold border border-blue-500/30 shadow-md shadow-blue-600/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Borda Esquerda Ativa Neon */}
                    {ativo && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full" />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg transition-colors ${
                          ativo
                            ? 'bg-blue-500/20 text-cyan-300'
                            : 'bg-slate-900/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                        }`}
                      >
                        <Icone className="w-4 h-4 shrink-0" />
                      </div>

                      <div className="truncate">
                        <span className="block truncate text-[12.5px] leading-tight">{item.nome}</span>
                        <span className="text-[10px] text-slate-500 truncate block mt-0.5 font-normal">
                          {item.descricao}
                        </span>
                      </div>
                    </div>

                    {item.destaque && (
                      <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-mono shrink-0">
                        {item.destaque}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé: Conectividade & Perfil */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
        {/* Status da API Fastify & PostgreSQL */}
        <div className="flex items-center justify-between text-[11px] px-1">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            Backend Fastify:
          </span>
          <span
            className={`flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-full text-[10px] font-mono ${
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
            {apiOnline === true ? 'Online :3000' : apiOnline === false ? 'Offline' : 'Checando...'}
          </span>
        </div>

        {/* Link Rápido para Swagger /docs */}
        <a
          href="http://localhost:3000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full py-1.5 px-2.5 bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition-colors border border-slate-800"
        >
          <span className="flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
            <span>OpenAPI Docs</span>
          </span>
          <ChevronRight className="w-3 h-3 text-slate-500" />
        </a>

        {/* Perfil do Colaborador Autenticado */}
        <div className="flex items-center gap-2.5 pt-1 px-1 text-xs">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-[11px] shadow-sm">
            CR
          </div>
          <div className="overflow-hidden min-w-0">
            <span className="font-semibold text-slate-200 block truncate text-[11.5px] leading-tight">
              Carlos Ribeiro
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
              Nível Especialista • ERP
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
