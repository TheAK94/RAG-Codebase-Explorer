# 🚀 RAG Codebase Explorer

A **Retrieval-Augmented Generation (RAG)** powered tool that allows
users to **analyze any GitHub repository using natural language**.

------------------------------------------------------------------------

## 🧠 Features

-   🔍 Ask questions about any GitHub repo\
-   ⚡ Fast semantic search using vector embeddings\
-   🧩 Code-aware chunking\
-   🗂️ File-level insights\
-   🧠 LLM-powered explanations\
-   🔄 Async ingestion\
-   🧹 Automatic cleanup\
-   🧱 Multi-repository support

------------------------------------------------------------------------

##  Architecture

User → Repo URL → Clone → Chunk → Embed → Store → Query → LLM Answer

------------------------------------------------------------------------

##  Tech Stack

-   FastAPI\
-   LangChain\
-   OpenAI\
-   Qdrant\
-   React\
-   Docker

------------------------------------------------------------------------

## ⚙️ Setup

``` bash
git clone <repo>
cd RAG-Codebase-Explorer
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env`:

    OPENAI_API_KEY=your_key

Run Qdrant:

``` bash
docker run -p 6333:6333 qdrant/qdrant
```

Run backend:

``` bash
python -m uvicorn server:app --reload
```

Run frontend:

``` bash
cd frontend
npm install
npm run dev
```

------------------------------------------------------------------------

## 🚀 Usage

### Ingest Repo

POST `/ingest`

### Check Status

GET `/status/{repo_id}`

### Query

POST `/query`

------------------------------------------------------------------------

##  Structure

    ingest/
    embeddings/
    rag/
    pipeline/
    server.py
    frontend/
    repos/

------------------------------------------------------------------------

##  Highlights

-   Repo isolation via `repo_id`
-   Qdrant per repo collection
-   Auto repo cleanup
-   Async ingestion

------------------------------------------------------------------------

##  Future Work

-   Streaming responses\
-   Hybrid search\
-   Reranking\
-   Deployment

------------------------------------------------------------------------

##  Author
Bipin Kumar
Atharva kalaskar
Ayush Sekhani 
Ayush Sharma

