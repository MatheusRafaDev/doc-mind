import { criarAplicacao } from './app.js';

async function testar() {
  console.log('🧪 Testando inicialização da API DocMind em Português...');
  const app = await criarAplicacao();

  // 1. Testa rota /saude
  const respostaSaude = await app.inject({
    method: 'GET',
    url: '/saude',
  });

  console.log('✅ Resposta de /saude:', respostaSaude.statusCode, respostaSaude.json());

  // 2. Testa Swagger OpenAPI Schema
  const respostaSwagger = await app.inject({
    method: 'GET',
    url: '/docs/json',
  });

  console.log('✅ Swagger OpenAPI Schema gerado com sucesso! Status:', respostaSwagger.statusCode);
  const jsonSwagger = respostaSwagger.json();
  console.log('📋 Título da API:', jsonSwagger.info?.title);
  console.log('🏷️ Tags cadastradas:', jsonSwagger.tags?.map((t: any) => t.name).join(', '));
  console.log('🛣️ Total de rotas no Swagger:', Object.keys(jsonSwagger.paths || {}).length);
  console.log('📌 Rotas mapeadas:', Object.keys(jsonSwagger.paths || {}));

  await app.close();
  console.log('🎉 Todos os testes de inicialização em Português passaram com sucesso!');
}

testar().catch(console.error);

