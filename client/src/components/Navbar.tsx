
import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, BookOpen, Lightbulb, MessageSquare, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-quiz-primary" />
          <span className="text-xl font-bold gradient-heading">QuizStitcher</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-quiz-primary transition-colors">
            Home
          </Link>
          <Link to="/create" className="text-sm font-medium hover:text-quiz-primary transition-colors">
            Create Quiz
          </Link>
          <Link to="/quizzes" className="text-sm font-medium hover:text-quiz-primary transition-colors">
            My Quizzes
          </Link>
          {/* <Link to="/feed" className="text-sm font-medium hover:text-quiz-primary transition-colors">
            Feed
          </Link> */}
        </nav>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex gap-2 items-center" 
            asChild
          >
            <Link to="/feed">
              <MessageSquare className="h-4 w-4" />
              Quiz Feed
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex gap-2 items-center"
            asChild
          >
            {/* <Link to="/sign-in">
              <LogIn className="h-4 w-4" />
              Sign In
            </Link> */}
          </Button>
          {/* <Button className="bg-quiz-primary hover:bg-quiz-primary/90" asChild>
            <Link to="/sign-up">
              <BookOpen className="h-4 w-4 mr-2" /> Sign Up
            </Link>
          </Button> */}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
