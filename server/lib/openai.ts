import OpenAI from "openai";
import { type QuizOption, type Question, type Json } from "@shared/schema";
import { getTextFromWebpage, imageToBase64, isYouTubeURL } from "./fileProcessing";


// Initialize OpenAI client with API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "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"
});

// Function to generate quiz questions from text content
export async function generateQuizFromText(
  text: string, 
  options: QuizOption
): Promise<Question[]> {
  try {
    // Prepare the prompt for OpenAI
    text = text.slice(0, 4000); // Limit text length to 4000 characters
    const questionCount = options.questionCount || 10;
    const difficulty = options.difficulty || "medium";
    const quizType = options.quizType || "multiple-choice";
    
    // Construct the system message based on quiz type
    let systemMessage = `You are an expert quiz creator. Generate ${questionCount} ${difficulty} difficulty ${quizType} questions based on the provided content. Also generate proper Quiz Name`;
    
    if (quizType === "multiple-choice") {
      systemMessage += " Each question should have 4 options with exactly one correct answer.";
    } else if (quizType === "true-false") {
      systemMessage += " Each question should be answerable with either 'true' or 'false'.";
    } else if (quizType === "fill-blank") {
      systemMessage += " Each question should have a blank that needs to be filled with a word or short phrase.";
    }
    
    systemMessage += " Provide helpful explanations for the correct answers when possible.";
    
    // Call OpenAI API to generate questions
    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: systemMessage + " Respond with a JSON array where each question has: text, options (array of strings), correctAnswer (string matching one of the options), and explanation (string)."
        },
        {
          role: "user",
          content: `Please generate a quiz based on the following content: ${text}`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const parsedResponse = JSON.parse(content);
    const generatedQuestions = parsedResponse.questions || [];

    // Format the questions to match our schema
    return generatedQuestions.map((q: any) => ({
      id: 0, // Will be set by storage
      quizId: 0, // Will be set later
      text: q.text,
      type: quizType,
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ""
    }));
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error(`Failed to generate quiz: ${error instanceof Error ? error.message : String(error)}`);
  }
}
export async function generateQuizFromURL(
  url: string, 
  options: QuizOption
): Promise<Question[]> {
  try{
    let content = '';

    if (isYouTubeURL(url)) {
      console.log('🔍 Detected YouTube URL. Fetching transcript...');
      content = await getTextFromYouTube(url);
    } else {
      console.log('🌐 Detected regular web URL. Scraping text...');
      content = await getTextFromWebpage(url);
    }
    if (!content) {
      throw new Error("No content found at the provided URL");
    }
    return await generateQuizFromText(content, options);
  } catch (error) {
    console.error("Error generating quiz from URL:", error);
    throw new Error(`Failed to generate quiz from URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function extractTextFromImageUsingOpenAI(imagePath: string): Promise<string> {
  try {
    const imageData = await imageToBase64(imagePath);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Extract and return all text content from this image. Return only the text, nothing else."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all text from this image."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`
              }
            }
          ]
        }
      ]
    });

    const extractedText = response.choices[0].message.content;
    if (!extractedText) {
      throw new Error("No text extracted from image");
    }

    return extractedText;
  } catch (error) {
    console.error("Error extracting text from image:", error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : String(error)}`);
  }
}
// Function to analyze an image and generate questions
export async function analyzeImageAndGenerateQuiz(
  base64ImagesData: any,
  options: QuizOption
): Promise<{ questions: Question[]; quizName: string }> {
  try {
    // Prepare the prompt for OpenAI
    const questionCount = options.questionCount || 10;
    const difficulty = options.difficulty || "medium";
    const quizType = options.quizType || "multiple-choice";
    // const imagesData: String[] = await Promise.all(
    //   base64ImagesData.map((image: any) => imageToBase64(image.content.path))
    // );
    let imagesData: string[] = [];
    for(const image of base64ImagesData) {
      if(image.contentType === "pdf") {
        const pdfImages = await Promise.all(image.content.map(async (img: any) => await imageToBase64(img.path)));
        imagesData.push(...pdfImages);
      }
      else{
        const imageData = await imageToBase64(image.content.path);
        if (!imageData) {
          throw new Error("No image data found");
        }
        imagesData.push(imageData);
      }
      // console.log(imageData);
    }
    // const imagesData: string[] = [await imageToBase64(base64ImagesData[0].content.path)];
    // const imagesData = await imageToBase64(base64Image.path)
    // Call OpenAI API to analyze the image and generate questions
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert quiz creator. First analyze the images in detail. Then generate ${questionCount} ${difficulty} difficulty ${quizType} questions based on the content of all images. Respond with a JSON object containing an "analysis" string and a "questions" array where each question has: text, options (array of strings), correctAnswer (string matching one of the options), and explanation (string). Also generate proper Quiz Name`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze these images and create a quiz based on their content."
            },
            ...imagesData.map((imageData) => ({
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`
              }
            }) as const)
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const parsedResponse = JSON.parse(content);
    const generatedQuestions = parsedResponse.questions || [];

    // Format the questions to match our schema
    return {
      questions : generatedQuestions.map((q: any) => ({
      id: 0, // Will be set by storage
      quizId: 0, // Will be set later
      text: q.text,
      type: quizType,
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ""
    })),
    quizName: parsedResponse.quizName || "Generated Quiz",
  };
  } catch (error) {
    console.error("Error analyzing image and generating quiz:", error);
    throw new Error(`Failed to analyze image and generate quiz: ${error instanceof Error ? error.message : String(error)}`);
  }
}
function getTextFromYouTube(url: string): string | PromiseLike<string> {
  throw new Error("Function not implemented.");
}

