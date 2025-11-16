import mongoose, { model, Schema } from "mongoose";
import { Counter } from "./counter.model.js";

const budgetSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 1 = Jan, 2 = Feb ... 12 = Dec
    month: {
      type: Number,
      required: true,
      min: 0,
      max: 11,
    },

    // Example: 2025
    year: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },

  { timestamps: true }
);
budgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });
budgetSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "budgets" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Format example: ex_00001
    const formatted = String(counter.seq).padStart(5, "0");
    this.id = `ex_${formatted}`;
  }
  next();
});
export const Budget = model("Budget", budgetSchema);
