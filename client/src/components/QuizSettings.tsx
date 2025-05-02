
import React, { useState } from 'react';
import { 
  Cpu, 
  HelpCircle, 
  List, 
  ToggleLeft, 
  MessageSquareText, 
  Puzzle, 
  AlignLeft,
  Clock
} from 'lucide-react';
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface QuizSettingsData {
  questionCount: number;
  quizType: string;
  difficulty: string;
  includeExplanations: boolean;
  timeLimit: number;
  topic: string;
}

interface QuizSettingsProps {
  onSettingsChange: (settings: QuizSettingsData) => void;
  onGenerate: () => void;
}

const QuizSettings: React.FC<QuizSettingsProps> = ({ onSettingsChange, onGenerate }) => {
  const [settings, setSettings] = useState<QuizSettingsData>({
    questionCount: 5,
    quizType: 'multiple-choice',
    difficulty: 'medium',
    includeExplanations: true,
    timeLimit: 0, // 0 means no time limit
    topic: '',
  });

  const handleSettingsChange = <K extends keyof QuizSettingsData>(
    key: K, 
    value: QuizSettingsData[K]
  ) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    onSettingsChange(updatedSettings);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-quiz-primary" />
          Quiz Settings
        </CardTitle>
        <CardDescription>
          Customize how your quiz will be generated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="topic" className="flex items-center gap-1.5">
              <AlignLeft className="h-4 w-4 text-muted-foreground" />
              Topic Focus (Optional)
            </Label>
          </div>
          <Input 
            id="topic"
            placeholder="E.g., 'Ancient Rome' or 'Machine Learning Basics'"
            value={settings.topic}
            onChange={(e) => handleSettingsChange('topic', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to generate questions from all uploaded content
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="question-count" className="flex items-center gap-1.5">
              <List className="h-4 w-4 text-muted-foreground" />
              Number of Questions
            </Label>
            <span className="text-sm font-medium">{settings.questionCount}</span>
          </div>
          <Slider 
            id="question-count"
            min={1} 
            max={20} 
            step={1} 
            value={[settings.questionCount]} 
            onValueChange={([value]) => handleSettingsChange('questionCount', value)}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>10</span>
            <span>20</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quiz-type" className="flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            Question Type
          </Label>
          <Select 
            value={settings.quizType} 
            onValueChange={(value) => handleSettingsChange('quizType', value)}
          >
            <SelectTrigger id="quiz-type">
              <SelectValue placeholder="Select a question type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
              <SelectItem value="true-false">True/False</SelectItem>
              <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
              <SelectItem value="short-answer">Short Answer</SelectItem>
              <SelectItem value="mixed">Mixed Types</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty" className="flex items-center gap-1.5">
            <Puzzle className="h-4 w-4 text-muted-foreground" />
            Difficulty Level
          </Label>
          <Select 
            value={settings.difficulty} 
            onValueChange={(value) => handleSettingsChange('difficulty', value)}
          >
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="mixed">Mixed Levels</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time-limit" className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Time Limit (minutes)
          </Label>
          <Select 
            value={settings.timeLimit.toString()} 
            onValueChange={(value) => handleSettingsChange('timeLimit', parseInt(value))}
          >
            <SelectTrigger id="time-limit">
              <SelectValue placeholder="Select time limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No Time Limit</SelectItem>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="10">10 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="20">20 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="explanations" className="flex items-center gap-1.5">
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              Include Explanations
            </Label>
            <p className="text-xs text-muted-foreground">
              Add detailed explanations for correct answers
            </p>
          </div>
          <Switch 
            id="explanations"
            checked={settings.includeExplanations}
            onCheckedChange={(checked) => handleSettingsChange('includeExplanations', checked)}
          />
        </div>

        <Button 
          className="w-full bg-quiz-primary hover:bg-quiz-primary/90"
          onClick={onGenerate}
        >
          Generate Quiz
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuizSettings;
