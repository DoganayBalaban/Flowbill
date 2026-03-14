/**
 * Redis-based rate limiters for authentication endpoints
 * Uses ioredis for distributed rate limiting (works across multiple server instances)
 */
import { redisRateLimit } from "./redisRateLimit";

// Login rate limiter - strict for security
export const loginLimiter = redisRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyPrefix: "ratelimit:login",
  message: "Too many login attempts, please try again after 15 minutes.",
});

// Register rate limiter - very strict to prevent spam
export const registerLimiter = redisRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  keyPrefix: "ratelimit:register",
  message: "Too many registration attempts, please try again after 1 hour.",
});

// Refresh token rate limiter - moderate
export const refreshLimiter = redisRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
  keyPrefix: "ratelimit:refresh",
  message: "Too many refresh attempts, please try again later.",
});

// Password reset rate limiter - strict for security
export const passwordResetLimiter = redisRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  keyPrefix: "ratelimit:password-reset",
  message: "Too many password reset attempts, please try again after 1 hour.",
});

// Email verification resend limiter
export const verificationLimiter = redisRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 3,
  keyPrefix: "ratelimit:verification",
  message: "Too many verification email requests, please try again later.",
});

// Portal magic link send limiter
export const magicLinkLimiter = redisRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  keyPrefix: "ratelimit:magic-link",
  message: "Too many magic link requests, please try again after 1 hour.",
});

// Invoice send limiter (email + payment link)
export const invoiceSendLimiter = redisRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  keyPrefix: "ratelimit:invoice-send",
  message: "Too many invoice send requests, please try again later.",
});
