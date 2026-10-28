'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Sparkles,
  BookOpen,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { enviarPerguntaChat } from '../lib/api';
import { MensagemChat, FonteConsultada } from '../lib/tipos';

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
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          <span>Contexto da Consulta:</span>
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
              className="bg-transparent text-white font-medium focus:outline-none w-16"
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
              className={`rounded-2xl p-4 max-w-[85%] text-sm leading-relaxed ${
                msg.papel === 'usuario'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/10'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              {/* Cabeçalho da Mensagem */}
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-700/40 text-[11px] opacity-75">
                {msg.papel === 'assistente' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold text-blue-300">DocMind AI (Fundamentado)</span>
                  </>
                ) : (
                  <span className="font-semibold">Você</span>
                )}
                <span className="ml-auto">{msg.horario}</span>
              </div>

              {/* Corpo em Markdown */}
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.conteudo}</ReactMarkdown>
              </div>

              {/* Caixa de Fontes e Citações */}
              {msg.fontes && msg.fontes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Fontes Verificadas na Documentação:
                  </div>
                  <div className="grid gap-2">
                    {msg.fontes.map((fonte, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-300 font-medium">
                          <span className="flex items-center gap-1.5 text-blue-300">
                            <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            {fonte.tituloDocumento}
                          </span>
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">
                            Pág. {fonte.numeroPagina || 'N/A'}
                          </span>
                        </div>
                        <p className="text-slate-400 italic text-[11px] line-clamp-2">
                          "{fonte.trecho}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {carregando && (
          <div className="flex items-center gap-3 text-slate-400 text-xs max-w-4xl mx-auto py-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Consultando pgvector e sintetizando resposta fundamentada...</span>
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
            placeholder="Pergunte sobre telas, regras de negócio, APIs ou configurações do ERP..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={carregando}
          />
          <button
            type="submit"
            disabled={carregando || !pergunta.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Perguntar</span>
          </button>
        </form>
      </footer>
    </div>
  );
}

