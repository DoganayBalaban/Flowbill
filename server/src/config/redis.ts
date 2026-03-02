import Redis from "ioredis";
import logger from "../utils/logger";
import { env } from "./env";

// Main Redis client for general operations
const redis = new Redis({
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

// Subscriber client for Pub/Sub (needs separate connection)
const subscriber = new Redis({
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Publisher client for Pub/Sub
const publisher = new Redis({
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Connection event handlers
redis.on("connect", () => {
  logger.info("Redis main client connected");
});

redis.on("error", (err) => {
  logger.error("Redis main client error:", err);
});

redis.on("close", () => {
  logger.warn("Redis main client connection closed");
});

subscriber.on("connect", () => {
  logger.info("Redis subscriber connected");
});

subscriber.on("error", (err) => {
  logger.error("Redis subscriber error:", err);
});

publisher.on("connect", () => {
  logger.info("Redis publisher connected");
});

publisher.on("error", (err) => {
  logger.error("Redis publisher error:", err);
});

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
    await subscriber.connect();
    await publisher.connect();
    logger.info("All Redis connections established");
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    throw error;
  }
};

// Disconnect from Redis
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.quit();
    await subscriber.quit();
    await publisher.quit();
    logger.info("All Redis connections closed");
  } catch (error) {
    logger.error("Failed to disconnect from Redis:", error);
    throw error;
  }
};

export { publisher, redis, subscriber };
