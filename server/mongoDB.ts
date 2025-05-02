// todo : use dotenv in single file
import dotenv from "dotenv";
dotenv.config();
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI || "mongodb://localhost:27017/quizgenius"; // Replace with your MongoDB URI 
const client = new MongoClient(uri);
let db: any;

// Function to connect to MongoDB
export async function connectToDatabase() {
  if (!db) {
    try {
      await client.connect();
      console.log("Connected to MongoDB");
      db = client.db(); // Use the default database from the URI
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw new Error("Failed to connect to MongoDB");
    }
  }
  return db;
}

// Function to get the database instance
export function getDatabase(databaseName?: string) {
  if (databaseName) {
    db = client.db(databaseName);  
}
  if (!db) {
    throw new Error("Database not connected. Call connectToDatabase first.");
  }
  return db;
}

// Function to close the MongoDB connection
export async function closeDatabaseConnection() {
  try {
    await client.close();
    db = null; // Reset the db variable
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
  }
}