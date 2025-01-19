import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const askQuestion = async (documentId :string , question :string) => {
  const response = await fetch("http://localhost:8000/question", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      document_id: documentId,
      question: question,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get answer");
  }

  return response.json(); // Assuming the response returns the answer
};