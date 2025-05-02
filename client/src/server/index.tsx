
// This is the main server file that provides API functions for the client
import { Quiz } from '../types/quiz';
import { fetchAllQuizzes, fetchQuizById, createQuiz, deleteQuiz as removeQuiz, updateExistingQuiz } from '../services/quizService';

// Get all quizzes from API
export const getAllQuizzes = async (): Promise<Quiz[]> => {
  try {
    const quizList = JSON.parse(localStorage.getItem('quizzes') || '[]');
    return quizList
    // return await fetchAllQuizzes();
  } catch (error) {
    console.error('Error loading quizzes:', error);
    return [];
  }
};

// Get a specific quiz by ID
export const getQuizById = async (id: string): Promise<Quiz | null> => {
  try {
    return await fetchQuizById(id);
  } catch (error) {
    console.error('Error getting quiz by ID:', error);
    return null;
  }
};

// Save a new quiz
export const saveQuiz = async (quiz: Quiz): Promise<boolean> => {
  try {
    return await createQuiz(quiz);
  } catch (error) {
    console.error('Error saving quiz:', error);
    return false;
  }
};

// Delete a quiz by ID
export const deleteQuiz = async (id: string): Promise<boolean> => {
  try {
    return await removeQuiz(id);
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return false;
  }
};

// Update an existing quiz
export const updateQuiz = async (updatedQuiz: Quiz): Promise<boolean> => {
  try {
    return await updateExistingQuiz(updatedQuiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    return false;
  }
};
