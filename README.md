# 🧠 DocMind — ERP Knowledge AI

> **Plataforma Corporativa de Gestão de Conhecimento, RAG Fundamentado e Diagnóstico Técnico de Sistemas ERP**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-black.svg)](https://fastify.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-0.7+-green.svg)](https://github.com/pgvector/pgvector)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.5-orange.svg)](https://langchain-ai.github.io/langgraphjs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

O **DocMind** é uma plataforma corporativa desenvolvida 100% em **TypeScript** (Backend Fastify + Frontend Next.js) projetada para transformar manuais extensos, documentações de APIs REST, esquemas de tabelas de banco de dados e procedimentos operacionais de sistemas ERP (como Volpe, SAP, TOTVS, Protheus ou sistemas proprietários) em uma base de conhecimento inteligente, consultável e auditável.

Além de atender às necessidades reais de analistas de suporte, consultores e desenvolvedores de ERP, o DocMind foi arquitetado como um laboratório prático para dominar a transição do **RAG manual** para **Agentes e Workflows com LangGraph**, **Busca Vetorial no PostgreSQL com pgvector** e **Guardrails anti-alucinação**.

---

## 📌 Índice

- [🎯 Proposta de Valor](#-proposta-de-valor)
- [🏗️ Arquitetura do Sistema](#️-arquitetura-do-sistema)
- [🧩 Os 5 Módulos da Aplicação](#-os-5-módulos-da-aplicação)
- [🧠 Mecânicas de IA Explicadas](#-mecânicas-de-ia-explicadas)
  - [Embeddings e Vetorização](#1-embeddings-e-vetorização)
  - [pgvector e Busca Híbrida](#2-pgvector-e-busca-híbrida)
  - [RAG Fundamentado com Citação de Páginas](#3-rag-fundamentado-com-citação-de-páginas)
  - [LangGraph: Grafo de Estados e Auto-correção](#4-langgraph-grafo-de-estados-e-auto-correção)
- [📁 Estrutura do Monorepo](#-estrutura-do-monorepo)
- [⚙️ Configuração das Variáveis de Ambiente](#️-configuração-das-variáveis-de-ambiente)
- [📡 Catálogo da API REST e Exemplos cURL](#-catálogo-da-api-rest-e-exemplos-curl)
- [📊 Modelagem do Banco de Dados (ERD)](#-modelagem-do-banco-de-dados-erd)
- [🧪 Trilha de Aprendizado em IA (Fases 0 a 11)](#-trilha-de-aprendizado-em-ia-fases-0-a-11)
- [📄 Licença](#-licença)

---

## 🎯 Proposta de Valor

Em ambientes corporativos com ERPs complexos:
- **Manuais gigantescos:** Manuais de módulos fiscais ou financeiros chegam a 500 páginas. Encontrar uma regra de validação em um chamado de suporte consome horas.
- **Erros de Integração Crípticos:** Mensagens como `HTTP 400 Bad Request` ou `ORA-00001` exigem cruzamento de logs com schemas de banco de dados e especificações de endpoints.
- **Risco de Alucinação de LLMs genéricos:** Modelos de linguagem genéricos inventam nomes de tabelas, campos e menus que não existem no release do cliente.

O **DocMind** resolve esses desafios com:
1. **Isolamento por Release:** Cada documento é rotulado por **Sistema**, **Módulo** e **Versão** (ex: `Volpe 2026.1`).
2. **Citação Rastreável de Páginas:** Cada resposta cita nominalmente o manual de origem e a **página exata** de onde o procedimento foi extraído.
3. **Mecanismo Anti-Alucinação (Guardrail):** Se a busca vetorial não encontrar evidências suficientes, o sistema **não gera palpites**: admite a ausência de documentação e cria um registro de auditoria (*Knowledge Gap*).
4. **Diagnóstico Estruturado com LangGraph:** Separa explicitamente o que a documentação **comprova** daquilo que é apenas uma **hipótese técnica** a ser validada.

---

## 🏗️ Arquitetura do Sistema

A aplicação adota o padrão Monorepo desacoplado, unindo a velocidade do **Fastify** no backend com a flexibilidade do **Next.js 14 (App Router)** no frontend:

```mermaid
flowchart TD
    subgraph FrontendApp ["Frontend Visual (Next.js 14 - Porta 3001)"]
        UI["React Server & Client Components"]
        ChatUI["💬 Chat RAG (com Markdown e Fontes)"]
        DiagUI["🩺 Diagnóstico Guiado (LangGraph)"]
        DocsUI["📚 Biblioteca de Manuais (Upload PDF)"]
        SearchUI["🔎 Busca Técnica Híbrida"]
        MetricsUI["📊 Painel de Lacunas & Auditoria"]
        UI --> ChatUI & DiagUI & DocsUI & SearchUI & MetricsUI
    end

    subgraph BackendAPI ["Backend Core (Fastify + TypeScript - Porta 3000)"]
        Fastify["Fastify Web Server & Swagger (/docs)"]
        ServicoDocs["ServicoDocumentos\n(Parser PDF por página & Chunker)"]
        ServicoBusca["ServicoBusca\n(Híbrido: Cosseno pgvector + ILIKE)"]
        ServicoChat["ServicoChat\n(Ciclo RAG e Anti-alucinação)"]
        GrafoDiag["GrafoDiagnostico\n(LangGraph State Machine)"]
        ServicoMetricas["ServicoMetricas\n(Auditoria de Lacunas)"]
        
        Fastify --> ServicoDocs & ServicoBusca & ServicoChat & GrafoDiag & ServicoMetricas
    end

    subgraph IAProviders ["Camada de Provedores de IA (Pluggable)"]
        FabricaVetores{"obterProvedorVetorial"}
        FabricaLLM{"obterProvedorLLM"}
        Mock["Provedor Simulado\n(Custo zero / Testes locais)"]
        Gemini["Google Gemini\n(gemini-1.5-flash & text-embedding-004)"]
        OpenAI["OpenAI\n(gpt-4o-mini & text-embedding-3-small)"]
        
        FabricaVetores --> Mock & Gemini & OpenAI
        FabricaLLM --> Mock & Gemini & OpenAI
    end

    subgraph DataStorage ["Persistência de Dados"]
        Postgres[("PostgreSQL 16")]
        PgVector[("Extensão pgvector\n(Similaridade de Cosseno)")]
        Drizzle["Drizzle ORM"]
        DiscoLocal[("Armazenamento Local\n(Binários de Manuais)")]
        
        Drizzle --> Postgres
        Postgres --> PgVector
    end

    FrontendApp -->|"REST / JSON / Multipart"| BackendAPI
    ServicoDocs --> DiscoLocal
    ServicoDocs & ServicoBusca & ServicoChat & GrafoDiag & ServicoMetricas --> Drizzle
    ServicoDocs & ServicoBusca --> FabricaVetores
    ServicoChat & GrafoDiag --> FabricaLLM
```

---

## 🧩 Os 5 Módulos da Aplicação

### 1. 💬 Chat Inteligente com RAG
- Interface conversacional com contexto persistente por sessão.
- Filtros dinâmicos por Sistema, Módulo e Versão no cabeçalho da página.
- Respostas formatadas com Markdown e um card expansível de **Fontes Verificadas**, indicando o manual, versão, capítulo e número exato da página.

### 2. 🩺 Diagnóstico Guiado de Erros (LangGraph)
- O usuário informa o Sistema, Módulo, Código de Erro (ex: `HTTP 400`), Stack Trace e Payload enviado.
- O **LangGraph** orquestra um grafo de estados com auto-correção e entrega uma resposta estruturada:
  - 📋 **Fatos Comprovados na Documentação:** Trechos de manuais confirmando regras ou campos obrigatórios.
  - 💡 **Hipóteses Analíticas da IA:** Deduções técnicas que dependem de validação empírica.
  - 🛠️ **Checklist de Investigação:** Passos numerados de troubleshooting no banco ou na API.
  - 🎯 **Nível de Confiança:** Alta, Média, Baixa ou Insuficiente.

### 3. 📚 Biblioteca de Manuais & Ingestão
- Upload de arquivos `.pdf`, `.txt` ou `.md`.
- Extração de texto preservando a numeração real das páginas do PDF (`pdf-parse`).
- Chunking inteligente com janela deslizante e sobreposição (*overlap*).
- Listagem dos manuais com status em tempo real (*Indexado*, *Processando*, *Falha*), contagem de fragmentos e exclusão em cascata.

### 4. 🔎 Pesquisa Técnica Híbrida
- Busca em tempo real combinando similaridade semântica de vetores e busca lexical.
- Ideal para localizar endpoints (`/api/v1/titulos`), tabelas (`PARAM_FISCAL`), procedures SQL ou códigos de erro específicos.
- Exibe o trecho recuperado, a página e a porcentagem exata de match vetorial.

### 5. 📊 Métricas & Gestão de Lacunas de Conhecimento
- 4 KPIs em tempo real: Total de Documentos, Total de Fragmentos/Vetores, Conversas Realizadas e Lacunas Pendentes.
- **Relatório de Lacunas de Conhecimento (Knowledge Gaps):** Registra automaticamente todas as perguntas de usuários que a documentação não conseguiu responder com evidências suficientes, permitindo que a equipe priorize a criação de novos manuais.

---

## 🧠 Mecânicas de IA Explicadas

### 1. Embeddings e Vetorização
- **Conceito:** O modelo de embedding converte texto em linguagem natural para um array de 768 números flutuantes. Textos com significados próximos ficam a distâncias geométricas pequenas.
- **Onde ocorre no código:**
  - Provedores definidos em [`backend/src/provedores/vetores/`](file:///c:/Users/rafae/Documents/GitHub/doc-mind/backend/src/provedores/vetores/index.ts).
  - Na Ingestão: [`backend/src/modulos/documentos/servico.documentos.ts`](file:///c:/Users/rafae/Documents/GitHub/doc-mind/backend/src/modulos/documentos/servico.documentos.ts).
  - Na Consulta: [`backend/src/modulos/busca/servico.busca.ts`](file:///c:/Users/rafae/Documents/GitHub/doc-mind/backend/src/modulos/busca/servico.busca.ts).

### 2. pgvector e Busca Híbrida
- **Conceito:** Armazena os vetores no PostgreSQL em colunas do tipo `vector(768)`.
- **Cálculo da Similaridade de Cosseno:**
  No PostgreSQL, o operador `<=>` calcula a distância de cosseno:
  $$\text{Similaridade} = 1 - (\text{f.vetor} \Leftrightarrow \text{vetor\_consulta})$$
- **Pontuação Composta (Busca Híbrida):**
  $$\text{Score Final} = (0.75 \times \text{Similaridade Vetorial}) + (0.25 \times \text{Correspondência Lexical ILIKE})$$
- **Onde ocorre no código:** [`backend/src/modulos/busca/servico.busca.ts`](file:///c:/Users/rafae/Documents/GitHub/doc-mind/backend/src/modulos/busca/servico.busca.ts).

### 3. RAG Fundamentado com Citação de Páginas
O ciclo do RAG (Retrieval-Augmented Generation) é implementado em [`backend/src/modulos/chat/servico.chat.ts`](file:///c:/Users/rafae/Documents/GitHub/doc-mind/backend/src/modulos/chat/servico.chat.ts):
1. **R (Retrieval):** O `ServicoBusca` busca no PostgreSQL os fragmentos mais relevantes.
2. **Guardrail Anti-Alucinação:** Se a pontuação do melhor trecho for menor que `0.25`, o fluxo **aborta a geração** e grava em `lacunasConhecimento`.
3. **A (Augmentation):** Os trechos válidos são injetados no prompt formatados como `[FONTE N: Manual, Módulo, Versão, Página X]`.
4. **G (Generation):** O LLM responde estritamente amparado pelos trechos injetados.

### 4. LangGraph: Grafo de Estados e Auto-correção
Para diagnósticos complexos de erros, utilizamos o **LangGraph** ([`backend/src/modulos/diagnostico/grafoDiagnostico.ts`](file:///c:/Users/rafae/Documents/GitHub/doc-mind/backend/src/modulos/diagnostico/grafoDiagnostico.ts)):

```mermaid
flowchart TD
    START(["START"]) --> noBuscar["noBuscarDocumentacao\n(Busca inicial no pgvector)"]
    noBuscar --> noAvaliar{"noAvaliarEvidencias\n(Score >= 0.25?)"}
    noAvaliar -->|"Evidências fracas & 1ª tentativa"| noReformular["noReformularBusca\n(Loop de auto-correção simplificado)"]
    noAvaliar -->|"Evidências suficientes"| noGerar["noGerarDiagnostico\n(Separação Fatos vs Hipóteses)"]
    noReformular --> noGerar
    noGerar --> END_NODE(["END"])
```

---

## 📁 Estrutura do Monorepo

```
doc-mind/
├── 📦 backend/                  # API Fastify em TypeScript
│   ├── src/
│   │   ├── banco/               # Schemas Drizzle ORM, migrações e índices pgvector
│   │   ├── configuracao/        # Validação do .env com Zod
│   │   ├── modulos/             # Documentos, Busca, Chat RAG e Diagnóstico (LangGraph)
│   │   ├── provedores/          # Embeddings e LLM (Simulado, Gemini, OpenAI)
│   │   ├── rotas/               # Rotas Fastify em Português
│   │   ├── utilitarios/         # Parser de PDF por página e divisor de texto
│   │   ├── app.ts               # Instância do Fastify, Swagger e CORS
│   │   ├── server.ts            # Inicialização do servidor HTTP
│   │   └── testar-api.ts        # Testes automatizados de inicialização
│   ├── .env.example             # Modelo de variáveis de ambiente
│   ├── .env                     # Variáveis locais ativas
│   ├── package.json             # Dependências da API
│   └── tsconfig.json            # Configuração TypeScript do backend
│
├── 🖥️ frontend/                 # Aplicação Web em Next.js 14
│   ├── src/
│   │   ├── app/                 # Páginas (Chat, Diagnóstico, Documentos, Busca, Métricas)
│   │   ├── components/          # Sidebar, Navbar e status em tempo real da API
│   │   └── lib/                 # Cliente de API e tipagens
│   ├── .env.example             # Modelo de variáveis de ambiente do frontend
│   ├── .env.local               # Configuração local do frontend
│   ├── package.json             # Dependências do frontend
│   └── tailwind.config.ts       # Tema escuro e Tailwind
│
├── 🐳 docker/
│   └── docker-compose.yml       # PostgreSQL 16 com extensão pgvector
├── 📘 docs/
│   └── SYSTEM_ARCHITECTURE.md   # Mapeamento completo dos fluxos e arquitetura
├── package.json                 # Orquestrador de scripts raiz (dev, build, test)
├── tsconfig.json                # TypeScript da raiz (solução monorepo)
└── README.md
```

---

## ⚙️ Configuração das Variáveis de Ambiente

### 1. Backend (`backend/.env`)

```env
# Porta e Host do servidor Fastify
PORTA=3000
HOST=0.0.0.0

# Conexão com o PostgreSQL e pgvector
URL_BANCO_DADOS=postgres://docmind:docmind123@localhost:5432/docmind

# Provedores de IA: "simulado" (custo zero, padrão), "gemini" ou "openai"
PROVEDOR_VETOR=simulado
PROVEDOR_LLM=simulado

# Dimensões do vetor: 768 para Gemini/Simulado, 1536 para OpenAI
DIMENSAO_VETOR=768

# Chaves de API (necessárias apenas se PROVEDOR != 'simulado')
CHAVE_GEMINI=
CHAVE_OPENAI=

# Armazenamento local de arquivos originais
DIRETORIO_UPLOADS=./uploads
```

### 2. Frontend (`frontend/.env.local`)

```env
# URL da API Backend Fastify
NEXT_PUBLIC_URL_API=http://localhost:3000

# Nome do Sistema exibido na interface
NEXT_PUBLIC_NOME_APP="DocMind — ERP Knowledge AI"

# Filtros Padrão sugeridos na interface
NEXT_PUBLIC_SISTEMA_PADRAO="Volpe"
NEXT_PUBLIC_MODULO_PADRAO="Financeiro"
NEXT_PUBLIC_VERSAO_PADRAO="2026.1"
```

---

## 📡 Catálogo da API REST e Exemplos cURL

A documentação interativa completa OpenAPI 3.0 fica disponível em `/docs`.

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/saude` | Status da API e conectividade com o PostgreSQL |
| `POST` | `/api/v1/documentos/upload` | Upload e indexação de manual (PDF/TXT/MD) |
| `GET` | `/api/v1/documentos` | Listar documentos com filtros por sistema/módulo |
| `GET` | `/api/v1/documentos/:id` | Detalhes de um manual e seus fragmentos |
| `DELETE` | `/api/v1/documentos/:id` | Remove o manual e limpa os vetores do pgvector |
| `POST` | `/api/v1/busca/hibrida` | Busca combinando cosseno vetorial e ILIKE |
| `POST` | `/api/v1/chat` | Chat RAG fundamentado com fontes e páginas |
| `GET` | `/api/v1/chat/:conversaId/historico` | Histórico de mensagens de uma conversa |
| `POST` | `/api/v1/diagnostico` | Diagnóstico técnico de logs e erros (LangGraph) |
| `GET` | `/api/v1/metricas/visao-geral` | Totalizadores de manuais, vetores e conversas |
| `GET` | `/api/v1/metricas/lacunas` | Relatório de perguntas sem resposta suficiente |
| `PATCH` | `/api/v1/metricas/lacunas/:id/resolver` | Marca uma lacuna como atendida |

### Exemplos de Requisições via cURL

**1. Checar Integridade da API:**
```bash
curl http://localhost:3000/saude
```

**2. Fazer uma Pergunta no Chat RAG:**
```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "pergunta": "Como funciona o processo de importação de notas fiscais?",
    "sistema": "Volpe",
    "modulo": "Financeiro",
    "versao": "2026.1"
  }'
```

**3. Executar o Diagnóstico com LangGraph:**
```bash
curl -X POST http://localhost:3000/api/v1/diagnostico \
  -H "Content-Type: application/json" \
  -d '{
    "sistema": "Volpe",
    "modulo": "Financeiro",
    "codigoErro": "HTTP 400",
    "logErro": "Campo cod_historico ausente no objeto de rateio",
    "dadosEnviados": "{\"valor\": 1500, \"tipo\": \"P\"}"
  }'
```

---

## 📊 Modelagem do Banco de Dados (ERD)

```mermaid
erDiagram
    documentos ||--o{ fragmentos_documentos : "possui (1:N)"
    conversas ||--o{ mensagens : "possui (1:N)"

    documentos {
        uuid id PK
        varchar titulo
        varchar sistema
        varchar modulo
        varchar versao
        varchar tipo_documento
        varchar nome_arquivo
        varchar tipo_mime
        text caminho_arquivo
        varchar status
        text mensagem_erro
        integer quantidade_fragmentos
        timestamp criado_em
        timestamp atualizado_em
    }

    fragmentos_documentos {
        uuid id PK
        uuid documento_id FK
        integer indice_fragmento
        text conteudo
        integer numero_pagina
        varchar titulo_capitulo
        vector vetor "dimensao 768"
        jsonb metadados
        timestamp criado_em
    }

    conversas {
        uuid id PK
        varchar titulo
        varchar sistema
        varchar modulo
        varchar versao
        timestamp criado_em
        timestamp atualizado_em
    }

    mensagens {
        uuid id PK
        uuid conversa_id FK
        varchar papel
        text conteudo
        jsonb fontes
        timestamp criado_em
    }

    diagnosticos {
        uuid id PK
        varchar sistema
        varchar modulo
        varchar codigo_erro
        text log_erro
        text dados_enviados
        jsonb fatos_documentados
        jsonb hipoteses_tecnicas
        jsonb passos_investigacao
        varchar confianca
        jsonb fontes
        timestamp criado_em
    }

    lacunas_conhecimento {
        uuid id PK
        text pergunta
        varchar sistema
        varchar modulo
        text motivo
        integer resolvido
        timestamp criado_em
    }
```

---

## 🧪 Trilha de Aprendizado em IA (Fases 0 a 11)

O DocMind foi estruturado para demonstrar na prática a evolução das técnicas de IA:

| Fase | Técnica | Como é aplicada no DocMind |
| :---: | :--- | :--- |
| **0** | **LLM Puro** | Consulta sem contexto documental para estabelecer a taxa base de alucinação. |
| **1** | **Contexto Longo** | Injeção de manuais inteiros no prompt para comparar custo e latência. |
| **2** | **RAG Manual** | Chunker customizado e montagem controlada do prompt no `ServicoChat`. |
| **3** | **pgvector** | Persistência vetorial nativa no PostgreSQL com índices de alta performance. |
| **4** | **Busca Híbrida** | Ponderação entre distância de cosseno (`<=>`) e busca textual ILIKE. |
| **5** | **Guardrails** | Corte por limiar de similaridade (`score < 0.25`) e registro de *Knowledge Gaps*. |
| **6** | **Workflows** | Sequenciamento estruturado de diagnósticos separando fatos de hipóteses. |
| **7** | **LangGraph** | Grafos de estado com loops de auto-correção (`grafoDiagnostico.ts`). |
| **8** | **LangChain** | Comparativo entre abstrações prontas e o RAG manual. |
| **9** | **Isolamento Multi-Versão** | Segregação estrita de regras por versão e módulo de ERP. |
| **10** | **Métricas e Auditoria** | Monitoramento de perguntas não atendidas para evolução contínua da documentação. |
| **11** | **Fine-Tuning / Adapters** | Adaptação futura de modelos compactos para sintaxes específicas de ERP e SQL. |

---

## 📄 Licença

Este projeto está licenciado sob a Licença [MIT](LICENSE).
