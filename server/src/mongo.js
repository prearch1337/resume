import mongoose from "mongoose";

const connectionUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ResumeBuilder";

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(connectionUri, {
    dbName: process.env.MONGODB_DB || undefined,
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000
  });

  return mongoose.connection;
}
