'use client';

import React from 'react';

interface LogoProps {
  tamanho?: 'sm' | 'md' | 'lg';
  comTexto?: boolean;
  comSubtitulo?: boolean;
  className?: string;
}

export function Logo({
  tamanho = 'md',
  comTexto = true,
  comSubtitulo = true,
  className = '',
}: LogoProps) {
  const dimensoesIcone = {
    sm: { w: 26, h: 26 },
    md: { w: 34, h: 34 },
    lg: { w: 46, h: 46 },
  }[tamanho];

  const tamanhoTexto = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  }[tamanho];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Símbolo Vetorial DocMind (Layers de Documentos + Córtex Neural + Brilho) */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Glow de Fundo */}
        <div
          className="absolute inset-0 bg-blue-500/20 blur-md rounded-xl"
          style={{ width: dimensoesIcone.w, height: dimensoesIcone.h }}
        />

        <svg
          width={dimensoesIcone.w}
          height={dimensoesIcone.h}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="docmind-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="docmind-grad-layer" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Folha Inferior (Camada de Dados) */}
          <rect
            x="6"
            y="14"
            width="22"
            height="20"
            rx="5"
            fill="url(#docmind-grad-layer)"
            stroke="#475569"
            strokeWidth="1.2"
            opacity="0.8"
          />

          {/* Folha Superior Principal (Manual / Documento) */}
          <rect
            x="12"
            y="6"
            width="22"
            height="22"
            rx="5"
            fill="#0f172a"
            stroke="url(#docmind-grad-1)"
            strokeWidth="1.6"
          />

          {/* Linhas de Documentação */}
          <path d="M16 11H26" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 15H23" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />

          {/* Cérebro / Sinapse Neural Interconectada */}
          <circle cx="27" cy="21" r="3" fill="#38bdf8" filter="url(#glow-filter)" />
          <circle cx="21" cy="27" r="2.5" fill="#8b5cf6" filter="url(#glow-filter)" />
          <circle cx="31" cy="29" r="2.5" fill="#3b82f6" filter="url(#glow-filter)" />

          {/* Sinapses (Conexões Vetoriais) */}
          <path d="M27 21L21 27" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          <path d="M27 21L31 29" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          <path d="M21 27L31 29" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
        </svg>
      </div>

      {/* Tipografia da Marca */}
      {comTexto && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-tight text-white ${tamanhoTexto}`}>
              Doc<span className="text-gradient-brand">Mind</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              AI
            </span>
          </div>

          {comSubtitulo && (
            <span className="text-[10.5px] font-medium text-slate-400/90 tracking-wide mt-1">
              ERP Knowledge Platform
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default Logo;
