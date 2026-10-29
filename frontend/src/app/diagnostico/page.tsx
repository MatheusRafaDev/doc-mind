'use client';

import React, { useState } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Lightbulb,
  ListOrdered,
  Search,
  BookOpen,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { diagnosticarErro } from '../../lib/api';
import { RespostaDiagnostico } from '../../lib/types';

export default function PaginaDiagnostico() {
  const [sistema, setSistema] = useState(process.env.NEXT_PUBLIC_SISTEMA_PADRAO || 'Volpe');
  const [modulo, setModulo] = useState(process.env.NEXT_PUBLIC_MODULO_PADRAO || 'Financeiro');
  const [codigoErro, setCodigoErro] = useState('HTTP 400');
  const [operacao, setOperacao] = useState('Cadastrar Título Financeiro');
  const [logErro, setLogErro] = useState(
    'Erro 400: Campo obrigatório "cod_historico" ausente no objeto de rateio.'
  );
  const [dadosEnviados, setDadosEnviados] = useState(
    JSON.stringify(
      {
        valor: 1500.5,
        tipo: 'P',
        fornecedor: '10293',
        parcelas: [{ numero: 1, vencimento: '2026-11-15' }],
      },
      null,
      2
    )
  );

  const [carregando, setCarregando] = useState(false);
  const [diagnostico, setDiagnostico] = useState<RespostaDiagnostico | null>(null);
  const [erroApi, setErroApi] = useState<string | null>(null);

  async function handleDiagnosticar(e: React.FormEvent) {
    e.preventDefault();
    if (!logErro.trim() || carregando) return;

    setCarregando(true);
    setErroApi(null);

    try {
      const res = await diagnosticarErro({
        sistema,
        modulo,
        codigoErro,
        logErro,
        dadosEnviados,
        operacao,
      });
      setDiagnostico(res);
    } catch (err: any) {
      setErroApi(err.message || 'Falha ao processar diagnóstico.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
          <Stethoscope className="w-4 h-4" />
          <span>Módulo Especializado</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">Diagnóstico Guiado de Erros & Logs</h1>
        <p className="text-sm text-slate-400 mt-1">
          Orquestrado via <strong>LangGraph</strong>: a IA analisa exceções, códigos de erro e payloads,
          separando <strong>Fatos Documentados</strong> de <strong>Hipóteses Técnicas</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário de Entrada */}
        <form
          onSubmit={handleDiagnosticar}
          className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Dados do Incidente Reportado
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium">Sistema ERP:</label>
              <input
                type="text"
                value={sistema}
                onChange={(e) => setSistema(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Módulo Afetado:</label>
              <input
                type="text"
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium">Código do Erro:</label>
              <input
                type="text"
                value={codigoErro}
                onChange={(e) => setCodigoErro(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Ex: HTTP 400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Operação:</label>
              <input
                type="text"
                value={operacao}
                onChange={(e) => setOperacao(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Ex: Importar NF"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium">Mensagem de Erro / Stack Trace:</label>
            <textarea
              rows={3}
              value={logErro}
              onChange={(e) => setLogErro(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium">Payload / Dados Enviados (JSON/XML):</label>
            <textarea
              rows={4}
              value={dadosEnviados}
              onChange={(e) => setDadosEnviados(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={carregando || !logErro.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
          >
            {carregando ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executando Grafo LangGraph...</span>
              </>
            ) : (
              <>
                <Stethoscope className="w-4 h-4" />
                <span>Diagnosticar Problema</span>
              </>
            )}
          </button>

          {erroApi && (
            <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              {erroApi}
            </p>
          )}
        </form>

        {/* Painel de Resultados do Diagnóstico */}
        <div className="lg:col-span-7 space-y-6">
          {diagnostico ? (
            <div className="space-y-6">
              {/* Badge de Confiança */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">Nível de Confiança da Análise</h3>
                  <p className="text-xs text-slate-400">Classificação baseada nas evidências encontradas no manual.</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    diagnostico.confianca === 'alta'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : diagnostico.confianca === 'media'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}
                >
                  Confiança: {diagnostico.confianca}
                </span>
              </div>

              {/* Card 1: Fatos Documentados */}
              <div className="bg-slate-900 border border-emerald-900/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. Fatos Comprovados na Documentação</span>
                </div>
                <ul className="space-y-2">
                  {diagnostico.fatosDocumentados.map((fato, i) => (
                    <li key={i} className="text-xs text-slate-200 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/30">
                      {fato}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 2: Hipóteses Técnicas */}
              <div className="bg-slate-900 border border-amber-900/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <Lightbulb className="w-4 h-4" />
                  <span>2. Hipóteses Analíticas da IA (Exigem Verificação)</span>
                </div>
                <ul className="space-y-2">
                  {diagnostico.hipotesesTecnicas.map((hipotese, i) => (
                    <li key={i} className="text-xs text-slate-200 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30">
                      {hipotese}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 3: Próximos Passos */}
              <div className="bg-slate-900 border border-blue-900/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <ListOrdered className="w-4 h-4" />
                  <span>3. Checklist de Investigação Recomendado</span>
                </div>
                <ul className="space-y-2">
                  {diagnostico.passosInvestigacao.map((passo, i) => (
                    <li key={i} className="text-xs text-slate-200 bg-blue-950/20 p-2.5 rounded-lg border border-blue-900/30">
                      {passo}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card 4: Fontes Consultadas */}
              {diagnostico.fontes && diagnostico.fontes.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>Manuais e Páginas Consultadas pelo Grafo:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {diagnostico.fontes.map((src, i) => (
                      <div key={i} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                        <div className="font-medium text-white truncate">{src.tituloDocumento}</div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                          <span>{src.modulo}</span>
                          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded">Pág. {src.numeroPagina || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center space-y-3">
              <Stethoscope className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">Nenhum diagnóstico gerado ainda</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Preencha os dados do erro ou log no painel à esquerda e clique em "Diagnosticar Problema" para rodar o fluxo no LangGraph.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
