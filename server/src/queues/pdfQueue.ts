import { Queue } from "bullmq";
import { env } from "../config/env";

/**
 * Dedicated IORedis connection for BullMQ.
 * BullMQ requires maxRetriesPerRequest: null and enableReadyCheck: false.
 */
const bullMqConnection = {
  host: env.REDIS_HOST,
  port: Number(env.REDIS_PORT),
  password: env.REDIS_PASSWORD,
  ...(env.REDIS_TLS && { tls: {} }),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const pdfQueue = new Queue("pdfQueue", {
  connection: bullMqConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

export { bullMqConnection };
