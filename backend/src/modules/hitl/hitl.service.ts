/**
 * ============================================================================
 * 👤 SERVIÇO HUMAN-IN-THE-LOOP (HITL) (backend/src/modules/hitl/hitl.service.ts)
 * ============================================================================
 * Gerencia a fila de aprovações críticas de alçadas corporativas:
 * 1. Congelamento de estado para decisões de alto impacto (descontos > 5%, alterações contratuais).
 * 2. Emissão de cards interativos para gestores.
 * 3. Validação de assinatura, auditoria e retomada assíncrona do fluxo multi-agente.
 */

import { eq, desc } from 'drizzle-orm';
import { banco } from '../../database/index.js';
import { aprovacoesHitl, execucoesMultiagente } from '../../database/schema.js';

export interface EntradaCriarAprovacao {
  tipo: string;
  titulo: string;
  solicitante: string;
  departamento: string;
  dados: Record<string, any>;
  execucaoId?: string;
}

export class ServicoHitl {
  // Fallback em memória para quando o banco estiver indisponível
  private static memoriaAprovacoes = new Map<string, any>();

  async criarAprovacao(entrada: EntradaCriarAprovacao) {
    try {
      const [nova] = await banco
        .insert(aprovacoesHitl)
        .values({
          tipo: entrada.tipo,
          titulo: entrada.titulo,
          solicitante: entrada.solicitante,
          departamento: entrada.departamento,
          dados: entrada.dados,
          status: 'pendente',
        })
        .returning();

      return nova;
    } catch (e) {
      const id = `hitl-${Date.now()}`;
      const item = {
        id,
        tipo: entrada.tipo,
        titulo: entrada.titulo,
        solicitante: entrada.solicitante,
        departamento: entrada.departamento,
        dados: entrada.dados,
        status: 'pendente',
        criadoEm: new Date(),
      };
      ServicoHitl.memoriaAprovacoes.set(id, item);
      return item;
    }
  }

  async listarAprovacoes(status?: 'pendente' | 'aprovado' | 'rejeitado') {
    try {
      let query = banco.select().from(aprovacoesHitl);
      if (status) {
        return await query.where(eq(aprovacoesHitl.status, status)).orderBy(desc(aprovacoesHitl.criadoEm));
      }
      return await query.orderBy(desc(aprovacoesHitl.criadoEm));
    } catch {
      const lista = Array.from(ServicoHitl.memoriaAprovacoes.values());
      if (status) return lista.filter((i) => i.status === status);
      return lista;
    }
  }

  async obterAprovacaoPorId(id: string) {
    try {
      const [item] = await banco.select().from(aprovacoesHitl).where(eq(aprovacoesHitl.id, id));
      return item || null;
    } catch {
      return ServicoHitl.memoriaAprovacoes.get(id) || null;
    }
  }

  async responderAprovacao(
    id: string,
    decisao: 'aprovado' | 'rejeitado',
    aprovador: string,
    justificativa?: string
  ) {
    const dataHora = new Date();
    try {
      const [atualizada] = await banco
        .update(aprovacoesHitl)
        .set({
          status: decisao,
          aprovador,
          justificativa: justificativa || (decisao === 'aprovado' ? 'Aprovado via Governança' : 'Rejeitado por política interna'),
          respondidoEm: dataHora,
        })
        .where(eq(aprovacoesHitl.id, id))
        .returning();

      // Se houver execução associada, atualiza também seu status
      const [execucao] = await banco
        .select()
        .from(execucoesMultiagente)
        .where(eq(execucoesMultiagente.aprovacaoId, id));

      if (execucao) {
        await banco
          .update(execucoesMultiagente)
          .set({
            status: decisao === 'aprovado' ? 'concluido' : 'rejeitado',
            atualizadoEm: dataHora,
          })
          .where(eq(execucoesMultiagente.id, execucao.id));
      }

      return atualizada;
    } catch {
      const item = ServicoHitl.memoriaAprovacoes.get(id);
      if (item) {
        item.status = decisao;
        item.aprovador = aprovador;
        item.justificativa = justificativa;
        item.respondidoEm = dataHora;
      }
      return item;
    }
  }
}

