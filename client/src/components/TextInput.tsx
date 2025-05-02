
import React, { useState } from 'react';
import { AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TextInputProps {
  onTextSubmit: (text: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ onTextSubmit }) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onTextSubmit(text);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="bg-muted/30 p-6 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-4">
          <AlignLeft className="h-5 w-5 text-quiz-primary" />
          <h3 className="text-lg font-medium">Enter Text Content</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="text-content">Paste or type your content here</Label>
          <Textarea 
            id="text-content"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text content for your quiz (notes, articles, study material, etc.)"
            className="min-h-[200px]"
          />
          <p className="text-xs text-muted-foreground">
            Your text will be processed to generate relevant quiz questions
          </p>
        </div>
        
        <Button 
          onClick={handleSubmit}
          className="mt-4"
          disabled={!text.trim()}
        >
          Use This Content
        </Button>
      </div>
    </div>
  );
};

export default TextInput;
