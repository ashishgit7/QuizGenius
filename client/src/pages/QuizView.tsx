import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  BrainCircuit, 
  ArrowLeft, 
  Award, 
  RotateCcw,
  Share2,
  Check,
  CircleSlash,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import QuizQuestion, { Question } from '@/components/QuizQuestion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Quiz {
  id: string;
  title: string;
  createdAt: string;
  questions: Question[];
  settings: {
    questionCount: number;
    quizType: string;
    difficulty: string;
    includeExplanations: boolean;
    timeLimit: number;
    topic: string;
  };
}

const QuizView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, percentage: 0 });
  
  useEffect(() => {
    // Load quiz from localStorage
    try {
      const savedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      const foundQuiz = savedQuizzes.find((q: Quiz) => q.id === id);
      
      if (foundQuiz) {
        setQuiz(foundQuiz);
        
        // Initialize timer if quiz has a time limit
        if (foundQuiz.settings.timeLimit > 0) {
          setTimeLeft(foundQuiz.settings.timeLimit * 60);
          setTimerActive(true);
        }
      } else {
        toast.error('Quiz not found');
        navigate('/quizzes');
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);
  
  // Timer effect
  useEffect(() => {
    if (!timerActive || timeLeft === null) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          setTimerActive(false);
          calculateResults();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);
  
  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    if (!quiz) return;
    
    setQuiz(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        questions: prev.questions.map(q => 
          q.id === questionId ? { ...q, userAnswer: answer } : q
        )
      };
    });
  };
  
  const handleSubmitAnswer = (questionId: string) => {
    setAnsweredQuestions(prev => [...prev, questionId]);
    
    // Check if all questions are answered
    if (quiz && answeredQuestions.length + 1 >= quiz.questions.length) {
      calculateResults();
    }
  };
  
  const calculateResults = () => {
    if (!quiz) return;
    
    setTimerActive(false);
    
    let correct = 0;
    const total = quiz.questions.length;
    
    quiz.questions.forEach(question => {
      if (question.userAnswer) {
        if (Array.isArray(question.correctAnswer)) {
          if (Array.isArray(question.userAnswer) && 
              question.correctAnswer.every(a => question.userAnswer?.includes(a))) {
            correct++;
          }
        } else if (question.userAnswer === question.correctAnswer) {
          correct++;
        }
      }
    });
    
    const percentage = Math.round((correct / total) * 100);
    
    setScore({ correct, total, percentage });
    setShowResults(true);
  };
  
  const resetQuiz = () => {
    if (!quiz) return;
    
    // Reset user answers
    setQuiz(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        questions: prev.questions.map(q => ({ ...q, userAnswer: undefined }))
      };
    });
    
    setAnsweredQuestions([]);
    setShowResults(false);
    
    // Reset timer if applicable
    if (quiz.settings.timeLimit > 0) {
      setTimeLeft(quiz.settings.timeLimit * 60);
      setTimerActive(true);
    }
    
    toast.success('Quiz reset successfully');
  };
  
  const shareToFeed = () => {
    if (!quiz) return;
    
    try {
      // Get existing posts
      const savedPosts = JSON.parse(localStorage.getItem('feedPosts') || '[]');
      
      // Create a new post with the quiz
      const newPost = {
        id: (Math.floor(Math.random() * 1000000) + 1).toString(),
        content: `I just completed "${quiz.title}" and scored ${score.percentage}%!`,
        author: 'Anonymous User',
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        quizId: quiz.id,
        quizTitle: quiz.title
      };
      
      // Add the new post to the beginning of the posts array
      localStorage.setItem('feedPosts', JSON.stringify([newPost, ...savedPosts]));
      
      // Show success message
      toast.success('Quiz shared to feed');
      
      // Navigate to the feed page
      setShowResults(false);
      setTimeout(() => navigate('/feed'), 300);
    } catch (error) {
      console.error('Error sharing quiz:', error);
      toast.error('Failed to share quiz');
    }
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BrainCircuit className="h-12 w-12 mx-auto mb-4 text-quiz-primary animate-pulse" />
            <h2 className="text-xl font-medium">Loading quiz...</h2>
          </div>
        </div>
      </div>
    );
  }
  
  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="p-4 rounded-full bg-quiz-secondary/30 mb-4 inline-block">
              <CircleSlash className="h-12 w-12 text-quiz-primary" />
            </div>
            <h2 className="text-xl font-medium mb-4">Quiz not found</h2>
            <Button onClick={() => navigate('/quizzes')}>
              View All Quizzes
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const progressPercentage = Math.round((answeredQuestions.length / quiz.questions.length) * 100);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 py-6 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/quizzes')}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Quizzes
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/feed')}
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-4 w-4" /> Go to Feed
            </Button>
            
            {timeLeft !== null && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow">
                <Clock className={`h-4 w-4 ${timeLeft < 60 ? 'text-red-500' : 'text-quiz-primary'}`} />
                <span className={`font-medium ${timeLeft < 60 ? 'text-red-500' : ''}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-muted/50 px-3 py-1 rounded-full">
                {quiz.questions.length} Questions
              </div>
              <div className="bg-muted/50 px-3 py-1 rounded-full capitalize">
                {quiz.settings.difficulty} Difficulty
              </div>
              {quiz.settings.timeLimit > 0 && (
                <div className="bg-muted/50 px-3 py-1 rounded-full">
                  {quiz.settings.timeLimit} min Time Limit
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Progress</span>
              <span>{answeredQuestions.length} of {quiz.questions.length} questions answered</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          <div className="space-y-6">
            {quiz.questions.map((question, index) => (
              <QuizQuestion 
                key={question.id}
                question={question}
                index={index}
                isAnswered={answeredQuestions.includes(question.id)}
                onChange={handleAnswerChange}
                onSubmit={handleSubmitAnswer}
              />
            ))}
          </div>
          
          {answeredQuestions.length > 0 && answeredQuestions.length < quiz.questions.length && (
            <div className="mt-8 text-center">
              <Button 
                onClick={calculateResults}
                className="bg-quiz-primary hover:bg-quiz-primary/90"
              >
                Finish Quiz Early
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Quiz Results</DialogTitle>
            <DialogDescription className="text-center">
              {score.percentage >= 80 ? 'Great job!' : 
               score.percentage >= 60 ? 'Good effort!' : 
               'Keep practicing!'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex justify-center mb-6">
              <div className="h-32 w-32 rounded-full bg-quiz-secondary/30 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-quiz-primary">{score.percentage}%</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-xl font-medium">
                You got {score.correct} out of {score.total} questions correct
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => {
                  setShowResults(false);
                  // Wait for dialog to close before navigating
                  setTimeout(() => navigate('/quizzes'), 300);
                }}
                className="flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" /> Done
              </Button>
              
              <Button 
                variant="outline"
                onClick={resetQuiz}
                className="flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Retry Quiz
              </Button>
              
              <Button 
                variant="secondary"
                onClick={shareToFeed}
                className="flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" /> Share to Feed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizView;
