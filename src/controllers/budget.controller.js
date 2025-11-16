import { Budget } from "../models/budget.model.js";
import ApiError from "../utils/error.js";
import Response from "../utils/response.js";

export const createBudget = async (req, res) => {
  try {
    const user = req.user;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json(new ApiError(400, "Amount is required"));
    }

    const now = new Date();

    const month = now.getMonth(); // 0-11 → 1-12
    const year = now.getFullYear();

    const budget = new Budget({
      amount,
      user: user._id,
      month,
      year,
    });
    await budget.save();

    return res
      .status(201)
      .json(new Response(201, { budget }, "budget is created"));
  } catch (error) {
    console.error("Error creating budget:", error);
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
};
export const getBudget = async (req, res) => {
  try {
    console.log("get budget called");

    const user = req.user;

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const budget = await Budget.findOne({
      user: user._id,
      month,
      year,
    });

    if (!budget) {
      return res
        .status(200)
        .json(new Response(200, { addNewBudget: true }, "Budget not found"));
    }

    return res
      .status(200)
      .json(new Response(200, { budget }, "Budget fetched successfully"));
  } catch (error) {
    console.log("Error fetching budget:", error);
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
};
