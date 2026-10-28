# 📘 Mapeamento e Arquitetura Completa do Sistema — DocMind

> **Documento Oficial de Engenharia, Fluxos de Dados e Funcionamento Interno (100% em Português)**

---

## 1. Visão Geral e Princípios Fundamentais

O **DocMind** é uma plataforma backend corporativa em **TypeScript** projetada para indexar, consultar e analisar documentações técnicas e manuais operacionais de sistemas ERP (como Volpe, SAP, TOTVS, etc.).

Todo o código-fonte, tabelas do banco de dados, variáveis e endpoints foram projetados em **Português**, adotando o paradigma **Headless / API-First**: não possui interface gráfica acoplada. Sua interação se dá integralmente via **REST API** e documentação interativa **OpenAPI/Swagger (`/docs`)**.

### Os 4 Pilares do DocMind

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PILAR 1: ISOLAMENTO                             │
│ Cada manual é rotulado por Sistema, Módulo e Versão (ex: Volpe 2026.1). │
│ Respostas nunca misturam regras de versões diferentes.                │
├────────────────────────────────────────────────────────────────────────┤
│                     PILAR 2: ZERO ALUCINAÇÃO                           │
│ A IA responde estritamente com base nos trechos recuperados.           │
│ Se a informação não constar, a IA admite e cria uma Lacuna.            │
├────────────────────────────────────────────────────────────────────────┤
│                     PILAR 3: RASTREABILIDADE TOTAL                     │
│ Cada resposta cita o Manual de origem, capítulo e número da página.    │
├────────────────────────────────────────────────────────────────────────┤
│                     PILAR 4: DIAGNÓSTICO ESTRUTURADO                   │
│ Separação rígida entre FATOS DOCUMENTADOS e HIPÓTESES TÉCNICAS.        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Diagrama de Componentes e Camadas

```mermaid
flowchart TD
    subgraph Camada1 ["1. Camada de Apresentação & Entrada"]
        HTTP["Servidor Fastify HTTP (Porta 3000)"]
        SwaggerUI["Swagger UI (/docs)"]
        Rotas["Rotas Tipadas (Zod / JSON Schema)"]
    end

    subgraph Camada2 ["2. Camada de Módulos & Casos de Uso"]
        ModDoc["Módulo de Documentos\n(ServicoDocumentos)"]
        ModBusca["Módulo de Busca Híbrida\n(ServicoBusca)"]
        ModChat["Módulo de Chat RAG\n(ServicoChat)"]
        ModDiag["Módulo de Diagnóstico\n(ServicoDiagnostico)"]
        ModMetricas["Módulo de Métricas\n(ServicoMetricas)"]
    end

    subgraph Camada3 ["3. Camada de Processamento de Dados"]
        Parser["Analisador de PDF por Página\n(analisarPdf com pagerender)"]
        Divisor["Divisor Estruturado de Texto\n(dividirTexto com sobreposição)"]
    end

    subgraph Camada4 ["4. Camada de Provedores de IA"]
        FabricaVetor{"obterProvedorVetorial"}
        FabricaLLM{"obterProvedorLLM"}
        SimuladoAI["Provedor Simulado\n(Local determinístico, custo zero)"]
        GeminiAI["Google Gemini\n(gemini-1.5-flash & text-embedding-004)"]
        OpenAI["OpenAI\n(gpt-4o-mini & text-embedding-3-small)"]
    end

    subgraph Camada5 ["5. Camada de Persistência"]
        Drizzle["Drizzle ORM + Driver pg"]
        Postgres[("PostgreSQL 16")]
        PgVector[("Extensão pgvector\n(Similaridade de Cosseno)")]
        DiscoLocal[("Disco Local / Storage\n(Uploads de PDFs)")]
    end

    HTTP --> Rotas
    Rotas --> ModDoc & ModBusca & ModChat & ModDiag & ModMetricas
    ModDoc --> Parser --> Divisor
    Divisor --> FabricaVetor
    FabricaVetor --> SimuladoAI & GeminiAI & OpenAI
    ModChat & ModDiag --> ModBusca
    ModBusca --> FabricaVetor
    ModChat & ModDiag --> FabricaLLM
    FabricaLLM --> SimuladoAI & GeminiAI & OpenAI
    ModDoc & ModBusca & ModChat & ModDiag & ModMetricas --> Drizzle
    Drizzle --> Postgres
    Postgres --> PgVector
    ModDoc --> DiscoLocal
```

