'use client';

import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  BookOpen,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
} from 'lucide-react';
import { enviarPerguntaChat } from '../lib/api';
import { MensagemChat, FonteConsultada } from '../lib/types';
import MarkdownRenderer from '../components/MarkdownRenderer';

const perguntasSugeridas = [
  'Como funciona o processo de importação de notas fiscais no ERP?',
  'Quais são os campos obrigatórios para cadastrar um título a pagar via API?',
  'Onde consulto os logs de erro de integração financeira?',
  'Como parametrizar a alíquota fiscal no módulo de faturamento?',
];

export default function PaginaChat() {
  const [sistema, setSistema] = useState(process.env.NEXT_PUBLIC_SISTEMA_PADRAO || 'Volpe');
  const [modulo, setModulo] = useState(process.env.NEXT_PUBLIC_MODULO_PADRAO || 'Financeiro');
  const [versao, setVersao] = useState(process.env.NEXT_PUBLIC_VERSAO_PADRAO || '2026.1');

  const [conversaId, setConversaId] = useState<string | undefined>(undefined);
  const [pergunta, setPergunta] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [fonteExpandidaIdx, setFonteExpandidaIdx] = useState<string | null>(null);

  const [mensagens, setMensagens] = useState<MensagemChat[]>([
    {
      id: 'boas-vindas',
      papel: 'assistente',
      conteudo: `Olá! Sou o assistente de conhecimento técnico do **DocMind**.
Posso tirar dúvidas sobre parametrizações, APIs, integrações e procedimentos operacionais com base estritamente nos **manuais cadastrados**.

Todas as minhas respostas citam o **manual, capítulo e página de origem**. Como posso ajudar você hoje?`,
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  async function handleEnviar(textoEnviar?: string) {
    const texto = textoEnviar || pergunta;
    if (!texto.trim() || carregando) return;

    const horarioAtual = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const novaMensagemUsuario: MensagemChat = {
      id: `user-${Date.now()}`,
      papel: 'usuario',
      conteudo: texto,
      horario: horarioAtual,
    };

    setMensagens((prev) => [...prev, novaMensagemUsuario]);
    setPergunta('');
    setCarregando(true);

    try {
      const resposta = await enviarPerguntaChat({
        pergunta: texto,
        conversaId,
        sistema,
        modulo,
        versao,
      });

      if (resposta.conversaId) {
        setConversaId(resposta.conversaId);
      }

      const novaMensagemIa: MensagemChat = {
        id: `ia-${Date.now()}`,
        papel: 'assistente',
        conteudo: resposta.resposta,
        fontes: resposta.fontes,
        horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMensagens((prev) => [...prev, novaMensagemIa]);
    } catch (erro: any) {
      setMensagens((prev) => [
        ...prev,
        {
          id: `erro-${Date.now()}`,
          papel: 'assistente',
          conteudo: `⚠️ **Erro na comunicação:** ${erro.message || 'Não foi possível contatar a API backend.'}. Verifique se o servidor Fastify está rodando na porta 3000.`,
          horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Barra de Filtros e Contexto ERP */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          <span>Filtro de Contexto ERP:</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60 text-xs">
            <span className="text-slate-400">Sistema:</span>
            <input
              type="text"
              value={sistema}
              onChange={(e) => setSistema(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none w-20"
              placeholder="Ex: Volpe"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60 text-xs">
            <span className="text-slate-400">Módulo:</span>
            <input
              type="text"
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none w-24"
              placeholder="Ex: Financeiro"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60 text-xs">
            <span className="text-slate-400">Versão:</span>
            <input
              type="text"
              value={versao}
              onChange={(e) => setVersao(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none w-16 font-mono"
              placeholder="Ex: 2026.1"
            />
          </div>
        </div>
      </header>

      {/* Área Central de Mensagens */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {mensagens.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.papel === 'usuario' ? 'items-end' : 'items-start'
            } max-w-4xl mx-auto`}
          >
            <div
              className={`rounded-2xl p-5 max-w-[90%] text-sm leading-relaxed transition-all ${
                msg.papel === 'usuario'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/15'
                  : 'bg-slate-900 border border-slate-800/90 text-slate-200 rounded-bl-none shadow-lg'
              }`}
            >
              {/* Cabeçalho da Mensagem */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/60 text-[11px]">
                {msg.papel === 'assistente' ? (
                  <>
                    <div className="p-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-blue-300">DocMind AI</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                      RAG Fundamentado
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-blue-100">Você</span>
                )}
                <span className="ml-auto text-slate-400 font-mono text-[10px]">{msg.horario}</span>
              </div>

              {/* Corpo em Markdown Formatado com Suporte a Imagens e Zoom */}
              <div className="text-slate-200">
                <MarkdownRenderer conteudo={msg.conteudo} />
              </div>

              {/* Caixa de Fontes e Citações Recuperadas */}
              {msg.fontes && msg.fontes.length > 0 && (
                <div className="mt-5 pt-3.5 border-t border-slate-800/90 space-y-2.5">
                  <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Evidências Documentais Recuperadas ({msg.fontes.length}):
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      pgvector cosine similarity
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {msg.fontes.map((fonte, idx) => {
                      const idFonte = `${msg.id}-fonte-${idx}`;
                      const estaExpandida = fonteExpandidaIdx === idFonte;
                      const percentualSimilaridade = Math.round((fonte.pontuacao || 0) * 100);

                      return (
                        <div
                          key={idx}
                          className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5 hover:border-slate-700/80 transition-colors"
                        >
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5 font-medium text-blue-300">
                              <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="truncate max-w-[280px]">{fonte.tituloDocumento}</span>
                              {fonte.tituloCapitulo && (
                                <span className="text-purple-300 font-normal truncate max-w-[180px]">
                                  • {fonte.tituloCapitulo}
                                </span>
                              )}
                            </span>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                  percentualSimilaridade >= 70
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : percentualSimilaridade >= 40
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}
                                title="Similaridade Semântica Cosseno"
                              >
                                {percentualSimilaridade}% match
                              </span>
                              <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">
                                Pág. {fonte.numeroPagina || '1'}
                              </span>
                            </div>
                          </div>

                          <p
                            className={`text-slate-400 italic text-[11px] leading-relaxed transition-all ${
                              estaExpandida ? 'line-clamp-none' : 'line-clamp-2'
                            }`}
                          >
                            "{fonte.trecho}"
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => setFonteExpandidaIdx(estaExpandida ? null : idFonte)}
                              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 font-medium"
                            >
                              {estaExpandida ? (
                                <>
                                  <span>Recolher trecho</span>
                                  <ChevronUp className="w-3 h-3" />
                                </>
                              ) : (
                                <>
                                  <span>Ver trecho completo</span>
                                  <ChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </button>
                            <span className="text-[10px] text-slate-500">
                              {fonte.sistema} • {fonte.modulo} ({fonte.versao})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {carregando && (
          <div className="flex items-center gap-3 text-slate-300 text-xs max-w-4xl mx-auto py-3 px-4 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium text-blue-300">Consultando pgvector e sintetizando resposta...</span>
              <span className="text-[11px] text-slate-500">Recuperando trechos documentais de alta similaridade</span>
            </div>
          </div>
        )}
      </div>

      {/* Sugestões de Perguntas Rápidas */}
      {mensagens.length <= 2 && (
        <div className="px-6 pb-2 max-w-4xl mx-auto w-full">
          <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            Perguntas frequentes para testar:
          </p>
          <div className="flex flex-wrap gap-2">
            {perguntasSugeridas.map((sugestao, i) => (
              <button
                key={i}
                onClick={() => handleEnviar(sugestao)}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-full transition-colors"
              >
                {sugestao}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Entrada / Envio */}
      <footer className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEnviar();
          }}
          className="max-w-4xl mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Faça uma pergunta sobre o ERP, regras de negócio ou procedimentos operacionais..."
            className="flex-1 bg-slate-950 text-white placeholder-slate-500 px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-all"
            disabled={carregando}
          />
          <button
            type="submit"
            disabled={!pergunta.trim() || carregando}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-3 rounded-xl transition-colors shrink-0 shadow-md shadow-blue-600/20"
            title="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}
