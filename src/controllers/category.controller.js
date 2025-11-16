import { Category } from "../models/category.model.js";
import ApiError from "../utils/error.js";
import Response from "../utils/response.js";

export const getCategory = async (req, res) => {
  console.log("category called");
  try {
    const category = await Category.find();
    // console.log(category);
    if (!category) {
      res.status(400).json(new ApiError(400, "Something went wrong"));
      return;
    }
    res
      .status(200)
      .json(new Response(200, { category }, "categories fetched successfully"));
  } catch (error) {
    console.error("get category error", error);
  }
};
