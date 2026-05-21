import { prisma } from "../lib/db.js";
import { hashRefreshToken, signAccessToken, signRefreshToken } from "../lib/jwt.js";

export async function issueSession(userId: string, role: "customer" | "operator") {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}
