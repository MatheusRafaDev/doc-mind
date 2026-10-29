'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Image as ImageIcon,
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
  Copy,
  Check,
  ExternalLink,
  FileCode,
  AlertTriangle,
} from 'lucide-react';

interface MarkdownRendererProps {
  conteudo: string;
  className?: string;
}

/**
 * Normaliza padrões de imagens em markdown comuns em exportações do Confluence, Jira ou Notion.
 * Exemplo: "(attachments/a_fbc.../image.png)" ou "(ents/.../image.png)" transformados em "![Captura de Tela](...)"
 */
function normalizarMarkdown(texto: string): string {
  if (!texto) return '';

  // 1. Corrige padrões soltos como (attachments/.../image-xxx.png?...) ou (ents/.../image-xxx.png?...)
  let normalizado = texto.replace(
    /(?:!\[[^\]]*\]\()?\(?((?:attachments|ents|\/attachments|\/uploads|\/images)[^)\s]+\.(?:png|jpe?g|webp|gif|svg)(?:\?[^)\s]*)?)\)?/gi,
    (match, url) => {
      // Se já estava dentro de ![alt](url), não duplica
      if (match.startsWith('![')) return match;
      const nomeArquivo = url.split('/').pop()?.split('?')[0] || 'imagem.png';
      return `\n\n![${nomeArquivo}](${url})\n\n`;
    }
  );

  return normalizado;
}

