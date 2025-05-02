
import React, { useState } from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  userAnswer?: string | string[];
  imageUrl?: string;
}

interface QuizQuestionProps {
  question: Question;
  index: number;
  isAnswered: boolean;
  onChange: (questionId: string, answer: string | string[]) => void;
  onSubmit: (questionId: string) => void;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  index,
  isAnswered,
  onChange,
  onSubmit,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  
  const isCorrect = () => {
    if (!question.userAnswer) return false;
    
    if (Array.isArray(question.correctAnswer)) {
      if (!Array.isArray(question.userAnswer)) return false;
      return question.correctAnswer.every(a => question.userAnswer?.includes(a));
    }
    
    return question.userAnswer === question.correctAnswer;
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={question.userAnswer as string}
            onValueChange={value => onChange(question.id, value)}
            disabled={isAnswered}
            className="space-y-2 mt-4"
          >
            {question.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`q${index}-option-${i}`} />
                <Label
                  htmlFor={`q${index}-option-${i}`}
                  className="flex-grow py-2 px-3 rounded-md hover:bg-muted/50 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'true-false':
        return (
          <RadioGroup
            value={question.userAnswer as string}
            onValueChange={value => onChange(question.id, value)}
            disabled={isAnswered}
            className="flex space-x-4 mt-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`q${index}-true`} />
              <Label htmlFor={`q${index}-true`}>True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`q${index}-false`} />
              <Label htmlFor={`q${index}-false`}>False</Label>
            </div>
          </RadioGroup>
        );
      
      case 'fill-blank':
        return (
          <div className="mt-4">
            <Input 
              value={question.userAnswer as string || ''}
              onChange={e => onChange(question.id, e.target.value)}
              disabled={isAnswered}
              placeholder="Type your answer here"
              className="w-full"
            />
          </div>
        );
      
      case 'short-answer':
        return (
          <div className="mt-4">
            <Textarea 
              value={question.userAnswer as string || ''}
              onChange={e => onChange(question.id, e.target.value)}
              disabled={isAnswered}
              placeholder="Type your answer here"
              rows={3}
              className="w-full"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="quiz-card mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          Question {index + 1}
          {isAnswered && (
            isCorrect() ? 
              <Check className="h-5 w-5 text-green-500" /> : 
              <X className="h-5 w-5 text-red-500" />
          )}
        </h3>
        <div className="text-sm font-medium px-3 py-1 rounded-full bg-muted">
          {question.type === 'multiple-choice' ? 'Multiple Choice' : 
           question.type === 'true-false' ? 'True/False' : 
           question.type === 'fill-blank' ? 'Fill in the Blank' : 
           'Short Answer'}
        </div>
      </div>

      {question.imageUrl && (
        <div className="mb-4 rounded-md overflow-hidden">
          <img 
            src={question.imageUrl} 
            alt={`Question ${index + 1}`} 
            className="w-full h-auto max-h-60 object-cover" 
          />
        </div>
      )}

      <p className="text-base mb-4">{question.text}</p>

      {renderQuestionInput()}

      {!isAnswered && (
        <Button 
          onClick={() => onSubmit(question.id)} 
          className="mt-4"
          disabled={!question.userAnswer}
        >
          Submit Answer
        </Button>
      )}

      {isAnswered && question.explanation && (
        <Collapsible 
          open={showExplanation}
          onOpenChange={setShowExplanation}
          className="mt-4"
        >
          <div className="flex justify-between items-center">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <HelpCircle className="h-4 w-4" />
                {showExplanation ? "Hide Explanation" : "Show Explanation"}
              </Button>
            </CollapsibleTrigger>
            {!isCorrect() && (
              <div className="text-sm">
                <span className="font-medium">Correct answer: </span>
                <span className="text-gray-700">
                  {Array.isArray(question.correctAnswer) 
                    ? question.correctAnswer.join(', ') 
                    : question.correctAnswer}
                </span>
              </div>
            )}
          </div>
          <CollapsibleContent className="mt-4 p-4 bg-muted/30 rounded-md">
            {question.explanation}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default QuizQuestion;
