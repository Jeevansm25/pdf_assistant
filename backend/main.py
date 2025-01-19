from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from models import Document
from database import get_db
from pydantic import BaseModel
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import logging
from llama_index.core import SimpleDirectoryReader, GPTVectorStoreIndex

from llama_index.llms.openai import OpenAI

# Logger configuration for FastAPI and SQLAlchemy
logging.basicConfig(level=logging.DEBUG)
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
logging.getLogger("sqlalchemy.pool").setLevel(logging.DEBUG)

logger = logging.getLogger("uvicorn")
logger.setLevel(logging.DEBUG)

# Load environment variables
load_dotenv()

# Ensure OpenAI API key exists
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

app = FastAPI()

# CORS middleware to allow requests from frontend
origins = [
    "http://localhost:5173",  # React dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to save uploaded files
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# LlamaIndex setup
llm = OpenAI(api_key=OPENAI_API_KEY)

# Function to process PDFs with LlamaIndex
def process_pdf_with_llama(file_path: str):
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            logger.error(f"File not found at {file_path}")
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        # Read PDF content and build LlamaIndex
        documents = SimpleDirectoryReader(input_files=[file_path]).load_data()
        index = GPTVectorStoreIndex.from_documents(documents, llm=llm)
        return index
    except Exception as e:
        logger.error(f"Error processing PDF with LlamaIndex: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process the document: {e}")

# Pydantic models for request/response
class QuestionRequest(BaseModel):
    document_id: str
    question: str

class QuestionResponse(BaseModel):
    answer: str

# Middleware to log all requests and responses
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response

# API endpoint to upload PDFs
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # Generate unique file name
        file_id = str(uuid.uuid4())
        file_name = f"{file_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        # Save the file locally
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Insert document metadata into the database
        new_document = Document(
            id=file_id,
            name=file.filename,
            path=file_path,
            created_at=datetime.utcnow(),
        )
        db.add(new_document)
        db.commit()

        return {"message": "File uploaded successfully", "id": new_document.id}
    except Exception as e:
        logger.error(f"Error during file upload: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {e}")

# API endpoint to ask questions related to the document
@app.post("/question", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest, db: Session = Depends(get_db)):
    try:
        logger.debug(f"Fetching document with id {request.document_id}")
        doc = db.query(Document).filter(Document.id == request.document_id).first()

        if not doc:
            logger.error(f"Document with id {request.document_id} not found")
            raise HTTPException(status_code=404, detail="Document not found")

        logger.debug(f"Document found: {doc.name} at {doc.path}")
        
        # Process the document to create an index
        logger.debug(f"Processing document at path {doc.path}")
        index = process_pdf_with_llama(doc.path)

        # Query the index for the answer
        logger.debug(f"Querying index with question: {request.question}")
        response = index.query(request.question)

        return QuestionResponse(answer=str(response))

    except HTTPException as e:
        logger.error(f"Error querying document: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while answering the question.")