---

## 3. Mapeamento dos Fluxos Operacionais

### Fluxo 1: Ingestão e Processamento de Documentos

**Endpoint:** `POST /api/v1/documentos/upload`  
**Objetivo:** Receber manuais em PDF, TXT ou MD, extrair o texto preservando a numeração de páginas, gerar fragmentos com sobreposição contextual, calcular vetores de embedding e persistir tudo no PostgreSQL.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Usuário / Sistema Externo
    participant API as Fastify (documentos.rotas)
    participant Servico as ServicoDocumentos
    participant Disco as Armazenamento Local
    participant Analisador as analisarPdf
    participant Divisor as dividirTexto
    participant IA as ProvedorVetorial
    participant BD as PostgreSQL + pgvector

    Cliente->>API: POST /upload (multipart: arquivo + titulo, sistema, modulo, versao)
    API->>Servico: uploadEIngestao(dados)
    Servico->>Disco: Salva arquivo físico em ./uploads/{timestamp}-{nome}
    Servico->>BD: INSERT INTO documentos (status='processando')
    
    alt Arquivo é PDF
        Servico->>Analisador: analisarPdf(buffer)
        Analisador-->>Servico: Retorna array de páginas: [{numeroPagina: 1, texto: "..."}, ...]
        loop Para cada página
            Servico->>Divisor: dividirTexto(textoPagina, numeroPagina)
        end
    else Arquivo é Texto / Markdown
        Servico->>Divisor: dividirTexto(conteudoTexto, numeroPagina=1)
    end
    
    Divisor-->>Servico: Lista de FragmentosBrutos com página e capítulos detectados
    Servico->>IA: gerarLote(conteúdos dos fragmentos)
    IA-->>Servico: Lista de vetores numéricos
    
    loop Para cada fragmento
        Servico->>BD: INSERT INTO fragmentos_documentos (conteudo, numero_pagina, vetor, metadados)
    end
    
    Servico->>BD: UPDATE documentos SET status='indexado', quantidade_fragmentos=N
    Servico-->>API: Documento indexado com sucesso
    API-->>Cliente: HTTP 201 Created com resumo do documento
```

---

### Fluxo 2: Motor de Busca Técnica Híbrida

**Endpoint:** `POST /api/v1/busca/hibrida`  
**Objetivo:** Recuperar trechos combinando a precisão semântica (vetores) com a exatidão textual (palavras-chave, códigos de erro e nomes de tabelas SQL).

```mermaid
flowchart TD
    Q["Pergunta / Termo de Busca\n(Ex: 'Erro 400 ao cadastrar título')"] --> Embed["Gera Embedding da Pergunta\n(obterProvedorVetorial)"]
    Embed --> SQL["Monta Query Híbrida no PostgreSQL"]

    subgraph Pontuacao ["Cálculo da Pontuação Composta"]
        VScore["Score Vetorial (75%)\n1 - (f.vetor <=> vetor_param::vector)"]
        LScore["Score Lexical (25%)\nCASE WHEN f.conteudo ILIKE termo_param THEN 0.25 ELSE 0 END"]
        Comb["Pontuação Final = Score Vetorial + Score Lexical"]
        VScore --> Comb
        LScore --> Comb
    end

    SQL --> Pontuacao
    Pontuacao --> Filtro["Filtro Rígido por:\n- Sistema (ex: Volpe)\n- Módulo (ex: Financeiro)\n- Versão (ex: 2026.1)"]
    Filtro --> Ordenacao["ORDER BY pontuacao DESC LIMIT N"]
    Ordenacao --> Res["Retorno dos Melhores Fragmentos\n(com página, capítulo e pontuação)"]
