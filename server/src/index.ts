import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import swaggerUi from "swagger-ui-express";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";
import { initSocket } from "./config/socket";
import { swaggerSpec } from "./config/swagger";
import { globalErrorHandler } from "./middlewares/errorMiddleware";
import morganMiddleware from "./middlewares/morganMiddleware";
import { rateLimiters } from "./middlewares/redisRateLimit";
import authRoute from "./routes/authRoute";
import clientRoute from "./routes/clientRoute";
import dashboardRoute from "./routes/dashboardRoute";
import healthRoute from "./routes/healthRoute";
import invoiceRoute from "./routes/invoiceRoute";
import projectRoute from "./routes/projectRoute";
import timerRoute from "./routes/timerRoute";
import logger from "./utils/logger";
// Register BullMQ workers — must be imported so workers start listening
import "./workers/emailWorker";
import "./workers/pdfWorker";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Global rate limiting (Redis tabanlı - distributed sistemlerde çalışır)
app.use(rateLimiters.api);

import expenseRoute from "./routes/expenseRoute";
import taskRoute from "./routes/taskRoute";

app.use(morganMiddleware);
app.use("/api/health", healthRoute);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoute);
app.use("/api/clients", clientRoute);
app.use("/api/projects", projectRoute);
app.use("/api/timers", timerRoute);
app.use("/api/invoices", invoiceRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/tasks", taskRoute);
app.use("/api/expenses", expenseRoute);
app.use(globalErrorHandler);
async function startServer() {
  await connectDatabase();
  await connectRedis();

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Server is running on port ${env.PORT}`);
  });
}

startServer();
