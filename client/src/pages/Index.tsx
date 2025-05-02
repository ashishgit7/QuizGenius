
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, UploadCloud, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-white to-quiz-secondary/20">
          <div className="container max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-heading">
              Turn Any Content Into Interactive Quizzes
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Upload text, images, PDFs or paste a link and let AI create personalized quizzes in seconds.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-quiz-primary hover:bg-quiz-primary/90 text-white px-8"
                onClick={() => navigate('/create')}
              >
                <UploadCloud className="mr-2 h-5 w-5" /> Create Quiz
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/quizzes')}
              >
                View My Quizzes
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="h-14 w-14 rounded-full bg-quiz-secondary/30 flex items-center justify-center mb-4">
                  <UploadCloud className="h-7 w-7 text-quiz-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload Content</h3>
                <p className="text-muted-foreground">
                  Drag and drop files, upload images, PDFs, or paste URLs to websites with educational content.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="h-14 w-14 rounded-full bg-quiz-secondary/30 flex items-center justify-center mb-4">
                  <Brain className="h-7 w-7 text-quiz-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Generation</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes your content and creates tailored questions with different question types and difficulty levels.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="h-14 w-14 rounded-full bg-quiz-secondary/30 flex items-center justify-center mb-4">
                  <BarChart3 className="h-7 w-7 text-quiz-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Take & Share</h3>
                <p className="text-muted-foreground">
                  Take the quiz yourself, track your progress, and share quizzes with others to test their knowledge.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-quiz-primary/5">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Create Your First Quiz?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Upload your study materials and let our AI handle the rest. Get started in seconds.
            </p>
            <Button 
              size="lg" 
              className="bg-quiz-primary hover:bg-quiz-primary/90 text-white px-8"
              onClick={() => navigate('/create')}
            >
              Start Now
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 py-8 px-4 border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2023 QuizStitcher. All rights reserved.</p>
          <p className="text-sm mt-2">Powered by React, Tailwind CSS, and OpenAI</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
