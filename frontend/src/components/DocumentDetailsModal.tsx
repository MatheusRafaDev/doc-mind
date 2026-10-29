'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Cpu,
  FileText,
  Copy,
  Check,
  Search,
  Sparkles,
  BookOpen,
  Hash,
  Activity,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { DocumentoDetalhado, FragmentoDetalhado } from '../lib/types';
import { obterDocumentoPorId } from '../lib/api';
import MarkdownRenderer from './MarkdownRenderer';

interface ModalDetalhesDocumentoProps {
  documentoId: string;
  aoFechar: () => void;
}

export default function ModalDetalhesDocumento({
  documentoId,
  aoFechar,
}: ModalDetalhesDocumentoProps) {
  const [doc, setDoc] = useState<DocumentoDetalhado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'chunks' | 'vetor' | 'ambos'>('ambos');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [fragmentoSelecionado, setFragmentoSelecionado] = useState<FragmentoDetalhado | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [copiadoDocumento, setCopiadoDocumento] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [modoVisualizacaoChunk, setModoVisualizacaoChunk] = useState<'formatado' | 'raw'>('formatado');

  function copiarDocumentoCompleto() {
    if (!doc || !doc.fragmentos) return;
    const textoCompleto = doc.fragmentos.map((f) => f.conteudo).join('\n\n');
    navigator.clipboard.writeText(textoCompleto);
    setCopiadoDocumento(true);
    setTimeout(() => setCopiadoDocumento(false), 2000);
  }

  useEffect(() => {
    async function carregarDetalhes() {
      try {
        setCarregando(true);
        setErro(null);
        const dados = await obterDocumentoPorId(documentoId);
        setDoc(dados);
        if (dados.fragmentos && dados.fragmentos.length > 0) {
          setFragmentoSelecionado(dados.fragmentos[0]);
        }
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar detalhes e chunks do documento.');
      } finally {
        setCarregando(false);
      }
    }
    carregarDetalhes();
  }, [documentoId]);

  function copiarTexto(texto: string, id: string) {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  }

  // Filtragem local de fragmentos por termo de busca
  const fragmentosFiltrados = (doc?.fragmentos || []).filter((f) => {
    if (!filtroTexto.trim()) return true;
    const termo = filtroTexto.toLowerCase();
    return (
      f.conteudo.toLowerCase().includes(termo) ||
      (f.tituloCapitulo && f.tituloCapitulo.toLowerCase().includes(termo))
    );
  });

  // Estatísticas calculadas do vetor do fragmento selecionado
  const vetorAtual = fragmentoSelecionado?.vetor || [];
  const dimensoes = vetorAtual.length || 768;
  const valoresNaoZero = vetorAtual.filter((v) => Math.abs(v) > 0.000001).length;
  const normaEuclidiana = Math.sqrt(
    vetorAtual.reduce((acc, val) => acc + val * val, 0)
  ).toFixed(4);
  const maxValor = vetorAtual.length > 0 ? Math.max(...vetorAtual).toFixed(4) : '0';
  const minValor = vetorAtual.length > 0 ? Math.min(...vetorAtual).toFixed(4) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl transition-all duration-300 overflow-hidden ${
          telaCheia ? 'w-full h-full' : 'w-full max-w-6xl max-h-[92vh] h-[850px]'
        }`}
      >
        {/* CABEÇALHO DO MODAL */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white line-clamp-1">
                  {doc?.titulo || 'Carregando documento...'}
                </h2>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    doc?.nomeArquivo?.toLowerCase().endsWith('.md')
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : doc?.nomeArquivo?.toLowerCase().endsWith('.pdf')
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                  }`}
                >
                  {doc?.nomeArquivo?.toLowerCase().endsWith('.md')
                    ? 'MD'
                    : doc?.nomeArquivo?.toLowerCase().endsWith('.pdf')
                    ? 'PDF'
                    : 'TXT'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                  {doc?.status || 'Indexado'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span className="font-mono text-slate-300">{doc?.nomeArquivo}</span>
                <span>•</span>
                <span>{doc?.sistema}</span>
                <span>/</span>
                <span>{doc?.modulo}</span>
                <span>•</span>
                <span className="text-blue-400 font-semibold">{doc?.quantidadeFragmentos || 0} Chunks indexados</span>
                <span>•</span>
                <span className="text-purple-400 font-mono text-[11px]">Vetor: 768d (pgvector)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copiarDocumentoCompleto}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-slate-700/60"
              title="Copiar todo o documento Markdown para a área de transferência (Ctrl+C)"
            >
              {copiadoDocumento ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Markdown Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                  <span>Copiar Tudo em Markdown (Ctrl+C)</span>
                </>
              )}
            </button>
            <button
              onClick={() => setTelaCheia(!telaCheia)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={telaCheia ? 'Restaurar janela' : 'Tela cheia'}
            >
              {telaCheia ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={aoFechar}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CORPO DO MODAL */}
        {carregando ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Carregando fragmentos e mapa vetorial do pgvector...</p>
          </div>
        ) : erro ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="text-rose-400 text-sm font-semibold">{erro}</div>
            <button
              onClick={aoFechar}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* PAINEL LATERAL ESQUERDO: LISTA DOS CHUNKS */}
            <div className="w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-slate-950/40 shrink-0">
              {/* Barra de pesquisa de chunks */}
              <div className="p-3 border-b border-slate-800 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    placeholder="Filtrar trecho nos chunks..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Exibindo {fragmentosFiltrados.length} de {doc?.fragmentos.length}</span>
                  <span className="text-blue-400 font-medium">Ordem Sequencial</span>
                </div>
              </div>

              {/* Lista com scroll */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-1">
                {fragmentosFiltrados.map((frag, idx) => {
                  const selecionado = fragmentoSelecionado?.id === frag.id;
                  return (
                    <button
                      key={frag.id}
                      onClick={() => setFragmentoSelecionado(frag)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1.5 ${
                        selecionado
                          ? 'bg-blue-600/15 border border-blue-500/40 text-white shadow-sm'
                          : 'hover:bg-slate-800/40 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-blue-400 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Chunk #{frag.indiceFragmento + 1}
                        </span>
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400 font-mono">
                          {frag.numeroPagina ? `Pág/Seção ${frag.numeroPagina}` : 'Pág 1'}
                        </span>
                      </div>

                      {frag.tituloCapitulo && (
                        <div className="text-[11px] font-medium text-slate-200 line-clamp-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-purple-400 shrink-0" />
                          <span>{frag.tituloCapitulo}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {frag.conteudo.replace(/^#+\s*/, '')}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                        <span>{frag.conteudo.length} caracteres</span>
                        <span className="text-purple-400 font-mono flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5" />
                          768d
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PAINEL CENTRAL / DIREITO: ZOOM NO CHUNK & MAPA VETORIAL */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-slate-900/60 p-6 space-y-6">
              {fragmentoSelecionado ? (
                <>
                  {/* SELEÇÃO DO CHUNK EM DESTAQUE */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                          Fragmento #{fragmentoSelecionado.indiceFragmento + 1} de {doc?.quantidadeFragmentos}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-xs text-purple-300 font-medium flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {fragmentoSelecionado.tituloCapitulo || 'Seção Geral'}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-xs text-slate-400">
                          {fragmentoSelecionado.numeroPagina ? `Página / Seção ${fragmentoSelecionado.numeroPagina}` : 'Página 1'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">
                        Inspeção de Fragmento & Mapa de Embeddings
                      </h3>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-950 border border-slate-800 p-0.5 rounded-lg flex text-xs">
                        <button
                          onClick={() => setAbaAtiva('ambos')}
                          className={`px-3 py-1 rounded-md transition-colors ${
                            abaAtiva === 'ambos' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Visão Completa
                        </button>
                        <button
                          onClick={() => setAbaAtiva('chunks')}
                          className={`px-3 py-1 rounded-md transition-colors ${
                            abaAtiva === 'chunks' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Texto
                        </button>
                        <button
                          onClick={() => setAbaAtiva('vetor')}
                          className={`px-3 py-1 rounded-md transition-colors ${
                            abaAtiva === 'vetor' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Mapa Vetorial
                        </button>
                      </div>

                      <button
                        onClick={() => copiarTexto(fragmentoSelecionado.conteudo, fragmentoSelecionado.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors border border-slate-700/60"
                        title="Copiar texto do fragmento"
                      >
                        {copiadoId === fragmentoSelecionado.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 1. SEÇÃO DE TEXTO DO CHUNK */}
                  {(abaAtiva === 'chunks' || abaAtiva === 'ambos') && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-300 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            Conteúdo Textual Indexado
                          </span>
                          <div className="bg-slate-950 border border-slate-800 p-0.5 rounded-lg flex text-[11px] ml-2">
                            <button
                              onClick={() => setModoVisualizacaoChunk('formatado')}
                              className={`px-2 py-0.5 rounded transition-colors ${
                                modoVisualizacaoChunk === 'formatado'
                                  ? 'bg-blue-600 text-white font-medium'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Formatado & Imagens
                            </button>
                            <button
                              onClick={() => setModoVisualizacaoChunk('raw')}
                              className={`px-2 py-0.5 rounded transition-colors ${
                                modoVisualizacaoChunk === 'raw'
                                  ? 'bg-blue-600 text-white font-medium'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Raw Mono
                            </button>
                          </div>
                        </div>
                        <div className="text-slate-500 flex items-center gap-3">
                          <span>{fragmentoSelecionado.conteudo.length} caracteres</span>
                          <span>~{Math.round(fragmentoSelecionado.conteudo.length / 4)} tokens estimados</span>
                        </div>
                      </div>

                      {modoVisualizacaoChunk === 'formatado' ? (
                        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-200 leading-relaxed max-h-72 overflow-y-auto">
                          <MarkdownRenderer conteudo={fragmentoSelecionado.conteudo} />
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-blue-600 selection:text-white max-h-72 overflow-y-auto">
                          {fragmentoSelecionado.conteudo}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. SEÇÃO DO MAPA VETORIAL (HEATMAP & FINGERPRINT) */}
                  {(abaAtiva === 'vetor' || abaAtiva === 'ambos') && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-semibold text-white">
                            Mapa Vetorial Semântico (pgvector)
                          </span>
                          <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] px-2 py-0.5 rounded-full font-mono">
                            vector(768)
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                          <div>Norma |v|: <span className="text-white font-semibold">{normaEuclidiana}</span></div>
                          <div>Min: <span className="text-rose-400">{minValor}</span></div>
                          <div>Max: <span className="text-emerald-400">{maxValor}</span></div>
                        </div>
                      </div>

                      {/* Visualizador de Calor (Vector Heatmap Grid) */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            Assinatura de Densidade Vetorial (768 Dimensões):
                          </span>
                          <div className="flex items-center gap-3 text-[10px]">
                            <div className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                              <span>Positivo Alto</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                              <span>Positivo Médio</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-sm bg-slate-800" />
                              <span>Neutro (~0)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                              <span>Negativo</span>
                            </div>
                          </div>
                        </div>

                        {/* Grade compacta de 768 células de calor */}
                        <div className="grid grid-cols-24 sm:grid-cols-32 md:grid-cols-48 gap-1 p-2 bg-slate-900/80 rounded-lg border border-slate-800/80 overflow-hidden max-h-48 overflow-y-auto">
                          {(vetorAtual.length > 0 ? vetorAtual : Array(768).fill(0)).map((val, idx) => {
                            // Calcula cor baseada no valor flutuante
                            let bgClass = 'bg-slate-800/60';
                            if (val > 0.05) bgClass = 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]';
                            else if (val > 0.02) bgClass = 'bg-purple-500';
                            else if (val > 0.005) bgClass = 'bg-blue-500';
                            else if (val > 0.0001) bgClass = 'bg-blue-600/70';
                            else if (val < -0.02) bgClass = 'bg-rose-500';
                            else if (val < -0.0001) bgClass = 'bg-rose-700/80';

                            return (
                              <div
                                key={idx}
                                title={`Dimensão [${idx}]: ${val.toFixed(6)}`}
                                className={`h-2.5 rounded-[2px] transition-all hover:scale-150 hover:z-10 cursor-pointer ${bgClass}`}
                              />
                            );
                          })}
                        </div>

                        {/* Amostra Numérica das Primeiras Dimensões */}
                        <div className="pt-2">
                          <span className="text-[11px] font-semibold text-slate-400">
                            Amostra de coordenadas float (dimensões 0 a 19):
                          </span>
                          <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 font-mono text-[11px]">
                            {(vetorAtual.slice(0, 20)).map((val, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-900 border border-slate-800 px-2 py-1.5 rounded flex items-center justify-between text-slate-300"
                              >
                                <span className="text-[10px] text-slate-500">d[{idx}]</span>
                                <span
                                  className={
                                    val > 0
                                      ? 'text-purple-300 font-semibold'
                                      : val < 0
                                      ? 'text-rose-400'
                                      : 'text-slate-600'
                                  }
                                >
                                  {val.toFixed(5)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                  Selecione um fragmento na lista à esquerda para dar zoom.
                </div>
              )}
            </div>
          </div>
        )}

        {/* RODAPÉ INFORMATIVO */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Índice HNSW ativo no PostgreSQL pgvector com operador de similaridade de cosseno &lt;=&gt;</span>
          </div>
          <button
            onClick={aoFechar}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Fechar Visualizador
          </button>
        </div>
      </div>
    </div>
  );
}

