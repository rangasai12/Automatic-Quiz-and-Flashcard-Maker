import os
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from groq import Groq
from langchain.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
import hashlib
import tempfile
from io import BytesIO
from models import Quiz, FlashCard
from typing import List
import instructor
# Initialize FastAPI app
app = FastAPI()

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
client = instructor.from_groq(client)


# Helper function to save file temporarily and load it
def load_course_files(file: UploadFile):
    # Read file content into memory
    file_content = file.file.read()
    file_name = file.filename.lower()
    
    # Create a temporary file to store the uploaded file content
    with tempfile.NamedTemporaryFile(delete=False, mode='wb') as temp_file:
        temp_file.write(file_content)
        temp_file_path = temp_file.name
        
    # Handle different file types
    if file_name.endswith(".pdf"):
        loader = PyPDFLoader(temp_file_path)  # Use the temporary file path for PyPDFLoader
    elif file_name.endswith(".txt"):
        loader = TextLoader(temp_file_path)  # Use the temporary file path for TextLoader
    else:
        raise ValueError("Unsupported file type")
    
    documents = loader.load()
    # Remove the temporary file after loading
    os.remove(temp_file_path)
    return documents

# Helper function to split documents into chunks
def split_documents(documents):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_documents(documents)
    return chunks

# Helper function to generate embeddings and store them in Chroma
def store_embeddings(chunks, course_name, persist_directory="chroma_db"):
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")  
    vector_db = Chroma.from_documents(chunks, embedding=embedding_model, persist_directory=persist_directory)
    vector_db.persist()
    
    # Save a hash of the course name to avoid recomputing embeddings for the same course
    hash_course(course_name)
    
    return vector_db

# Helper function to check if embeddings exist for a course
def embeddings_exist(course_name, persist_directory="chroma_db"):
    course_hash = hash_course(course_name)
    vector_db_path = os.path.join(persist_directory, f"{course_hash}_vector_db")
    
    if os.path.exists(vector_db_path):
        return True
    return False

# Helper function to generate a hash for the course name to track embeddings
def hash_course(course_name):
    return hashlib.sha256(course_name.encode()).hexdigest()

# Helper function to retrieve relevant content for quiz generation
def get_relevant_content(topic, vector_db, k=5):
    docs = vector_db.similarity_search(topic, k=k)
    return "\n".join([doc.page_content for doc in docs])

# Helper function to generate quiz using Groq's Llama API
def generate_quiz(topic, relevant_content,num_topics):
    prompt = f"Generate a {num_topics} question quiz on {topic} using the following content:\n\n{relevant_content}, ensure that every question does not have same option as correct"

    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        response_model=List[Quiz]
    )
    
    return chat_completion

def generate_flashcards(topic,relevant_content,num_topics):
    prompt = f"Generate a {num_topics} flash cards on {topic} using the following content:\n\n{relevant_content}"

    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        response_model=List[FlashCard]
    )
    
    return chat_completion