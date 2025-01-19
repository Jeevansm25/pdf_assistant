import React, { useState } from 'react';
import { FileText, Upload, Send, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { uploadDocument, askQuestion } from './api';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDocument, setCurrentDocument] = useState<{ id: string; name: string } | null>(null);
  const [conversations, setConversations] = useState<Array<{ question: string; answer: string }>>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setIsLoading(true);

      try {
        const response = await uploadDocument(file);
        setCurrentDocument({ id: response.id, name: file.name });
        setConversations([]);
      } catch (err) {
        console.error('Upload error:', err);
        setError('Failed to upload document. Please try again.');
        setSelectedFile(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !currentDocument) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await askQuestion(currentDocument.id, question);
      setConversations(prev => [...prev, {
        question,
        answer: response.answer
      }]);
      setQuestion('');
    } catch (err) {
      setError('Failed to get answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">PDF Q&A Assistant</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
              <div className="space-y-4">
                <label className="block">
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                          <span>Upload a PDF file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="application/pdf"
                            onChange={handleFileUpload}
                            disabled={isLoading}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PDF up to 10MB</p>
                    </div>
                  </div>
                </label>
                {currentDocument && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{currentDocument.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Q&A Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
              {/* Conversation History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!currentDocument ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Upload a PDF to start asking questions
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Ask your first question about the document
                  </div>
                ) : (
                  conversations.map((conv, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="h-5 w-5 text-indigo-600 mt-1" />
                        <div className="bg-gray-100 rounded-lg p-3 flex-1">
                          <p className="text-gray-800">{conv.question}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2 pl-8">
                        <div className="bg-indigo-50 rounded-lg p-3 flex-1">
                          <p className="text-gray-800 whitespace-pre-wrap">{conv.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Question Input */}
              <div className="border-t p-4">
                <form onSubmit={handleQuestionSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={currentDocument ? "Ask a question about the document..." : "Upload a document first"}
                    disabled={!currentDocument || isLoading}
                    className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={!currentDocument || isLoading || !question.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
