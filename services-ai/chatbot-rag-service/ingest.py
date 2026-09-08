import os
import glob
import sys

# Assurer l'encodage UTF-8 pour les logs Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter


def main():
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    db_path = os.path.join(os.path.dirname(__file__), "chroma_db")

    all_docs = []

    # ── Charger tous les fichiers PDF ──
    pdf_files = glob.glob(os.path.join(data_dir, "**", "*.pdf"), recursive=True)
    for pdf_path in pdf_files:
        print(f"  [PDF] Chargement : {os.path.basename(pdf_path)}")
        try:
            loader = PyPDFLoader(pdf_path)
            docs = loader.load()
            for doc in docs:
                doc.metadata["source_file"] = os.path.basename(pdf_path)
            all_docs.extend(docs)
        except Exception as e:
            print(f"  [ERREUR] Erreur lors du chargement de {pdf_path}: {e}")

    # ── Charger tous les fichiers TXT ──
    txt_files = glob.glob(os.path.join(data_dir, "**", "*.txt"), recursive=True)
    for txt_path in txt_files:
        print(f"  [TXT] Chargement : {os.path.basename(txt_path)}")
        try:
            loader = TextLoader(txt_path, encoding="utf-8")
            docs = loader.load()
            for doc in docs:
                doc.metadata["source_file"] = os.path.basename(txt_path)
            all_docs.extend(docs)
        except Exception as e:
            print(f"  [ERREUR] Erreur lors du chargement de {txt_path}: {e}")

    if not all_docs:
        print("[AVERTISSEMENT] Aucun document trouvé dans le dossier 'data/'.")
        return

    print(f"\n[INFO] {len(all_docs)} document(s) chargé(s) au total.")

    # ── Découper en chunks ──
    print("[INFO] Découpage en chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    splits = text_splitter.split_documents(all_docs)
    print(f"   -> {len(splits)} chunks créés.")

    # ── Créer les embeddings et persister dans ChromaDB ──
    print("[INFO] Création des embeddings avec HuggingFace (all-MiniLM-L6-v2)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # Supprimer l'ancienne base si elle existe
    if os.path.exists(db_path):
        import shutil
        shutil.rmtree(db_path, ignore_errors=True)
        print("   [INFO] Ancienne base ChromaDB nettoyée.")

    vectorstore = Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        persist_directory=db_path,
    )

    print(f"\n[SUCCES] Ingestion terminée ! Base vectorielle sauvegardée dans : {db_path}")
    print(f"   -> {len(splits)} vecteurs indexés avec succès.")


if __name__ == "__main__":
    main()
