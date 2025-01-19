# PDF Q&A Backend

This is the backend service for the PDF Q&A application. It provides endpoints for uploading PDFs and asking questions about their content.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
- Copy `.env.example` to `.env`
- Add your OpenAI API key to `.env`

4. Run the server:
```bash
uvicorn main:app --reload
```

## API Endpoints

### POST /upload
Upload a PDF document.

Request:
- Multipart form data with PDF file

Response:
```json
{
  "id": "uuid",
  "name": "filename.pdf"
}
```

### POST /question
Ask a question about a document.

Request:
```json
{
  "document_id": "uuid",
  "question": "What is this document about?"
}
```

Response:
```json
{
  "answer": "The document is about..."
}
```

## Architecture

- FastAPI for the web framework
- SQLite for document metadata storage
- LangChain for PDF processing and Q&A
- FAISS for vector storage
- OpenAI for embeddings and question answering