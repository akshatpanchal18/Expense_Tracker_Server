import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import { Counter } from "./counter.model.js";

const userSchema = new Schema(
  {
    id: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "users" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Format example: ex_00001
    const formatted = String(counter.seq).padStart(5, "0");
    this.id = `ex_${formatted}`;
  }
  next();
});
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1d", //1 Day
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "10d", // 10 days
    }
  );
};
export const User = model("User", userSchema);
