import { User } from "../models/user.model.js";

export const generateAccessAndRefreshToken = async (id) => {
  //   console.log("ID ==>", id);

  try {
    const findUser = await User.findById(id);
    // console.log("FOUND USER ==>", findUser);
    const accessToken = await generateAccessToken(findUser);
    // console.log("ACCESS_TOKEN ==>", accessToken);
    const refreshToken = await generateRefreshToken(findUser);
    // console.log("REFRESH_TOKEN ==>", refreshToken);
    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(500, "something went Wrong while generating token");
  }
};
export const generateAccessToken = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    return accessToken;
  } catch (error) {
    throw new Error(500, "something went Wrong while generate access token");
  }
};
export const generateRefreshToken = async (user) => {
  try {
    const refreshToken = user.generateRefreshToken();
    return refreshToken;
  } catch (error) {
    throw new Error(500, "something went Wrong while generate refresh token");
  }
};
