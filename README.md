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
│   ├── public/                  
│   ├── services/                # Manage API-call to backend
│   ├── hooks/                   # Custom React Hooks
│   └── types/                   # Define Typescripts datatypes
```
---

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

---

## ⚙️ Prerequisites
Before running the project, ensure you have the following installed:

- Python 3.10+ & pip

- Node.js 18+ & npm or yarn

- PostgreSQL (with pgvector extension enabled)

- Redis server

- (Optional) Ollama (or any other AI models) if running models locally

---

## 🔑 Environment Variables Configuration
Create a .env file in both the backend/ and frontend/ directories using the following templates:

### Backend Configuration (backend/.env)
```code
    DB_PASSWORD = your_db_password
    DB_USER = your_db_user
    DB_HOST = your_localhost
    DB_PORT = your_postgre_host
    DB_NAME = your_db_name
    DIMENSION = your_AI_dimension

    SECRET_KEY=your_super_secret_jwt_key_here
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=60
    GOOGLE_CLIENT_ID = your_google_client_id.apps.googleusercontent.com

    REDIS_HOST = your_redis_host
    REDIS_PORT = 6379

    # AI Configuration (Choose either OpenAI or Ollama)
    OPENAI_API_KEY=your_openai_api_key_here
    # AI_BASE_URL = your_ai_base_url
```

### Frontend Configuration (frontend/.env)
```
    NEXT_PUBLIC_API_URL=your_api_endpoint_url
    PUBLIC_URL = your_backend_url
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---
## 🚀 Getting Started
### 1. Setup Backend
**1. Navigate to the backend directory:**
```
    cd backend
```
**2. Create and activate a virtual environment:**
```
    python -m venv venv
    source venv/bin/activate  # On Windows use: venv\Scripts\activate
```
**3. Install dependencies:**
```
    pip install -r requirements.txt
```
**4. Start the FastAPI development server:**
```
    uvicorn app.main:app --reload
```

### 2. Setup Frontend
**1. Navigate to the frontend directory:**
```
    cd frontend
```
**2. Install dependencies:**
```
    npm install
    # or
    yarn install
```
**3. Start the Next.js development server:**
```
    npm run dev
    # or
    yarn dev
```
**4. Open http://localhost:3000 in your browser to interact with the application.**

---
## 📖 End-User & Developer Usage Guide

Once both the backend and frontend systems are up and running, follow this step-by-step guide to fully navigate and utilize the SmartMind AI platform.

### 1. User Authentication & Onboarding
- **Sign Up:** Navigate to `http://localhost:3000/signup`. Enter your details to register a new account. The system securely hashes passwords on the backend via `passlib`.
- **Log In:** Go to `http://localhost:3000/login`. Upon successful authentication, the system generates a secure, stateless **JWT Access Token**, storing it in the browser session to keep you securely logged in.

### 2. Managing Your Knowledge Base (Documents)
- **Accessing the Dashboard:** After logging in, you will be redirected to the main Dashboard (`/dashboard`). This is your command center.
- **Uploading Files:** Click on the **Upload** action area. You can drag and drop or select local documents (supported formats: `PDF`, `TXT`, `DOCX`). 
  - *Behind the Scenes:* The backend splits the document using intelligent chunking strategy and stores vector representations directly inside the PostgreSQL database using the `pgvector` extension.
- **Viewing Documents:** Go to **All Documents** (`/documents/all`) to view a list of your knowledge files. Clicking on a document card opens a dedicated reader view (`/documents/[id]`) that supports inline rendering for PDFs, Markdown text, and document structures.
**Sharing Documents with Others:** On any document card or within the document viewer, click the **Share** button to open the **Share Modal**.
  - **Granting Access:** Enter the email address of the target user you wish to share the document with. 
  - **Collaborative RAG:** Once shared, the recipient can access, read, and query this document's contents within their own RAG chat sessions.
  - **Revoking Permissions:** You can view the list of users who currently have access within the Share Modal and revoke their permissions at any time, instantly cutting off their access to the document and its vector embeddings.
- **File Management & Trash:** Deleted files are moved to the **Trash** view (`/documents/trash`), allowing you to either permanently remove them or restore them to your active knowledge base.

### 3. Intelligent RAG Chat Interaction
- **Initiating a Session:** Go to the **Chat** interface (`/chat`).
- **Submitting Queries:** Type a natural language question related to your uploaded documents into the input field (e.g., *"What is the termination policy mentioned in the company handbook?"*).
- **Streaming Responses (SSE):** The AI response will stream back in real-time, displaying word-by-word. This reduces perceived latency and simulates a dynamic conversational flow.
- **Source Attributions:** Every response generated by the LLM is accompanied by **Verifiable Citations**. You will see clickable source blocks showing exactly which document name, page number, or text segment the answer was derived from, preventing AI hallucinations.

### 4. Networking, API Limits & Security (For Developers)
- **Rate Limiting Protection:** The backend endpoint `/api/v1/chat/stream` is protected by a custom Redis middleware. If a user or script triggers too many requests within a sliding time window, the system automatically returns a `429 Too Many Requests` HTTP status code to prevent API abuse.
- **Shared Data Access:** Use the **Share to Me** feature (`/share-to-me`) to view and query files that have been explicitly cross-shared among users within the RBAC authorization schema.



