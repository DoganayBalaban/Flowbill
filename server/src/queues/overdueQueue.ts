import { Queue } from "bullmq";
import { bullMqConnection } from "./pdfQueue";

export const overdueQueue = new Queue("overdueQueue", {
  connection: bullMqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 60_000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});
