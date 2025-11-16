import mongoose from "mongoose";
import { seedCategories } from "../services/categorySeed.js";

const DB_NAME = "expense_tracker_db";

export const connectDB = async () => {
  try {
    const connectInstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`
    );
    console.log(`🌞 MongoDB connected !!`);
    console.log(`DB HOST ⭕:${connectInstance.connection.host}`);
    await seedCategories();
  } catch (error) {
    console.log("❌ MONGODB connection Failed", error);
    process.exit(1);
  }
};
