var jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyRefreshToken = (
  token: string,
): { userId: string } | null => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return payload;
  } catch (error) {
    // jwt.verify throws if expired or tampered
    return null;
  }
};
