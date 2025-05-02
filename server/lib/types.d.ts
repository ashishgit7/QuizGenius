declare module 'pdf-parse/lib/pdf-parse.js' {
  function pdfParse(dataBuffer: Buffer): Promise<{ text: string }>;
  export default pdfParse;
}

// Fix Tesseract Worker type issues
declare module 'tesseract.js' {
  export interface Worker {
    loadLanguage(language: string): Promise<any>;
    initialize(language: string): Promise<any>;
    recognize(image: any): Promise<any>;
    terminate(): Promise<any>;
  }
  
  export function createWorker(): Promise<Worker>;
}