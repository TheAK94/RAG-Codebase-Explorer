import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from rag.retriever import search_code

from dotenv import load_dotenv
load_dotenv()


# LLM
def get_llm():
    return ChatOpenAI(
        model="gpt-4o",
        temperature=0.2,
        api_key=os.getenv("OPENAI_API_KEY")
    )



# BUILD CONTEXT
def build_context(results):
    context = ""

    for r in results:
        source = r.metadata.get("source", "unknown_file")
        content = r.page_content

        context += f"\nFile: {source}\n"
        context += content
        context += "\n\n"

    return context



def answer_question(question: str, repo_id: str, debug: bool = False):

    results = search_code(question, repo_id=repo_id)

    if debug:
        print("\n🧠 DEBUG MODE")
        print(f"Query: {question}")
        print(f"Repo ID: {repo_id}")
        print(f"Retrieved chunks: {len(results)}\n")

        for i, r in enumerate(results):
            print(f"--- Result {i+1} ---")
            print("File:", r.metadata.get("source"))
            print("Preview:", r.page_content[:200])
            print()

    context = build_context(results)

    prompt = PromptTemplate.from_template(
        """
        You are a highly skilled senior software engineer and codebase analyst.

        Your job is to deeply understand and explain a codebase using the provided context.

        ---------------------
        GUIDELINES:

        1. Always base your answer strictly on the provided code context.
        2. If the context is insufficient, clearly say:
        "I don’t have enough information from the codebase."
        3. Prefer accuracy over guessing.

        ---------------------
        HOW TO ANSWER:

        1.  Summary  
        - Brief answer in 2–4 lines.

        2.  Detailed Explanation  
        - Step-by-step logic  
        - Explain interactions

        3.  File References  
        - Mention file names clearly

        4.  Code Insights  
        - Highlight key functions/classes

        5.  Issues / Bugs  
        - Identify risks, inefficiencies

        6. Debugging  
        - Root cause + fix ,  if user asks for debugging then debug the specified code

        7. Improvements  
        - Suggest optimizations , also suggest what you u can use in place of current implementation

        ---------------------
        CODE CONTEXT:
        {context}

        ---------------------
        QUESTION:
        {question}

        ---------------------
        FINAL ANSWER:
    """
    )

    llm = get_llm()
    chain = prompt | llm

    response = chain.invoke({
        "context": context,
        "question": question
    })

    return getattr(response, "content", str(response))
