import { User } from "../models/user.model.js";
import {
  generateAccessAndRefreshToken,
  generateAccessToken,
} from "../services/token.js";
import ApiError from "../utils/error.js";
import Response from "../utils/response.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json(new ApiError(400, "Email and password are required"));
    }

    const findUser = await User.findOne({ email });
    if (!findUser) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    if (findUser.password !== password) {
      return res.status(401).json(new ApiError(401, "Invalid password"));
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      findUser._id
    );
    findUser.refreshToken = refreshToken;
    await findUser.save();
    // console.log("stored user", findUser);

    return res
      .status(200)
      .json(new Response(200, { accessToken }, "Login successful"));
  } catch (error) {
    console.log("ERROR❗", error);
    throw new ApiError(500, "something went wrong while login");
  }
};

export const register = async (req, res) => {
  console.log("Register called");

  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json(new ApiError(400, "Name, email and password are required"));
    }
    const isUserExist = await User.findOne({ email });
    if (isUserExist) {
      return res
        .status(400)
        .json(new ApiError(400, "user already exists with this email"));
    }
    const newUser = new User({
      name,
      email,
      password,
    });
    await newUser.save();
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      newUser._id
    );
    newUser.refreshToken = refreshToken;
    await newUser.save();
    return res
      .status(201)
      .json(new Response(201, { accessToken }, "User registered successfully"));
  } catch (error) {
    console.log("ERROR❗", error);
    throw new ApiError(500, "something went wrong while register");
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    user.refreshToken = null;
    await user.save();
    console.log("☠️From logout", user);

    res.status(200).json(new Response(200, null, "logged out successfully"));
  } catch (error) {
    console.log("ERROR❗", error);
    throw new ApiError(500, "something went wrong while logout");
  }
};
export const validateSession = async (req, res) => {
  console.log("⚡ validate session called");

  // ----------------------------------------
  // 1. GET TOKEN
  // ----------------------------------------
  const authHeader = req.headers.authorization;
  // console.log("STEP-1 AUTH HEADER:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(new ApiError(401, "Access token missing"));
  }

  const accessToken = authHeader.split(" ")[1];
  // console.log("STEP-2 ACCESS TOKEN:", accessToken);

  // ----------------------------------------
  // 2. VALIDATE ACCESS TOKEN
  // ----------------------------------------
  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    // console.log("STEP-3 ACCESS TOKEN VALID");

    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json(new ApiError(401, "User not found"));
    }

    // Access valid → return success
    return res.status(200).json(new Response(200, {}, "Session valid"));
  } catch (err) {
    console.log("❗ Access token expired or invalid");
  }

  // ----------------------------------------
  // 3. ACCESS TOKEN FAILED → TRY REFRESH TOKEN
  // ----------------------------------------
  try {
    // console.log("STEP-4: TRYING REFRESH TOKEN");

    // Decode WITHOUT verifying (token may be expired)
    const decodedExpired = jwt.decode(accessToken);

    if (!decodedExpired || !decodedExpired._id) {
      // console.log("ERROR: 401 Invalid token payload");
      return res.status(401).json(new ApiError(401, "Invalid token payload"));
    }

    const user = await User.findById(decodedExpired._id);
    if (!user || !user.refreshToken) {
      // console.log("ERROR: 401 No refresh token stored");
      return res.status(401).json(new ApiError(401, "No refresh token stored"));
    }

    // ----------------------------------------
    // 4. VALIDATE REFRESH TOKEN
    // ----------------------------------------
    // console.log("STEP-5 VALIDATING REFRESH TOKEN");

    const isRefreshValid = jwt.verify(
      user.refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!isRefreshValid) {
      return res.status(401).json(new ApiError(401, "Refresh token expired"));
    }

    // ----------------------------------------
    // 5. GENERATE NEW ACCESS TOKEN
    // ----------------------------------------
    // console.log("STEP-6 GENERATING NEW ACCESS TOKEN");

    const newAccessToken = jwt.sign(
      { _id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    return res
      .status(200)
      .json(
        new Response(
          200,
          { accessToken: newAccessToken },
          "New access token issued"
        )
      );
  } catch (err) {
    console.log("❌ REFRESH TOKEN FAILED:", err);
    return res
      .status(401)
      .json(new ApiError(401, "Session expired. Login again."));
  }
};
