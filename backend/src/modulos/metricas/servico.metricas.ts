import { count, eq } from 'drizzle-orm';
import { banco } from '../../banco/index.js';
import { documentos, fragmentosDocumentos, lacunasConhecimento, conversas, diagnosticos } from '../../banco/esquema.js';

export class ServicoMetricas {
  async obterVisaoGeral() {
    const [qtdDocs] = await banco.select({ valor: count() }).from(documentos);
    const [qtdFragmentos] = await banco.select({ valor: count() }).from(fragmentosDocumentos);
    const [qtdConversas] = await banco.select({ valor: count() }).from(conversas);
    const [qtdDiagnosticos] = await banco.select({ valor: count() }).from(diagnosticos);
    const [qtdLacunas] = await banco.select({ valor: count() }).from(lacunasConhecimento);

    return {
      totalDocumentos: qtdDocs?.valor || 0,
      totalFragmentos: qtdFragmentos?.valor || 0,
      totalConversas: qtdConversas?.valor || 0,
      totalDiagnosticos: qtdDiagnosticos?.valor || 0,
      lacunasPendentes: qtdLacunas?.valor || 0,
    };
  }

  async obterLacunasConhecimento(resolvido?: boolean) {
    if (resolvido !== undefined) {
      return banco
        .select()
        .from(lacunasConhecimento)
        .where(eq(lacunasConhecimento.resolvido, resolvido ? 1 : 0))
        .orderBy(lacunasConhecimento.criadoEm);
    }

    return banco.select().from(lacunasConhecimento).orderBy(lacunasConhecimento.criadoEm);
  }

  async marcarLacunaResolvida(id: string) {
    await banco.update(lacunasConhecimento).set({ resolvido: 1 }).where(eq(lacunasConhecimento.id, id));
    return true;
  }
}

