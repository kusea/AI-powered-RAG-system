# SmartMind AI - SaaS Knowledge Base & Smart Document RAG System

SmartMind AI is a production-ready SaaS platform designed for enterprise internal knowledge management and intelligent document interaction, powered by the **RAG (Retrieval-Augmented Generation)** architecture. The system enables users to upload complex document formats (PDF, TXT, DOCX), automatically parses and converts them into vector embeddings, and leverages Large Language Models (LLMs) to provide real-time, highly accurate Q&A responses backed by verifiable source citations.

This project was built with a core focus on production-grade system design, networking optimization, API security, and high scalability.

---

## 🚀 Key Features

- **Automated Data Ingestion Pipeline:** Seamlessly parses PDF/DOCX files and applies intelligent semantic chunking (with configurable window overlap) to preserve context continuity.
- **Semantic Vector Search:** Integrates a vector database engine to query enterprise data based on contextual meaning rather than legacy keyword-matching (`LIKE` queries).
- **Real-Time Streaming AI Chat:** Leverages the **Server-Sent Events (SSE)** protocol to stream LLM responses word-by-word back to the client, heavily optimizing latency and user experience.
- **Verifiable Citations & Sources:** Every AI response links back to exact document fragments (File Name, Page Number, Text Snippet), successfully mitigating LLM hallucinations.
- **Network Rate Limiting:** Implements a sliding/fixed window rate-limiting middleware backed by **Redis** to prevent API abuse, spamming, and potential DDoS vectors.
- **Robust Security Architecture:** Implements Role-Based Access Control (RBAC), secure password hashing, and stateless user authentication via encrypted **JWT Tokens**.

---

## 🏗️ System Architecture

The project adheres to **Clean Architecture / Layered Architecture** principles, decoupling business logic from external frameworks to ensure maintainability and testability.

```text
backend/
├── app/
│   ├── api/v1/         # API Routers & Controllers (Client communication)
│   ├── core/           # Global Configurations, Security, DB Sessions
│   ├── middlewares/    # Network filters (Redis Rate Limiter Middleware)
│   ├── models/         # Relational database models (PostgreSQL schemas)
│   ├── schemas/        # Pydantic Data validation & Serialization layers
│   └── services/       # Core Business Logic (RAG Engine, Ingestion Pipeline, AI service)
├── storage/            # Local temporary file system storage (S3 Mock)
└── tests/              # Automated Test Suites (Pytest)

frontend/
├── src/
│   ├── components/              # UI components to use 
│   ├── pages/                   # Manage page-transfer UI
│   ├── services/                # Manage API-call to backend
│   ├── hooks/                   # Custom React Hooks
│   └── types/                   # Define Typescripts datatypes
```

## 🛠️ Tech Stack
### Backend & AI Infrastructure
- **Framework**: Python (FastAPI) - Asynchronous ASGI execution for high-concurrency performance.

- **AI Orchestration**: LangChain / LlamaIndex.

- **LLM & Embedding Engine**: OpenAI API (gpt-4o, text-embedding-3-small) / Local deployment using Ollama (Llama 3).

- **Primary Relational & Vector DB**: PostgreSQL (with pgvector extension for efficient vector index scanning).

- **Caching & Rate Limiting**: Redis (TCP-based high-speed key-value cache layer).

### Frontend Architecture
- **Framework**: Next.js (App Router) + TypeScript.

- **Styling & Components**: Tailwind CSS + Shadcn UI.

- **State & Connection**: Axios (with Interceptors for automated Bearer JWT attaching) + EventSource API (for SSE streams consumption).

