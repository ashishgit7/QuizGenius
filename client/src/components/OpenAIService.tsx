import { toast } from 'sonner';
import { processFile, setOpenAIApiKey } from '@/services/quizService';
import axios from 'axios';

interface QuizSettings {
  questionCount: number;
  quizType: string;
  difficulty: string;
  includeExplanations: boolean;
  timeLimit: number;
  topic: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  imageUrl?: string;
}

class OpenAIService {
  private apiKey: string | null = null;
  private extractedContent: Map<string, string> = new Map();

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
    
    setOpenAIApiKey(key)
      .then(success => {
        if (!success) {
          toast.error('Failed to set API key on server');
        }
      })
      .catch(error => {
        toast.error('Failed to set API key on server');
      });
  }

  getApiKey(): string | null {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('openai_api_key');
    }
    return this.apiKey;
  }

  async extractTextFromFiles(files: File[], onProgress?: (message: string) => void): Promise<string[]> {
    const contents: string[] = [];
    onProgress?.('Extracting content from files...');

    for (const file of files) {
      if (this.extractedContent.has(file.name)) {
        contents.push(this.extractedContent.get(file.name) || '');
        continue;
      }

      try {
        if (file.type.includes('image')) {
          const result = await processFile(file, 0, '', 'medium', '');
          const content = `Content extracted from image: ${file.name}. Using server-side processing.`;
          this.extractedContent.set(file.name, content);
          contents.push(content);
        } else if (file.type === 'application/pdf') {
          const result = await processFile(file, 0, '', 'medium', '');
          const content = `Content extracted from PDF: ${file.name}. Using server-side processing.`;
          this.extractedContent.set(file.name, content);
          contents.push(content);
        } else if (file.type.includes('text')) {
          const content = await file.text();
          this.extractedContent.set(file.name, content);
          contents.push(content);
        }
      } catch (error) {
        console.error(`Error extracting content from ${file.name}:`, error);
        toast.error(`Failed to extract content from ${file.name}`);
      }
    }

    return contents;
  }

  addDirectTextContent(text: string, title: string = "Direct Text Input"): void {
    if (!text.trim()) return;
    
    this.extractedContent.set(title, text);
  }

  private async simulateImageOCR(file: File): Promise<string> {
    const imageUrl = URL.createObjectURL(file);
    const fileName = file.name.toLowerCase();
    
    let content = `Content extracted from image: ${file.name}. `;
    
    if (fileName.includes('diagram') || fileName.includes('chart')) {
      content += "This image appears to be a diagram or chart illustrating key concepts or data related to the topic.";
    } else if (fileName.includes('graph')) {
      content += "This image shows a graph with data points and trends that demonstrate relationships between variables.";
    } else if (fileName.includes('map')) {
      content += "This image contains a map showing geographical locations and potentially historical or political boundaries.";
    } else if (fileName.includes('photo') || fileName.includes('picture') || fileName.includes('jpg') || fileName.includes('png')) {
      content += "This photograph captures a scene or subject that provides visual context for the material being studied.";
    } else {
      content += "The image contains visual information related to the subject matter that supplements the textual content.";
    }
    
    content += `\n[IMAGE_URL:${imageUrl}]`;
    
    return content;
  }

  private async simulatePDFExtraction(file: File): Promise<string> {
    const fileName = file.name.toLowerCase();
    let content = `Content extracted from PDF: ${file.name}. `;
    
    if (fileName.includes('report')) {
      content += "This document contains a comprehensive report with findings, analysis, and conclusions on the subject matter.";
    } else if (fileName.includes('paper') || fileName.includes('research')) {
      content += "This academic paper presents research, methodology, results, and discussions related to the topic.";
    } else if (fileName.includes('guide') || fileName.includes('manual')) {
      content += "This document serves as a guide or manual with instructions, procedures, and explanations for processes related to the subject.";
    } else if (fileName.includes('book') || fileName.includes('text')) {
      content += "This text contains chapters and sections covering various aspects of the subject matter in detail.";
    } else {
      content += "The document provides information, explanations, and context about the topic being studied.";
    }
    
    return content;
  }

  async generateQuiz(
    files: File[],
    settings: QuizSettings,
    onProgress?: (message: string) => void,
    directText?: string,
    directURL?: string
  ): Promise<{ questions: QuizQuestion[]; quizName: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key is not set');
    }
    
    if (directText && directText.trim()) {
      // this.addDirectTextContent(directText);
      onProgress?.('Processing text input...');
      const options = settings;
      const content = { content: directText, contentType: "text" };
        const questions = await axios.post('/api/generate-quiz/', {
          content,
          options,
          
        });
        return {questions : questions.data.questions, quizName: questions.data.quizName};

    }

    if (directURL && directURL.trim()) {
      // this.addDirectTextContent(`Content from URL: ${directURL}`, "URL Content");
      onProgress?.('Processing URL content...');
      const options = settings;
      const content = { content: directURL, contentType: "url" };
        const questions = await axios.post('/api/generate-quiz/', {
          content,
          options,
          
        });
        return questions.data.questions;
    }

    if (files.length > 0) {
      onProgress?.('Processing files through API...');
      try {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });
        const response = await axios.post('/api/upload/', formData);
        const content = {...response.data,contentType:"files"};
        const options = settings;
        const questions = await axios.post('/api/generate-quiz/', {
          content,
          options,
          
        });
        return {questions : questions.data.questions, quizName: questions.data.quizName};
      } catch (error) {
        console.error('Error processing file through API:', error);
        throw error;
      }
    }
    
    const contentArray = Array.from(this.extractedContent.values());
    
    if (contentArray.length === 0 && !directText && !directURL) {
      throw new Error('No content to generate quiz from. Please upload files, enter text, or provide a URL.');
    }
    
    onProgress?.('Generating questions...');
    
    const questions: QuizQuestion[] = [];
    
    for (let i = 0; i < settings.questionCount; i++) {
      const questionType = settings.quizType === 'mixed' 
        ? this.getRandomQuestionType() 
        : settings.quizType as 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer';
      
      const combinedContent = contentArray.join('\n\n');
      const questionData = this.generateQuestionFromContent(
        combinedContent, 
        questionType, 
        settings.topic, 
        settings.difficulty,
        i,
        `You are an expert quiz creator. Generate questions based on the provided content.`
      );
      
      const imageUrlMatch = combinedContent.match(/\[IMAGE_URL:(.*?)\]/);
      let imageUrl = undefined;
      
      if (i % 3 === 0 && imageUrlMatch && imageUrlMatch[1]) {
        imageUrl = imageUrlMatch[1];
      }
      
      let question: QuizQuestion = {
        id: `q-${i + 1}`,
        text: questionData.text,
        type: questionType,
        correctAnswer: questionData.answer,
        ...(questionData.options && { options: questionData.options }),
        ...(imageUrl && { imageUrl }),
      };
      
      if (settings.includeExplanations) {
        question.explanation = questionData.explanation;
      }
      
      questions.push(question);
    }
    
    return this.shuffleArray(questions);
  }

  private getRandomQuestionType(): 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer' {
    const types: ('multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer')[] = [
      'multiple-choice', 'true-false', 'fill-blank', 'short-answer'
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateQuestionFromContent(
    content: string, 
    type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer',
    topic: string,
    difficulty: string,
    index: number,
    customPrompt: string = ''
  ): { text: string; options?: string[]; answer: string | string[]; explanation: string } {
    const words = content.split(/\s+/).filter(word => word.length > 4);
    const keywords = this.shuffleArray([...new Set(words)]).slice(0, 10);
    
    const questionFocus = topic || keywords.slice(0, 3).join(', ');
    
    let questionText = '';
    let options: string[] | undefined;
    let answer: string | string[];
    let explanation = '';
    
    const difficultyFactor = difficulty === 'easy' ? 'basic' : 
                           difficulty === 'medium' ? 'intermediate' : 
                           'advanced';
    
    switch (type) {
      case 'multiple-choice':
        questionText = this.generateMultipleChoiceQuestion(questionFocus, difficultyFactor, index, content);
        options = this.generateContentBasedOptions(content, 4);
        answer = options[0];
        explanation = `The correct answer is "${answer}" because it most accurately reflects the ${difficultyFactor} concepts related to ${questionFocus} as presented in the materials.`;
        break;
        
      case 'true-false':
        const isTrueStatement = Math.random() > 0.5;
        questionText = this.generateTrueFalseQuestion(questionFocus, difficultyFactor, isTrueStatement, content);
        answer = isTrueStatement ? 'true' : 'false';
        explanation = `This statement is ${answer} because ${isTrueStatement ? 'it correctly' : 'it incorrectly'} describes the relationship between ${keywords.slice(0, 2).join(' and ')} in the context of ${questionFocus}.`;
        break;
        
      case 'fill-blank':
        const { question, blankAnswer } = this.generateFillBlankQuestion(questionFocus, difficultyFactor, content);
        questionText = question;
        answer = blankAnswer;
        explanation = `The correct answer "${answer}" completes the statement about ${questionFocus} by providing the specific ${difficultyFactor} term that connects the concepts mentioned in the question.`;
        break;
        
      case 'short-answer':
        questionText = this.generateShortAnswerQuestion(questionFocus, difficultyFactor, index, content);
        answer = this.generateShortAnswer(questionFocus, content);
        explanation = `A comprehensive answer would address how ${answer} relates to ${questionFocus} and explain its significance within the broader context of the material.`;
        break;
    }
    
    return { text: questionText, options, answer, explanation };
  }
  
  private generateMultipleChoiceQuestion(topic: string, difficulty: string, index: number, content: string): string {
    const questions = [
      `What is the main concept of ${topic} discussed in the material?`,
      `Which of the following statements about ${topic} is correct based on the content?`,
      `According to the materials, what is the relationship between ${topic} and related concepts?`,
      `What conclusion can be drawn about ${topic} from the provided content?`,
      `How does the material describe the importance of ${topic}?`,
      `What evidence supports the main argument about ${topic} in the content?`,
      `Which factor related to ${topic} is identified as most important?`,
      `What is the chronological development of ${topic} as described in the content?`,
      `How would you summarize the perspective on ${topic} presented in the material?`,
      `What methodology is used to analyze ${topic} according to the content?`
    ];
    
    const sentences = content.split(/[.!?]+/).filter(s => s.length > 10);
    const relevantSentences = sentences.filter(s => 
      s.toLowerCase().includes(topic.toLowerCase()) || 
      s.length > 30
    );
    
    if (relevantSentences.length > 0 && index % 2 === 0) {
      const selectedSentence = relevantSentences[index % relevantSentences.length].trim();
      return `Based on this information: "${selectedSentence}", which of the following is true about ${topic}?`;
    }
    
    return questions[index % questions.length];
  }
  
  private generateTrueFalseQuestion(topic: string, difficulty: string, isTrue: boolean, content: string): string {
    const truePrefixes = [
      `${topic} is characterized by`,
      `The concept of ${topic} involves`,
      `Studies have shown that ${topic} leads to`,
      `Experts agree that ${topic} contributes to`,
      `Research confirms that ${topic} is associated with`
    ];
    
    const falsePrefixes = [
      `${topic} has no relationship with`,
      `It is widely rejected that ${topic} causes`,
      `There is no evidence suggesting ${topic} affects`,
      `Contrary to popular belief, ${topic} does not involve`,
      `Studies have disproven that ${topic} leads to`
    ];
    
    const prefixes = isTrue ? truePrefixes : falsePrefixes;
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    
    const words = content.split(/\s+/).filter(word => word.length > 4);
    const randomWords = this.shuffleArray(words).slice(0, 3).join(', ');
    
    return `${prefix} ${randomWords}.`;
  }
  
  private generateFillBlankQuestion(topic: string, difficulty: string, content: string): { question: string; blankAnswer: string } {
    const templates = [
      `The primary function of ${topic} is ____________.`,
      `${topic} is defined as a process where ____________ occurs.`,
      `The relationship between ${topic} and other factors is best described as ____________.`,
      `When analyzing ${topic}, researchers often focus on ____________.`,
      `The historical development of ${topic} can be characterized by ____________.`
    ];
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const words = content.split(/\s+/).filter(word => word.length > 4);
    const uniqueWords = [...new Set(words)];
    const randomWords = this.shuffleArray(uniqueWords).slice(0, 2).join(' ');
    
    let answer = '';
    if (difficulty === 'basic') {
      answer = randomWords;
    } else if (difficulty === 'intermediate') {
      answer = `the process of ${randomWords}`;
    } else {
      answer = `the systematic integration of ${randomWords} within broader contexts`;
    }
    
    return { question: template, blankAnswer: answer };
  }
  
  private generateShortAnswerQuestion(topic: string, difficulty: string, index: number, content: string): string {
    const questions = [
      `Explain the significance of ${topic} as presented in the material.`,
      `How does ${topic} relate to the broader themes discussed in the content?`,
      `What are the key characteristics of ${topic} according to the information provided?`,
      `Analyze the impact of ${topic} on related concepts mentioned in the material.`,
      `Describe the methodology used to study ${topic} as outlined in the content.`,
      `What evidence supports the claims about ${topic} in the provided material?`,
      `Compare and contrast ${topic} with other concepts mentioned in the content.`,
      `Summarize the main arguments regarding ${topic} presented in the material.`,
      `What critiques or limitations of ${topic} are discussed in the content?`,
      `How has the understanding of ${topic} evolved according to the information provided?`
    ];
    
    return questions[index % questions.length];
  }
  
  private generateShortAnswer(topic: string, content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => 
      s.toLowerCase().includes(topic.toLowerCase()) || 
      s.length > 30
    );
    
    if (sentences.length > 0) {
      return sentences.slice(0, 2).join('. ').trim() + '.';
    }
    
    return `The analysis of ${topic} requires consideration of multiple factors including context, methodology, and theoretical frameworks. A comprehensive understanding involves examining both qualitative and quantitative aspects.`;
  }

  private generateContentBasedOptions(content: string, count: number): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.length > 10 && s.length < 100);
    
    let options: string[] = [];
    
    if (sentences.length >= count) {
      options = this.shuffleArray(sentences)
        .slice(0, count)
        .map(sentence => {
          let shortened = sentence.trim();
          if (shortened.length > 80) {
            shortened = shortened.substring(0, 80) + '...';
          }
          return shortened;
        });
    } else {
      const genericOptions = [
        'The process involves systematic analysis of underlying patterns',
        'It demonstrates a correlation between key variables',
        'The concept represents an integrated theoretical framework',
        'It follows a cyclical development pattern over time',
        'The approach is based on evidence-gathered methodology',
        'It requires contextual interpretation of multiple factors',
        'The system demonstrates emergent properties not found in individual components',
        'It challenges conventional understanding of the subject matter'
      ];
      
      options = this.shuffleArray(genericOptions).slice(0, count);
    }
    
    return options;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}

export default new OpenAIService();
