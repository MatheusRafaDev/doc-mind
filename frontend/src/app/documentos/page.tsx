'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Upload,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  Eye,
  Sparkles,
} from 'lucide-react';
import { listarDocumentos, uploadDocumento, excluirDocumento } from '../../lib/api';
import { Documento } from '../../lib/tipos';
import ModalDetalhesDocumento from '../../componentes/ModalDetalhesDocumento';

export default function PaginaDocumentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [documentoIdZoom, setDocumentoIdZoom] = useState<string | null>(null);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [sistema, setSistema] = useState(process.env.NEXT_PUBLIC_SISTEMA_PADRAO || 'Volpe');
  const [modulo, setModulo] = useState(process.env.NEXT_PUBLIC_MODULO_PADRAO || 'Financeiro');
  const [versao, setVersao] = useState(process.env.NEXT_PUBLIC_VERSAO_PADRAO || '2026.1');
  const [tipoDocumento, setTipoDocumento] = useState('manual');
  const [arquivo, setArquivo] = useState<File | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const lista = await listarDocumentos();
      setDocumentos(lista);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivo || !titulo || !sistema || !modulo || enviando) return;

    setEnviando(true);
    setMensagemSucesso(null);
    setMensagemErro(null);

    const formData = new FormData();
    formData.append('file', arquivo);
    formData.append('titulo', titulo);
    formData.append('sistema', sistema);
    formData.append('modulo', modulo);
    formData.append('versao', versao);
    formData.append('tipoDocumento', tipoDocumento);

    try {
      await uploadDocumento(formData);
      setMensagemSucesso(`Manual "${titulo}" enviado e indexado no pgvector com sucesso!`);
      setTitulo('');
      setArquivo(null);
      // Reseta input file
      const fileInput = document.getElementById('input-arquivo') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await carregar();
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro durante o upload e indexação do manual.');
    } finally {
      setEnviando(false);
    }
  }

  async function handleExcluir(id: string, nome: string) {
    if (!confirm(`Deseja realmente excluir o documento "${nome}" e todos os seus vetores?`)) return;
    try {
      await excluirDocumento(id);
      await carregar();
    } catch (err: any) {
      alert('Erro ao excluir documento.');
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Biblioteca Corporativa</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Documentos, Manuais & APIs</h1>
          <p className="text-sm text-slate-400 mt-1">
            Faça upload de manuais em PDF, DOCX, TXT ou MD para alimentar a base vetorial do DocMind.
          </p>
        </div>

        <button
          onClick={carregar}
          disabled={carregando}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </button>
      </div>

      {/* Formulário de Upload */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-400" />
          Importar Novo Manual ou Especificação Técnica
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">Título do Documento:</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Manual de Integração Financeira"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Sistema ERP:</label>
              <input
                type="text"
                value={sistema}
                onChange={(e) => setSistema(e.target.value)}
                placeholder="Ex: Volpe"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Módulo:</label>
              <input
                type="text"
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                placeholder="Ex: Financeiro"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">Versão:</label>
              <input
                type="text"
                value={versao}
                onChange={(e) => setVersao(e.target.value)}
                placeholder="Ex: 2026.1"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Tipo de Conteúdo:</label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="manual">Manual Operacional</option>
                <option value="api">Documentação de API (REST/SOAP)</option>
                <option value="banco_dados">Dicionário de Tabelas / SQL</option>
                <option value="catalogo_erros">Catálogo de Erros e Exceções</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400 font-medium">Arquivo (PDF, Markdown .md, TXT):</label>
                <span className="text-[10px] text-purple-400 font-medium">✨ Markdown suportado</span>
              </div>
              <input
                id="input-arquivo"
                type="file"
                accept=".pdf,.md,.markdown,.txt"
                onChange={(e) => {
                  const arquivoSelecionado = e.target.files?.[0] || null;
                  setArquivo(arquivoSelecionado);
                  if (arquivoSelecionado && !titulo) {
                    const nomeLimpo = arquivoSelecionado.name
                      .replace(/\.[^/.]+$/, '')
                      .replace(/[-_]/g, ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase());
                    setTitulo(nomeLimpo);
                  }
                }}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {mensagemSucesso && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {mensagemSucesso}
                </span>
              )}
              {mensagemErro && (
                <span className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {mensagemErro}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={enviando || !arquivo}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
            >
              {enviando ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Extraindo páginas e indexando vetores...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Enviar e Indexar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Documentos */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-white">Manuais Cadastrados ({documentos.length})</h2>

        {carregando ? (
          <div className="text-center py-12 text-slate-400 text-xs">Carregando documentos...</div>
        ) : documentos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">Nenhum manual cadastrado ainda</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Utilize o formulário acima para enviar seu primeiro arquivo PDF ou Markdown de documentação de ERP.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentos.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setDocumentoIdZoom(doc.id)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-blue-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm hover:shadow-blue-500/5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {doc.titulo}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          doc.nomeArquivo?.toLowerCase().endsWith('.md') || doc.nomeArquivo?.toLowerCase().endsWith('.markdown')
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : doc.nomeArquivo?.toLowerCase().endsWith('.pdf')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                        }`}
                      >
                        {doc.nomeArquivo?.toLowerCase().endsWith('.md') || doc.nomeArquivo?.toLowerCase().endsWith('.markdown')
                          ? 'MD'
                          : doc.nomeArquivo?.toLowerCase().endsWith('.pdf')
                          ? 'PDF'
                          : 'TXT'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          doc.status === 'indexado'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : doc.status === 'processando'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-slate-500" />
                    {doc.nomeArquivo}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="space-x-2">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{doc.sistema}</span>
                    <span className="text-slate-500">{doc.modulo}</span>
                    <span className="text-slate-600 font-mono">v{doc.versao}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocumentoIdZoom(doc.id);
                      }}
                      className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-colors"
                      title="Dar zoom no documento: inspecionar fragmentos e mapa vetorial"
                    >
                      <Eye className="w-3 h-3 text-blue-400" />
                      <span>{doc.quantidadeFragmentos} chunks</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExcluir(doc.id, doc.titulo);
                      }}
                      title="Excluir documento"
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Zoom do Documento com Chunks e Mapa Vetorial */}
      {documentoIdZoom && (
        <ModalDetalhesDocumento
          documentoId={documentoIdZoom}
          aoFechar={() => setDocumentoIdZoom(null)}
        />
      )}
    </div>
  );
}

