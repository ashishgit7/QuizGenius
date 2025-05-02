
import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Image, Globe, FileArchive } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  }, []);

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const type = file.type.toLowerCase();
      return (
        type.includes('text') || 
        type.includes('image') || 
        type.includes('pdf') || 
        type.includes('application/json') ||
        type.includes('msword') ||
        type.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      );
    });

    if (validFiles.length < files.length) {
      toast.warning("Some files were skipped. We only support text, images, PDFs, and documents.");
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    if (type.includes('image')) return <Image className="h-5 w-5 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('text')) return <FileText className="h-5 w-5 text-green-500" />;
    return <FileArchive className="h-5 w-5 text-gray-500" />;
  };

  const processFiles = () => {
    onFilesAdded(uploadedFiles);
    toast.success(`${uploadedFiles.length} files ready for quiz generation!`);
  };

  return (
    <div className="w-full space-y-4">
      <div 
        className={`file-drop-area ${isDragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 mx-auto mb-2 text-quiz-primary" />
        <p className="text-lg font-medium mb-2">Drag files here or click to browse</p>
        <p className="text-sm text-muted-foreground mb-4">
          Upload text, images, PDFs, or documents
        </p>
        <Button 
          variant="outline" 
          onClick={() => document.getElementById('file-input')?.click()}
        >
          Browse Files
        </Button>
        <input 
          id="file-input" 
          type="file" 
          className="hidden" 
          onChange={handleFileInput} 
          multiple 
          accept="image/*,text/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="bg-muted/50 rounded-md p-4">
          <h3 className="font-medium mb-2">Uploaded Files ({uploadedFiles.length})</h3>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-background rounded-md p-2">
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={processFiles}
              disabled={isUploading}
            >
              Continue with {uploadedFiles.length} Files
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
