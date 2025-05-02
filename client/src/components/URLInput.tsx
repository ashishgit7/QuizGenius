
import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface URLInputProps {
  onURLSubmit: (url: string) => void;
}

const URLInput: React.FC<URLInputProps> = ({ onURLSubmit }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = () => {
    // Basic URL validation
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      // Check if URL is valid by creating a URL object
      new URL(url);
      onURLSubmit(url);
      toast.success('URL added successfully');
    } catch (error) {
      toast.error('Please enter a valid URL');
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="bg-muted/30 p-6 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-quiz-primary" />
          <h3 className="text-lg font-medium">Enter URL</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="url-input">Enter the URL of a website or document</Label>
          <div className="flex gap-2">
            <Input 
              id="url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1"
            />
            <Button 
              onClick={handleSubmit}
              disabled={!url.trim()}
            >
              Add URL
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter a URL to a website, article, or document to generate quiz questions
          </p>
        </div>
      </div>
    </div>
  );
};

export default URLInput;
