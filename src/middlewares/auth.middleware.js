import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import ApiError from "../utils/error.js";

export const verifyJwt = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  // console.log(authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  // const token = req.header("Authorization")?.replace("Bearer ", "");
  const token = authHeader.split(" ")[1];
  // console.log(token);

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded?._id);
    if (!user) {
      return res
        .status(404)
        .json(new ApiError(404, "Invalid token user not found"));
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json(new ApiError(401, "Invalid access token"));
  }
};
