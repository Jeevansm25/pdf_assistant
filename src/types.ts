export interface Document {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface Question {
  id: string;
  document_id: string;
  question: string;
  answer: string;
  created_at: string;
}