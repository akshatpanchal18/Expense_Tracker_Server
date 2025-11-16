export const getProfile = async (req, res) => {
  try {
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Remove password safely
    const { password, ...safeUser } = user.toObject ? user.toObject() : user;
    return res
      .status(200)
      .json(new Response(200, safeUser, "Profile fetched successfully"));
  } catch (error) {
    console.log("ERROR❗", error);
    throw new Error(500, "something went wrong while getProfile");
  }
};
