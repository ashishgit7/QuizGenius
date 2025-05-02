import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleSlash, Loader2, Upload, AlignLeft, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import FileUploader from '@/components/FileUploader';
import TextInput from '@/components/TextInput';
import URLInput from '@/components/URLInput';
import QuizSettings, { QuizSettingsData } from '@/components/QuizSettings';
import OpenAIService from '@/components/OpenAIService';
import { Progress } from '@/components/ui/progress';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'upload' | 'configure' | 'generating'>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [contentText, setContentText] = useState('');
  const [contentURL, setContentURL] = useState('');
  const [contentTab, setContentTab] = useState<'files' | 'text' | 'url'>('files');
  const [settings, setSettings] = useState<QuizSettingsData>({
    questionCount: 5,
    quizType: 'multiple-choice',
    difficulty: 'medium',
    includeExplanations: true,
    timeLimit: 0,
    topic: '',
  });
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleFilesAdded = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
    setStep('configure');
  };

  const handleTextSubmitted = (text: string) => {
    setContentText(text);
    setStep('configure');
  };

  // const handleURLSubmitted = (url: string) => {
  //   setContentURL(url);
  //   setStep('configure');
  // };

  const handleSettingsChange = (newSettings: QuizSettingsData) => {
    setSettings(newSettings);
  };

  const handleGenerate = async () => {
    if (!OpenAIService.getApiKey()) {
      setApiKeyDialogOpen(true);
      return;
    }
    
    if (files.length === 0 && !contentText.trim() && !contentURL.trim()) {
      toast.error('Please upload files, enter text, or provide links to generate a quiz');
      return;
    }
    
    startGeneration();
  };

  const startGeneration = async () => {
    setStep('generating');
    setGenerationProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 800);
      
      const {questions,quizName} = await OpenAIService.generateQuiz(
        files, 
        settings,
        (message) => setProgressMessage(message),
        contentText,
        contentURL
      );

      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      const quiz = {
        id: Date.now().toString(),
        title: settings.topic || quizName || 'Generated Quiz',
        createdAt: new Date().toISOString(),
        questions,
        settings,
      };
      
      const savedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      localStorage.setItem('quizzes', JSON.stringify([...savedQuizzes, quiz]));
      
      setTimeout(() => {
        navigate(`/quiz/${quiz.id}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz. Please try again.');
      setStep('configure');
    }
  };

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    OpenAIService.setApiKey(apiKey.trim());
    setApiKeyDialogOpen(false);
    toast.success('API key saved successfully');
    startGeneration();
  };

  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="max-w-3xl mx-auto w-full">
            <h1 className="text-3xl font-bold mb-2 gradient-heading">Create Quiz</h1>
            <p className="text-muted-foreground mb-8">
              Upload files, enter text, or provide links to generate your quiz
            </p>
            
            <Tabs 
              defaultValue={contentTab} 
              onValueChange={(v) => setContentTab(v as 'files' | 'text')}
              className="mb-8"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="files" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Files
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <AlignLeft className="h-4 w-4" />
                  Enter Text
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="files" className="mt-0">
                <FileUploader onFilesAdded={handleFilesAdded} />
              </TabsContent>
              
              <TabsContent value="text" className="mt-0">
                <TextInput onTextSubmit={handleTextSubmitted} />
              </TabsContent>
            </Tabs>
          </div>
        );
      
      case 'configure':
        return (
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2 gradient-heading">Configure Quiz</h1>
                <p className="text-muted-foreground">
                  Customize your quiz settings before generation
                </p>
              </div>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back to Content
              </Button>
            </div>
            
            {files.length > 0 && (
              <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium mb-2">Files Selected ({files.length})</h3>
                <ul className="text-sm text-muted-foreground">
                  {files.map((file, index) => (
                    <li key={index} className="truncate">• {file.name}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {contentText && (
              <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium mb-2">Text Content</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {contentText.substring(0, 200)}
                  {contentText.length > 200 ? '...' : ''}
                </p>
              </div>
            )}
            
            {contentURL && (
              <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium mb-2">URL Content</h3>
                <p className="text-sm text-muted-foreground truncate">
                  <a href={contentURL} target="_blank" rel="noopener noreferrer" className="text-quiz-primary hover:underline">
                    {contentURL}
                  </a>
                </p>
              </div>
            )}
            
            <QuizSettings onSettingsChange={handleSettingsChange} onGenerate={handleGenerate} />
          </div>
        );
      
      case 'generating':
        return (
          <div className="max-w-xl mx-auto w-full text-center">
            <h1 className="text-3xl font-bold mb-6 gradient-heading">Generating Your Quiz</h1>
            
            <div className="mb-10 flex flex-col items-center">
              <Loader2 className="h-16 w-16 text-quiz-primary animate-spin mb-6" />
              <p className="text-xl mb-8">{progressMessage || 'Processing your content...'}</p>
              
              <div className="w-full space-y-2">
                <Progress value={generationProgress} className="h-2" />
                <p className="text-sm text-right text-muted-foreground">
                  {generationProgress}% complete
                </p>
              </div>
            </div>
            
            <p className="text-muted-foreground max-w-md mx-auto">
              Our AI is analyzing your content and creating high-quality questions. This may take a moment...
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-10 px-4">
        <div className="container mx-auto">
          {renderStepContent()}
        </div>
      </main>
      
      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter OpenAI API Key</DialogTitle>
            <DialogDescription>
              To generate quizzes, we need your OpenAI API key. Your key is stored locally and is never sent to our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can get your API key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-quiz-primary hover:underline">OpenAI dashboard</a>.
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveApiKey}>
              Save and Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateQuiz;
