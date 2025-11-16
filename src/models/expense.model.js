import { model, Schema } from "mongoose";
import { Counter } from "./counter.model.js ";

const expenseSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
    },

    // Store actual date of expense
    date: {
      type: Date,
      default: Date.now, // Auto-fill current date
    },

    // If category model exists, keep ObjectId
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  { timestamps: true }
);
expenseSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "expenses" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Format example: ex_00001
    const formatted = String(counter.seq).padStart(5, "0");
    this.id = `ex_${formatted}`;
  }
  next();
});
export const Expense = model("Expense", expenseSchema);
