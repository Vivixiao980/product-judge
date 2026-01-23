import os
from typing import List
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from dotenv import load_dotenv

load_dotenv()

# Persistence directory for the vector DB
DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")

# 支持 OpenRouter 或 OpenAI
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def get_embeddings():
    """Returns the embeddings model, supporting both OpenRouter and OpenAI."""
    if OPENROUTER_API_KEY:
        # 使用 OpenRouter 的 OpenAI 兼容接口
        return OpenAIEmbeddings(
            model="openai/text-embedding-3-small",
            openai_api_key=OPENROUTER_API_KEY,
            openai_api_base="https://openrouter.ai/api/v1"
        )
    elif OPENAI_API_KEY:
        # 直接使用 OpenAI
        return OpenAIEmbeddings(model="text-embedding-3-small")
    else:
        raise ValueError("请设置 OPENROUTER_API_KEY 或 OPENAI_API_KEY")

def get_vector_store():
    """Returns the ChromaDB vector store instance."""
    embeddings = get_embeddings()

    vector_store = Chroma(
        collection_name="product_wisdom",
        embedding_function=embeddings,
        persist_directory=DB_DIR,
    )
    return vector_store

def retrieve_knowledge(query: str, k: int = 3) -> List[str]:
    """Retrieves relevant knowledge from the vector store based on the query."""
    try:
        vector_store = get_vector_store()
        docs = vector_store.similarity_search(query, k=k)
        return [doc.page_content for doc in docs]
    except Exception as e:
        print(f"Knowledge retrieval error: {e}")
        return []
