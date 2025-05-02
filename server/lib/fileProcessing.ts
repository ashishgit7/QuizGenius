import fs from 'fs';
import util from 'util';
import { createWorker } from 'tesseract.js';
import axios from 'axios';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { fromPath } from 'pdf2pic';
import path from 'path';
import { extractTextFromImageUsingOpenAI } from './openai';
import { fileURLToPath } from "url";
import { dirname } from "path";
import { WriteImageResponse } from 'pdf2pic/dist/types/convertResponse';
import * as cheerio  from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Fallback for PDF parsing in case of errors
const safePdfParse = async (buffer: Buffer): Promise<{text: string}> => {
  try {
    return await pdfParse(buffer);
  } catch (error) {
    console.error('Error during PDF parsing:', error);
    return { text: "PDF text extraction encountered an issue. Content may be partial or unavailable." };
  }
};
export const isYouTubeURL = (url:string) =>
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);

export const getTextFromWebpage = async (url:string) => {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return text;
};

export const getTextFromYouTube = async (url:string) => {
  const transcript = await YoutubeTranscript.fetchTranscript(url);
  return transcript.map((item) => item.text).join(' ');
};

// Function to extract text from an image using Tesseract.js
export async function extractTextFromImage(imagePath: string): Promise<string> {
  try {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to extract text from a PDF using pdf-parse
export async function extractTextFromPDF(pdfPath: string): Promise<WriteImageResponse[]>{
  try {
    // const readFile = util.promisify(fs.readFile);
    // const dataBuffer = await readFile(pdfPath);
    // const data = await pdfParse(dataBuffer);
    // return data.text;
    const uploadDir = path.join(__dirname, "../uploads/pdf_images");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    console.log("Converting PDF to images...");
    const images = await convertPdfToImages(pdfPath, uploadDir);
    return images;
    // let extractedText = "";
    // for (const image of images) {
    //     console.log(`Processing ${image}...`);
    //     extractedText += await extractTextFromImageUsingOpenAI(image) + "\n";
    // }

    // return extractedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to extract text from a URL
export async function extractTextFromURL(url: string): Promise<string> {
  try {
    // This is a very simplified approach to fetch text content from a URL
    // For production, you might want to use a more robust web scraping library
    const response = await axios.get(url);
    
    // Basic HTML content extraction (removing HTML tags)
    // A more sophisticated approach would use a proper HTML parser like cheerio
    let text = response.data;
    if (typeof text === 'string') {
      text = text.replace(/<[^>]*>?/gm, ' '); // Remove HTML tags
      text = text.replace(/\s+/g, ' '); // Normalize whitespace
      text = text.trim(); // Trim whitespace
    } else {
      text = JSON.stringify(text);
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text from URL:', error);
    throw new Error(`Failed to extract text from URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Function to read and convert an image file to base64
export async function imageToBase64(imagePath: string): Promise<string> {
  try {
    const readFile = util.promisify(fs.readFile);
    if(!fs.readFileSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }
    if(typeof imagePath !== 'string') {
      throw new Error('Image path must be a string');
    }
    const data = await readFile(imagePath);
    return data.toString('base64');
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : String(error)}`);
  }
}
async function convertPdfToImages(pdfPath:string, outputDir:string): Promise<WriteImageResponse[]> {
    const converter = fromPath(pdfPath, { 
      density: 300, // Image resolution
      savePath: outputDir,
      format: "png",
      width: 800,
      height: 1000
  });

  const images:WriteImageResponse[] = await converter.bulk(-1); // Convert all pages
  return images;
  
}