export default function MarkdownRenderer({ conteudo, className = '' }: MarkdownRendererProps) {
  const [imagemZoom, setImagemZoom] = useState<{ src: string; alt?: string } | null>(null);
  const [zoomNivel, setZoomNivel] = useState(1);
  const [copiadoCodeId, setCopiadoCodeId] = useState<string | null>(null);

  const textoProcessado = normalizarMarkdown(conteudo);

  function copiarCodigo(texto: string, id: string) {
    navigator.clipboard.writeText(texto);
    setCopiadoCodeId(id);
    setTimeout(() => setCopiadoCodeId(null), 2000);
  }

  return (
    <div className={`docmind-markdown space-y-3 ${className}`}>
      <ReactMarkdown
        components={{
          // TÍTULOS
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-white mt-4 mb-2 pb-1.5 border-b border-slate-700/60 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-500 rounded-full inline-block" />
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-slate-100 mt-3.5 mb-2 pb-1 border-b border-slate-800 flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full inline-block" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-blue-300 mt-3 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-slate-200 mt-2 mb-1">
              {children}
            </h4>
          ),

          // PARÁGRAFOS
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-slate-300 my-2">
              {children}
            </p>
          ),

          // LISTAS NÃO ORDENADAS
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 pl-2">
              {children}
            </ul>
          ),

          // LISTAS ORDENADAS (Passo a passo destacado)
          ol: ({ children }) => (
            <ol className="my-2 space-y-2 list-none [counter-reset:passo-counter] pl-1">
              {children}
            </ol>
          ),

          li: ({ children, node }) => {
            // Se for dentro de lista ordenada
            return (
              <li className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                <span className="flex-1">{children}</span>
              </li>
            );
          },

          // CÓDIGOS E BLOCOS PRE
          code: ({ inline, className: codeClass, children, ...props }: any) => {
            const ehInline = inline || !codeClass;
            const textoCodigo = String(children).replace(/\n$/, '');
            const idCodigo = `code-${Math.random().toString(36).substring(2, 9)}`;

            if (ehInline) {
              return (
                <code
                  className="bg-slate-800/90 text-blue-300 font-mono text-[12px] px-1.5 py-0.5 rounded border border-slate-700/50"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const matchLinguagem = /language-(\w+)/.exec(codeClass || '');
            const linguagem = matchLinguagem ? matchLinguagem[1] : 'código';

            return (
              <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <FileCode className="w-3.5 h-3.5" />
                    {linguagem}
                  </span>
                  <button
                    onClick={() => copiarCodigo(textoCodigo, idCodigo)}
                    className="flex items-center gap-1 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors text-[11px]"
                    title="Copiar código"
                  >
                    {copiadoCodeId === idCodigo ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed">
                  <code>{children}</code>
                </pre>
              </div>
            );
          },

          // TABELAS
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-300 font-semibold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-900/40 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-blue-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 text-slate-300">
              {children}
            </td>
          ),

          // BLOCKQUOTE (Destaques, Avisos, Notas)
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-4 border-blue-500 bg-blue-950/20 px-4 py-2.5 rounded-r-lg text-slate-300 italic text-sm">
              {children}
            </blockquote>
          ),

          // LINKS
          a: ({ href, children }) => {
            // Se for link para imagem
            const ehLinkImagem = href && /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(href);
            if (ehLinkImagem) {
              return (
                <button
                  onClick={() => setImagemZoom({ src: href, alt: String(children) })}
                  className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 underline font-medium text-xs mx-1"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{children || 'Ver Imagem / Screenshot'}</span>
                </button>
              );
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-blue-400 hover:text-blue-300 underline font-medium"
              >
                <span>{children}</span>
                <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70" />
              </a>
            );
          },

          // IMAGENS (COM PREVIEW, TRATAMENTO DE ERRO E ZOOM)
          img: ({ src, alt }: any) => {
            return (
              <VisualizadorImagem
                src={src || ''}
                alt={alt || ''}
                aoClicarZoom={(dados) => {
                  setImagemZoom(dados);
                  setZoomNivel(1);
                }}
              />
            );
          },
        }}
      >
        {textoProcessado}
      </ReactMarkdown>

      {/* MODAL LIGHTBOX DE ZOOM EM TELA CHEIA */}
      {imagemZoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-5xl max-h-[92vh] w-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Barra Superior do Modal de Imagem */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800 text-slate-300">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white truncate max-w-md">
                  {imagemZoom.alt || imagemZoom.src.split('/').pop()?.split('?')[0] || 'Captura de Tela do Manual'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomNivel((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-400 min-w-[3rem] text-center">
                  {Math.round(zoomNivel * 100)}%
                </span>
                <button
                  onClick={() => setZoomNivel((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomNivel(1)}
                  className="px-2 py-1 hover:bg-slate-800 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Reset
                </button>
                <div className="w-px h-4 bg-slate-800 mx-1" />
                <button
                  onClick={() => setImagemZoom(null)}
                  className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
                  title="Fechar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Área da Imagem com Zoom */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/70 min-h-[300px]">
              <img
                src={imagemZoom.src}
                alt={imagemZoom.alt || 'Imagem do Manual'}
                style={{ transform: `scale(${zoomNivel})`, transition: 'transform 0.15s ease-out' }}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl"
              />
            </div>

            {/* Rodapé do Modal */}
            <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono truncate max-w-lg">{imagemZoom.src}</span>
              <a
                href={imagemZoom.src}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
              >
                <span>Abrir Original</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente interno de renderização inteligente de imagens:
 * - Se carregar com sucesso: exibe a imagem com botão de zoom em hover.
 * - Se falhar ou for anexo offline: exibe um card elegante com o nome do anexo em vez de ícone quebrado!
 */
function VisualizadorImagem({
  src,
  alt,
  aoClicarZoom,
}: {
  src: string;
  alt: string;
  aoClicarZoom: (dados: { src: string; alt: string }) => void;
}) {
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Extrai o nome do arquivo da URL (ex: image-20230613-222124.png)
  const nomeArquivo =
    alt || src.split('/').pop()?.split('?')[0] || 'Captura de tela';

  if (erro) {
    return (
      <div className="my-3 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-3 text-xs shadow-sm">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
          <ImageIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200 truncate">{nomeArquivo}</span>
            <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-medium">
              Anexo do Manual
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Captura de tela ou anexo referenciado no documento técnico original.
          </p>
          <div className="flex items-center gap-3 pt-1 text-[11px]">
            {src.startsWith('http') && (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Tentar abrir link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={() => navigator.clipboard.writeText(src)}
              className="text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>Copiar caminho do anexo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-3 group relative inline-block max-w-full">
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 shadow-md">
        {carregando && (
          <div className="w-full h-32 flex items-center justify-center bg-slate-900/50 text-slate-500 text-xs gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Carregando imagem...</span>
          </div>
        )}
        <img
          src={src}
          alt={alt || 'Screenshot do sistema'}
          onLoad={() => setCarregando(false)}
          onError={() => {
            setCarregando(false);
            setErro(true);
          }}
          className={`max-h-96 w-auto object-contain cursor-pointer transition-transform duration-200 hover:scale-[1.01] ${
            carregando ? 'hidden' : 'block'
          }`}
          onClick={() => aoClicarZoom({ src, alt: nomeArquivo })}
        />

        {/* Overlay com Botão de Zoom ao passar o mouse */}
        {!carregando && (
          <div
            onClick={() => aoClicarZoom({ src, alt: nomeArquivo })}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer gap-2 text-white text-xs font-medium"
          >
            <div className="bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 shadow-lg">
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Clique para Ampliar / Zoom</span>
            </div>
          </div>
        )}
      </div>

      {alt && !carregando && (
        <span className="block mt-1 text-[11px] text-slate-400 italic text-center">
          {alt}
        </span>
      )}
    </div>
  );
}
