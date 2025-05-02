import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { any, z } from "zod";

// Define JSON types for type safety
export type Json = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

// User schema from the original file
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Quiz schema
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  contentType: text("content_type").notNull(), // "image", "pdf", "text", "url"
  difficulty: text("difficulty").notNull().default("medium"), // "easy", "medium", "hard"
  questionCount: integer("question_count").notNull().default(10),
  quizType: text("quiz_type").notNull().default("multiple-choice"), // "multiple-choice", "true-false", "fill-blank"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Question schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  text: text("text").notNull(),
  options: jsonb("options").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

// QuizOption schema for request validation
export const quizOptionSchema = z.object({
  questionCount: z.number().min(1).max(20).default(10),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  quizType: z.enum(["multiple-choice", "true-false", "fill-blank"]).default("multiple-choice"),
});

export type QuizOption = z.infer<typeof quizOptionSchema>;

// Content schema for request validation
export const contentSchema = z.object({
  contentType: z.enum(["image", "pdf", "text", "url"]).default("text"),
  content: z.string(),
});

export type Content = z.infer<typeof contentSchema>;

// Combined schema for quiz generation request
export const quizGenerationSchema = z.object({
  options: quizOptionSchema,
  content: any()
});

export type QuizGenerationRequest = z.infer<typeof quizGenerationSchema>;
