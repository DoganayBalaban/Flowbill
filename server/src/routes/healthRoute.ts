import { Request, Response, Router } from "express";
import { redis } from "../config/redis";
import { prisma } from "../utils/prisma";

const router = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     description: Returns the health status of the API, database, and Redis connections.
 *     responses:
 *       200:
 *         description: All systems operational
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: One or more services are unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get("/", async (_req: Request, res: Response) => {
  const start = Date.now();

  let dbStatus: "ok" | "error" = "error";
  let dbLatencyMs: number | null = null;

  let redisStatus: "ok" | "error" = "error";
  let redisLatencyMs: number | null = null;

  // Database check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "ok";
  } catch {
    dbStatus = "error";
  }

  // Redis check
  try {
    const redisStart = Date.now();
    await redis.ping();
    redisLatencyMs = Date.now() - redisStart;
    redisStatus = "ok";
  } catch {
    redisStatus = "error";
  }

  const allHealthy = dbStatus === "ok" && redisStatus === "ok";
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    responseTimeMs: Date.now() - start,
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      redis: {
        status: redisStatus,
        latencyMs: redisLatencyMs,
      },
    },
  });
});

export default router;
