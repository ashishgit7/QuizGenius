import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { quizGenerationSchema, insertQuizSchema, insertQuestionSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { generateQuizFromText, analyzeImageAndGenerateQuiz, generateQuizFromURL } from "./lib/openai";
import { extractTextFromPDF, extractTextFromURL, imageToBase64 } from "./lib/fileProcessing";
import { getDatabase, connectToDatabase, closeDatabaseConnection } from "./mongoDB";

const QuizDB = process.env.QUIZ_DB || "QuizDB";
const postsCollectionName = process.env.POSTS_COLLECTION || "Post";
// Get current file path and directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Custom type for multer callbacks to fix type issues
type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req: Express.Request, file: Express.Multer.File, cb: DestinationCallback) {
      cb(null, uploadDir);
    },
    filename: function (req: Express.Request, file: Express.Multer.File, cb: FileNameCallback) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req: Express.Request, file: Express.Multer.File, cb: any) {
    // Accept only image and PDF files
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image (jpeg, jpg, png) and PDF files are allowed!"));
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Define API routes
  
  // Health check endpoint
  app.get("/api/health/", async (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  async function uploadPdfAndImageFile(filePath:string, fileType:string,file: any): Promise<{ contentType: string; content: any }> {
    let contentType = "";
    let content;
    
    // Process based on file type
    if (fileType.includes("image")) {
      contentType = "image";
      content = file;
    } else if (fileType.includes("pdf")) {
      contentType = "pdf";
      content = await extractTextFromPDF(filePath);
    } else {
      throw new Error("Unsupported file type");
    }
    return {
      contentType,
      content,
    }
  }

  // Upload file endpoint
  app.post("/api/upload/", upload.array("files", 5), async (req: Request, res: Response) => {
    try {
      if (!req.files) {
        return res.status(400).json({ error: "No file uploaded" });
      }
       
      let data: {contentType:string,content:any}[] = [];
      
      data = await Promise.all((req.files as Express.Multer.File[]).map(async (file: Express.Multer.File) => {
        const filePath = file.path;
        const fileType = file.mimetype; 
        const { contentType, content } = await uploadPdfAndImageFile(filePath, fileType, file);
        return {contentType, content}
      }));

      // Remove the temporary file
      // fs.unlinkSync(filePath);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Process URL endpoint
  app.post("/api/process-url/", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      const content = await extractTextFromURL(url);
      
      res.json({
        success: true,
        contentType: "text",
        content,
      });
    } catch (error) {
      console.error("URL processing error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Generate quiz endpoint
  app.post("/api/generate-quiz", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = quizGenerationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: validationResult.error.errors,
        });
      }
      
      const { options, content } = validationResult.data;
      
      // Generate questions based on content type
     
      let questions;
      let quizName = "generated-quiz";
      if (content.contentType === "files") {
        ({questions, quizName} = await analyzeImageAndGenerateQuiz(content.data, options));
      } else if(content.contentType === "text") {
        // For text, PDF, and URL content
        questions = await generateQuizFromText(content.content, options);
      }
      
      else{
        return res.status(400).json({ error: "Unsupported content type" });
      }
      
      // Create quiz in storage
      const quiz = await storage.createQuiz({
        title: "Generated Quiz",
        contentType: content.contentType,
        difficulty: options.difficulty,
        questionCount: options.questionCount,
        quizType: options.quizType,
      });
      
      // Store questions with the quiz ID
      const savedQuestions = [];
      if (Array.isArray(questions)) {
        for (const question of questions) {
          const savedQuestion = await storage.createQuestion({
            ...question,
            quizId: quiz.id,
          });
          savedQuestions.push(savedQuestion);
        }
      } else {
        throw new Error("Questions are undefined or not an array");
      }
      
      res.json({
        success: true,
        quiz,
        questions: savedQuestions,
        quizName
      });
    } catch (error) {
      console.error("Quiz generation error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get quiz endpoint
  app.get("/api/quiz/:id/", async (req: Request, res: Response) => {
    try {
      const quizId = parseInt(req.params.id);
      
      if (isNaN(quizId)) {
        return res.status(400).json({ error: "Invalid quiz ID" });
      }
      
      const quiz = await storage.getQuiz(quizId);
      
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      
      const questions = await storage.getQuestionsForQuiz(quizId);
      
      res.json({
        quiz,
        questions,
      });
    } catch (error) {
      console.error("Get quiz error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get all quizzes endpoint
  app.get("/api/quizzes/", async (req: Request, res: Response) => {
    try {
      const quizzes = await storage.listQuizzes();
      res.json({ quizzes });
    } catch (error) {
      console.error("List quizzes error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // MongoDB connection check endpoint
  app.get("/api/db-check/", async (req: Request, res: Response) => {
    try {
      await connectToDatabase();
      const db = getDatabase();
      const isConnected = await db.command({ ping: 1 })
      if (isConnected) {
        closeDatabaseConnection();
        res.json({ success: true, message: "MongoDB is connected" });
        
      } else {
        res.status(500).json({ success: false, message: "MongoDB is not connected" });
      }
    } catch (error) {
      console.error("Database connection check error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  // Create a new post endpoint
  app.post("/api/posts/", async (req: Request, res: Response) => {
    try {
      const { post } = req.body;
      console.log("Received post data:", post);
      if (!post) {
        return res.status(400).json({ error: "Post data is required" });
      }

      await connectToDatabase();
      const db = getDatabase(QuizDB);
      const postsCollection = db.collection(postsCollectionName);

      const newPost = {
        ...post,
        createdAt: new Date(),
      };

      const result = await postsCollection.insertOne(newPost);
      closeDatabaseConnection();

      res.json({
        success: true,
        postId: result.insertedId,
        message: "Post created successfully",
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  // Get all posts endpoint
  app.get("/api/posts/", async (req: Request, res: Response) => {
    try {
      await connectToDatabase();
      const db = getDatabase(QuizDB);
      const postsCollection = db.collection(postsCollectionName);

      const posts = await postsCollection.find().toArray();
      closeDatabaseConnection();

      res.json({
        success: true,
        posts,
      });
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
