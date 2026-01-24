import os
import glob
from langchain_community.document_loaders import TextLoader, DirectoryLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from db import get_vector_store

# 默认知识库目录（优先级最高，包含精华内容）
KNOWLEDGE_DIR = os.path.join(os.path.dirname(__file__), "knowledge")
# 外部知识库目录（产品知识库）
EXTERNAL_KNOWLEDGE_DIR = os.path.join(os.path.dirname(__file__), "..", "产品知识库")
# PDF 文件目录
PDF_DIR = os.path.dirname(os.path.dirname(__file__))

# 优先加载的精华文件（这些文件会被优先检索）
PRIORITY_FILES = [
    "product_judge_essentials.md",  # ProductThink 专用精华
    "lenny_podcast_essentials.md",  # Lenny播客精华
    "核心知识精华.md",
    "产品沉思录 · 核心知识精华.md",
    "梁宁产品思维框架.txt",
    "精华洞见摘要.md",
]

# 精华目录：持续更新（01-06 主题目录）
ESSENTIAL_DIRS = [
    "01-产品与设计",
    "02-商业与战略",
    "03-思维与认知",
    "04-成长与效能",
    "05-技术与AI",
    "06-其他",
]

def load_text_files(directory: str, priority_boost: bool = False):
    """加载目录中的 .txt 和 .md 文件"""
    documents = []
    if not os.path.exists(directory):
        print(f"目录不存在: {directory}")
        return documents

    for ext in ["**/*.md", "**/*.txt"]:
        try:
            loader = DirectoryLoader(
                directory,
                glob=ext,
                loader_cls=TextLoader,
                loader_kwargs={"encoding": "utf-8"}
            )
            docs = loader.load()
            for doc in docs:
                doc.metadata["source_type"] = "text"
                doc.metadata["source_dir"] = directory
                # 标记优先级文件
                filename = os.path.basename(doc.metadata.get("source", ""))
                if filename in PRIORITY_FILES or priority_boost:
                    doc.metadata["priority"] = "high"
                else:
                    doc.metadata["priority"] = "normal"
            documents.extend(docs)
        except Exception as e:
            print(f"加载 {ext} 文件时出错: {e}")

    return documents

def load_pdf_files(directory: str):
    """加载目录中的 PDF 文件"""
    documents = []
    pdf_pattern = os.path.join(directory, "*.pdf")
    pdf_files = glob.glob(pdf_pattern)

    for pdf_path in pdf_files:
        try:
            print(f"正在加载 PDF: {os.path.basename(pdf_path)}")
            loader = PyPDFLoader(pdf_path)
            docs = loader.load()
            for doc in docs:
                doc.metadata["source_type"] = "pdf"
                doc.metadata["filename"] = os.path.basename(pdf_path)
                doc.metadata["priority"] = "normal"
            documents.extend(docs)
            print(f"  - 加载了 {len(docs)} 页")
        except Exception as e:
            print(f"加载 PDF {pdf_path} 时出错: {e}")

    return documents

def ingest_knowledge(mode: str = "full"):
    """
    读取知识库文件并索引到 ChromaDB

    mode:
    - "full": 导入所有内容（完整模式）
    - "essentials": 只导入精华内容（快速模式，推荐）
    """

    all_documents = []

    # 1. 加载内置知识库 (backend/knowledge/) - 优先级最高
    print(f"\n📚 加载内置知识库: {KNOWLEDGE_DIR}")
    if os.path.exists(KNOWLEDGE_DIR):
        docs = load_text_files(KNOWLEDGE_DIR, priority_boost=True)
        all_documents.extend(docs)
        print(f"  - 加载了 {len(docs)} 个文档（高优先级）")

    if mode == "full":
        # 2. 加载外部知识库 (产品知识库/)
        print(f"\n📚 加载外部知识库: {EXTERNAL_KNOWLEDGE_DIR}")
        if os.path.exists(EXTERNAL_KNOWLEDGE_DIR):
            docs = load_text_files(EXTERNAL_KNOWLEDGE_DIR)
            all_documents.extend(docs)
            print(f"  - 加载了 {len(docs)} 个文档")

        # 3. 加载 PDF 文件
        print(f"\n📚 加载 PDF 文件: {PDF_DIR}")
        pdf_docs = load_pdf_files(PDF_DIR)
        all_documents.extend(pdf_docs)
        print(f"  - 加载了 {len(pdf_docs)} 页 PDF")
    else:
        print("\n⚡ 精简模式：加载精华文件 + 主题目录（持续更新）")
        # 2. 加载外部知识库中的主题目录（01-06）
        if os.path.exists(EXTERNAL_KNOWLEDGE_DIR):
            essential_docs = []
            for subdir in ESSENTIAL_DIRS:
                dir_path = os.path.join(EXTERNAL_KNOWLEDGE_DIR, subdir)
                if os.path.exists(dir_path):
                    docs = load_text_files(dir_path)
                    essential_docs.extend(docs)
            all_documents.extend(essential_docs)
            print(f"  - 加载了 {len(essential_docs)} 个主题文档")

    if not all_documents:
        print("\n⚠️ 没有找到任何文档")
        return

    print(f"\n📊 总共加载了 {len(all_documents)} 个文档")

    # 4. 分割文本（优化分块策略）
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,  # 减小块大小，提高检索精度
        chunk_overlap=150,
        separators=["\n\n", "\n", "。", "！", "？", "；", " ", ""]
    )
    docs = text_splitter.split_documents(all_documents)
    print(f"📊 分割成 {len(docs)} 个文本块")

    # 5. 索引到向量数据库
    print("\n🔄 正在索引到 ChromaDB...")
    vector_store = get_vector_store()
    vector_store.add_documents(docs)
    print("✅ 知识库导入完成！")

    # 6. 显示统计信息
    print("\n📈 知识库统计:")
    sources = {}
    priorities = {"high": 0, "normal": 0}
    for doc in all_documents:
        source_type = doc.metadata.get("source_type", "unknown")
        sources[source_type] = sources.get(source_type, 0) + 1
        priority = doc.metadata.get("priority", "normal")
        priorities[priority] = priorities.get(priority, 0) + 1

    for source_type, count in sources.items():
        print(f"  - {source_type}: {count} 个文档")
    print(f"  - 高优先级文档: {priorities['high']} 个")
    print(f"  - 普通优先级文档: {priorities['normal']} 个")

def clear_knowledge():
    """清空知识库（用于重新导入）"""
    import shutil
    db_dir = os.path.join(os.path.dirname(__file__), "chroma_db")
    if os.path.exists(db_dir):
        shutil.rmtree(db_dir)
        print("✅ 知识库已清空")
    else:
        print("⚠️ 知识库目录不存在")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == "--clear":
            clear_knowledge()
        elif sys.argv[1] == "--essentials":
            clear_knowledge()
            ingest_knowledge(mode="essentials")
        elif sys.argv[1] == "--full":
            clear_knowledge()
            ingest_knowledge(mode="full")
    else:
        # 默认使用精简模式
        print("使用方法:")
        print("  python ingest.py --essentials  # 只导入精华内容（推荐，速度快）")
        print("  python ingest.py --full        # 导入所有内容（完整但较慢）")
        print("  python ingest.py --clear       # 清空知识库")
        print("\n默认执行精简模式...")
        clear_knowledge()
        ingest_knowledge(mode="essentials")
