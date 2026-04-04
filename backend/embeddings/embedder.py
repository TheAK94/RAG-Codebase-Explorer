from dotenv import load_dotenv
import os
load_dotenv()

from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient



# EMBEDDING MODEL

def get_embedding_model():
    return OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=os.getenv("OPENAI_API_KEY")
    )



# STORE EMBEDDINGS

def store_embeddings(chunks, collection_name: str):

    embeddings = get_embedding_model()

    try:
        qdrant_host = os.getenv("QDRANT_HOST", "localhost")
        qdrant_port = os.getenv("QDRANT_PORT", "6333")
        vectorstore = QdrantVectorStore.from_documents(
            documents=chunks,
            embedding=embeddings,
            url=f"http://{qdrant_host}:{qdrant_port}",
            collection_name=collection_name,
        )

        print(f"✅ Stored embeddings in collection: {collection_name}")

        return vectorstore

    except Exception as e:
        print(" Embedding storage failed:", str(e))
        raise e

if __name__ == "__main__":

    from ingest.load_files import load_code_files
    from ingest.chunk_code import chunk_code_documents

    repo_path = "repos/sample_repo"
    repo_id = "test_repo"

    # load files
    docs = load_code_files(repo_path)

    # chunk code (with repo_id)
    chunks = chunk_code_documents(docs, repo_id=repo_id)

    print("Total chunks:", len(chunks))

    # store embeddings (IMPORTANT)
    vectorstore = store_embeddings(chunks, collection_name=repo_id)

    print(f"✅ Embeddings stored in Qdrant collection: {repo_id}")