```

---

### Fluxo 3: Ciclo de Pergunta e Resposta RAG (Anti-Alucinação)

**Endpoint:** `POST /api/v1/chat`  
**Objetivo:** Responder a dúvidas dos usuários fundamentando cada afirmação em trechos comprovados dos manuais e registrando lacunas caso a documentação seja omissa.

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Usuário / Analista
    participant ChatAPI as chat.rotas
    participant ChatSvc as ServicoChat
    participant Busca as ServicoBusca
    participant BD as PostgreSQL
    participant LLM as ProvedorLLM

    Cliente->>ChatAPI: POST /api/v1/chat {pergunta, conversaId?, sistema, modulo, versao}
    ChatAPI->>ChatSvc: perguntar(dados)
    
    opt Sem conversaId
        ChatSvc->>BD: INSERT INTO conversas (titulo, sistema, modulo, versao)
    end
    ChatSvc->>BD: INSERT INTO mensagens (papel='usuario', conteudo=pergunta)

    ChatSvc->>Busca: buscaHibrida(pergunta, sistema, modulo, versao, limite=4)
    Busca-->>ChatSvc: Fragmentos recuperados com pontuação

    alt Sem fragmentos ou Pontuação Máxima < 0.25 (Evidência Insuficiente)
        ChatSvc->>BD: INSERT INTO lacunas_conhecimento (pergunta, sistema, modulo, motivo)
        ChatSvc->>BD: INSERT INTO mensagens (papel='assistente', conteudo='Não encontrei informações suficientes...')
        ChatSvc-->>Cliente: Resposta informando ausência de documentação (Sem alucinação)
    else Evidências Suficientes
        ChatSvc->>ChatSvc: Monta Prompt Contextualizado com [FONTE N: Manual, Módulo, Página]
        ChatSvc->>LLM: gerar(comando, instrucaoSistema)
        LLM-->>ChatSvc: Resposta fundamentada com citações
        ChatSvc->>BD: INSERT INTO mensagens (papel='assistente', conteudo=resposta, fontes=metadados)
        ChatSvc-->>Cliente: {conversaId, resposta, fontes: [{tituloDocumento, numeroPagina, trecho}]}
    end
```

---

### Fluxo 4: Diagnóstico Guiado de Erros e Logs

**Endpoint:** `POST /api/v1/diagnostico`  
**Objetivo:** Receber uma mensagem de erro, stack trace, código de retorno e payload enviado, correlacionar com a base de conhecimento e gerar um diagnóstico estruturado.

```mermaid
sequenceDiagram
    autonumber
    actor Suporte as Desenvolvedor / Suporte ERP
    participant DiagAPI as diagnostico.rotas
    participant DiagSvc as ServicoDiagnostico
    participant Busca as ServicoBusca
    participant LLM as ProvedorLLM
    participant BD as PostgreSQL

    Suporte->>DiagAPI: POST /diagnostico {sistema, modulo, codigoErro, logErro, dadosEnviados, operacao}
    DiagAPI->>DiagSvc: diagnosticar(dados)

    DiagSvc->>Busca: buscaHibrida(codigoErro + logErro)
    Busca-->>DiagSvc: Manuais de integração, tabelas de erro, schemas

    DiagSvc->>DiagSvc: Monta Prompt solicitando JSON estrito
    DiagSvc->>LLM: gerar(prompt com evidências documentais)
    LLM-->>DiagSvc: Resposta estruturada (Fatos, Hipóteses, Passos, Confiança)
    
    DiagSvc->>BD: INSERT INTO diagnosticos (sistema, modulo, codigoErro, fatosDocumentados, hipotesesTecnicas, passosInvestigacao, confianca)
    DiagSvc-->>DiagAPI: Resultado estruturado
    DiagAPI-->>Suporte: HTTP 200 com Diagnóstico Técnico Completo
```

---

## 4. Modelagem do Banco de Dados (ERD em Português)

