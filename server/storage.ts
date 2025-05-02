import { 
  users, type User, type InsertUser,
  quizzes, type Quiz, type InsertQuiz,
  questions, type Question, type InsertQuestion,
} from "@shared/schema";

export interface IStorage {
  // User methods (from original file)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quiz methods
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  listQuizzes(): Promise<Quiz[]>;
  
  // Question methods
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsForQuiz(quizId: number): Promise<Question[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizzes: Map<number, Quiz>;
  private questions: Map<number, Question>;
  
  private userId: number;
  private quizId: number;
  private questionId: number;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.questions = new Map();
    
    this.userId = 1;
    this.quizId = 1;
    this.questionId = 1;
  }

  // User methods (from original file)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Quiz methods
  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.quizId++;
    const createdAt = new Date();
    
    // Ensure required fields have default values
    const quiz: Quiz = { 
      ...insertQuiz, 
      id, 
      createdAt,
      questionCount: insertQuiz.questionCount || 10,
      difficulty: insertQuiz.difficulty || 'medium',
      quizType: insertQuiz.quizType || 'multiple-choice'
    };
    
    this.quizzes.set(id, quiz);
    return quiz;
  }
  
  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }
  
  async listQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzes.values());
  }
  
  // Question methods
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.questionId++;
    const question: Question = { 
      ...insertQuestion, 
      id,
      explanation: insertQuestion.explanation || null 
    };
    this.questions.set(id, question);
    return question;
  }
  
  async getQuestionsForQuiz(quizId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.quizId === quizId);
  }
}

export const storage = new MemStorage();
