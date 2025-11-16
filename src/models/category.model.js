import { model, Schema } from "mongoose";
import { Counter } from "./counter.model.js";

const categorySchema = new Schema(
  {
    id: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

categorySchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "categories" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Format example: ex_00001
    const formatted = String(counter.seq).padStart(5, "0");
    this.id = `cat_${formatted}`;
  }
  next();
});
export const Category = model("Category", categorySchema);
