import os

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

CODE_PATH = "/Users/sebastianlaube/Documents/1_CODING/stickman-physics"
DB_PATH = "/Users/sebastianlaube/Documents/1_CODING/stickman-physics/chroma_db"

SKIP_DIRS = {".git", ".venv", "chroma_db", "node_modules"}


def load_code_files(path):
    documents = []
    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for file in files:
            if file.endswith((".js", ".html", ".css")):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, path)
                with open(full_path, "r", encoding="utf-8") as f:
                    content = f.read()
                documents.append(
                    Document(
                        page_content=content,
                        metadata={"source": rel_path, "filename": file},
                    )
                )
                print(f"  Loaded: {rel_path}")
    return documents


print("Loading code files...")
docs = load_code_files(CODE_PATH)
print(f"Loaded {len(docs)} files.\n")

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
    separators=["\n\n", "\nfunction ", "\nclass ", "\nconst ", "\n", " "],
)

chunks = []
for doc in docs:
    splits = splitter.split_documents([doc])
    chunks.extend(splits)

print(f"Split into {len(chunks)} chunks.")

print("\nBuilding vector store (this may take a moment)...")
embeddings = OllamaEmbeddings(model="nomic-embed-text")
vectorstore = Chroma.from_documents(chunks, embeddings, persist_directory=DB_PATH)
print("Vector store created and saved.")