```mermaid
erDiagram
    documentos ||--o{ fragmentos_documentos : "possui (1:N)"
    conversas ||--o{ mensagens : "possui (1:N)"

    documentos {
        uuid id PK
        varchar titulo "Título descritivo do documento"
        varchar sistema "Nome do ERP (ex: Volpe, SAP)"
        varchar modulo "Módulo (ex: Fiscal, Financeiro)"
        varchar versao "Versão do ERP (ex: 2026.1)"
        varchar tipo_documento "manual, api, banco_dados, catalogo_erros"
        varchar nome_arquivo "Nome original do arquivo"
        varchar tipo_mime "application/pdf, text/plain"
        text caminho_arquivo "Caminho no disco"
        varchar status "pendente, processando, indexado, falha"
        text mensagem_erro "Log em caso de falha"
        integer quantidade_fragmentos "Total de fragmentos gerados"
        timestamp criado_em
        timestamp atualizado_em
    }

    fragmentos_documentos {
        uuid id PK
        uuid documento_id FK "Chave estrangeira -> documentos.id"
        integer indice_fragmento "Ordem do fragmento no documento"
        text conteudo "Trecho de texto extraído"
        integer numero_pagina "Página de origem no PDF"
        varchar titulo_capitulo "Título do capítulo ou seção"
        vector vetor "Vetor pgvector (dimensão 768)"
        jsonb metadados "Metadados adicionais em JSON"
        timestamp criado_em
    }

    conversas {
        uuid id PK
        varchar titulo "Título da conversa / assunto"
        varchar sistema "Filtro de sistema"
        varchar modulo "Filtro de módulo"
        varchar versao "Filtro de versão"
        timestamp criado_em
        timestamp atualizado_em
    }

    mensagens {
        uuid id PK
        uuid conversa_id FK "Chave estrangeira -> conversas.id"
        varchar papel "usuario, assistente, sistema"
        text conteudo "Texto da mensagem"
        jsonb fontes "Array com fontes consultadas e páginas"
        timestamp criado_em
    }

    diagnosticos {
        uuid id PK
        varchar sistema "Sistema ERP"
        varchar modulo "Módulo afetado"
        varchar codigo_erro "Código do erro (ex: HTTP 400)"
        text log_erro "Log ou exceção reportada"
        text dados_enviados "Payload JSON enviado"
        jsonb fatos_documentados "Fatos confirmados pelo manual"
        jsonb hipoteses_tecnicas "Hipóteses deduzidas pela IA"
        jsonb passos_investigacao "Passos de resolução"
        varchar confianca "alta, media, baixa, insuficiente"
        jsonb fontes "Fontes consultadas"
        timestamp criado_em
    }

    lacunas_conhecimento {
        uuid id PK
        text pergunta "Pergunta não respondida"
        varchar sistema "Sistema informado"
        varchar modulo "Módulo informado"
        text motivo "Motivo da insuficiência"
        integer resolvido "0 = Pendente, 1 = Resolvido"
        timestamp criado_em
    }
```

---

## 5. Catálogo Completo de Endpoints REST (Português)

| Método | Rota | Descrição | Parâmetros Principais |
|---|---|---|---|
| `GET` | `/saude` | Verificação de conectividade com banco e provedores | N/A |
| `GET` | `/docs` | Documentação interativa Swagger UI | N/A |
| `POST` | `/api/v1/documentos/upload` | Ingestão e indexação de novo manual/documento | Form multipart: `file`, `titulo`, `sistema`, `modulo`, `versao`, `tipoDocumento` |
| `GET` | `/api/v1/documentos` | Listagem de documentos cadastrados com filtros | Query: `sistema`, `modulo`, `versao` |
| `GET` | `/api/v1/documentos/:id` | Retorna metadados e todos os fragmentos de um manual | Param: `id` (UUID) |
| `DELETE` | `/api/v1/documentos/:id` | Exclui arquivo físico e remove fragmentos do banco | Param: `id` (UUID) |
| `POST` | `/api/v1/busca/hibrida` | Busca combinada por similaridade de cosseno e texto | Body: `{ termoBusca, sistema, modulo, versao, limite }` |
| `POST` | `/api/v1/chat` | Chat RAG fundamentado com fontes e citações | Body: `{ pergunta, conversaId, sistema, modulo, versao }` |
| `GET` | `/api/v1/chat/:conversaId/historico` | Recupera todas as mensagens de uma conversa | Param: `conversaId` (UUID) |
| `POST` | `/api/v1/diagnostico` | Diagnóstico técnico de logs, payloads e erros de ERP | Body: `{ sistema, modulo, codigoErro, logErro, dadosEnviados, operacao }` |
| `GET` | `/api/v1/metricas/visao-geral` | Estatísticas gerais de documentos e fragmentos | N/A |
| `GET` | `/api/v1/metricas/lacunas` | Relatório de perguntas sem resposta suficiente | Query: `resolvido` (boolean) |
| `PATCH` | `/api/v1/metricas/lacunas/:id/resolver` | Marca uma lacuna como atendida após atualização do manual | Param: `id` (UUID) |
