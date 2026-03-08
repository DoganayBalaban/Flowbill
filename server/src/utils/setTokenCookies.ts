import { Response } from "express";
import { env } from "../config/env";

export const setTokenCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  sessionId: string,
) => {
  const isProduction = env.NODE_ENV === "production";

  // Access token cookie (15 minutes)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token cookie (7 days)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie("sid", sessionId, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 86400000,
  });
};
