from dotenv import load_dotenv
import os
load_dotenv()

from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient



#  Embedding model
def get_embedding_model():
    return OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=os.getenv("OPENAI_API_KEY")
    )


# vector store for each repo
def get_vectorstore(repo_id: str):

    embeddings = get_embedding_model()

    client = QdrantClient(
        host=os.getenv("QDRANT_HOST", "localhost"),
        port=int(os.getenv("QDRANT_PORT", "6333"))
    )

    return QdrantVectorStore(
        client=client,
        collection_name=repo_id, 
        embedding=embeddings,
    )



def search_code(query: str, repo_id: str, k: int = 5, debug: bool = False):

    vectorstore = get_vectorstore(repo_id)

    try:
      
        results_with_scores = vectorstore.similarity_search_with_score(
            query=query,
            k=k
        )

        results = []

        for i, (doc, score) in enumerate(results_with_scores):

            # attach score to metadata (optional but useful)
            doc.metadata["score"] = score

            results.append(doc)

            # 🔥 DEBUG MODE
            if debug:
                print(f"\n--- Result {i+1} ---")
                print(f"📂 File: {doc.metadata.get('source', 'unknown')}")
                print(f"📊 Score: {score:.4f}")
                print(f"🧾 Preview: {doc.page_content[:200]}")

        if debug:
            print(f"\n🔍 Query: {query}")
            print(f"📦 Repo ID: {repo_id}")
            print(f"📊 Total results: {len(results)}\n")

        return results

    except Exception as e:
        print("❌ Retrieval failed:", str(e))
        raise e



if __name__ == "__main__":

    repo_id = input("Enter repo_id: ")
    query = input("Ask about the codebase: ")

    results = search_code(query, repo_id, debug=True)

    print("\n✅ Top results:\n")

    for r in results:
        print("📂 File:", r.metadata.get("source", "unknown"))
        print("📊 Score:", r.metadata.get("score"))
        print(r.page_content[:200])
        print("\n---\n")

