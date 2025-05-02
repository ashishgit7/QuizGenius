
import { Quiz, QuizQuestion } from '@/types/quiz';
import { toast } from 'sonner';

const API_URL = 'http://localhost:5000/api';

// Fetches all quizzes from the API
export const fetchAllQuizzes = async (): Promise<Quiz[]> => {
  try {
    const response = await fetch(`${API_URL}/quizzes`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quizzes: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    toast.error('Failed to fetch quizzes');
    return [];
  }
};

// Fetches a specific quiz by ID
export const fetchQuizById = async (id: string): Promise<Quiz | null> => {
  try {
    const response = await fetch(`${API_URL}/quizzes/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        toast.error('Quiz not found');
        return null;
      }
      throw new Error(`Failed to fetch quiz: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching quiz:', error);
    toast.error('Failed to fetch quiz');
    return null;
  }
};

// Creates a new quiz
export const createQuiz = async (quiz: Quiz): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quiz),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create quiz: ${response.status}`);
    }
    
    toast.success('Quiz created successfully');
    return true;
  } catch (error) {
    console.error('Error creating quiz:', error);
    toast.error('Failed to create quiz');
    return false;
  }
};

// Deletes a quiz
export const deleteQuiz = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/quizzes/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete quiz: ${response.status}`);
    }
    
    toast.success('Quiz deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    toast.error('Failed to delete quiz');
    return false;
  }
};

// Updates an existing quiz
export const updateExistingQuiz = async (quiz: Quiz): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/quizzes/${quiz.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quiz),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update quiz: ${response.status}`);
    }
    
    toast.success('Quiz updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating quiz:', error);
    toast.error('Failed to update quiz');
    return false;
  }
};

// Sets OpenAI API key
export const setOpenAIApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/files/set-api-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to set API key: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting API key:', error);
    toast.error('Failed to set OpenAI API key');
    return false;
  }
};

// Process file to generate quiz questions
export const processFile = async (
  file: File, 
  questionCount: number, 
  questionType: string,
  difficulty: string = 'medium',
  customPrompt: string = ''
): Promise<any> => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('questionCount', questionCount.toString());
    formData.append('questionType', questionType);
    formData.append('difficulty', difficulty);
    
    // Add custom prompt if provided
    if (customPrompt) {
      formData.append('prompt', customPrompt);
    }
    
    const response = await fetch(`${API_URL}/files/process`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to process file: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error processing file:', error);
    toast.error(`Failed to process file: ${error.message || 'Unknown error'}`);
    throw error;
  }
};

// Generate quiz from text content
export const generateQuizFromContent = async (
  content: string,
  settings: any
): Promise<QuizQuestion[]> => {
  try {
    const response = await fetch(`${API_URL}/files/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, settings }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to generate quiz: ${response.status}`);
    }
    
    const result = await response.json();
    return result.questions;
    
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    toast.error(`Failed to generate quiz: ${error.message || 'Unknown error'}`);
    throw error;
  }
};
