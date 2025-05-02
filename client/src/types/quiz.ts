
export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  imageUrl?: string;
}

export interface QuizSettings {
  questionCount: number;
  quizType: string;
  difficulty: string;
  includeExplanations: boolean;
  timeLimit: number;
  topic: string;
}

export interface Quiz {
  id: string;
  title: string;
  createdAt: string;
  questions: QuizQuestion[];
  settings: QuizSettings;
}
