import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Flowbill API",
      version: "1.0.0",
      description: "Freelancer time tracking and invoicing API",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
      schemas: {
        HealthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["ok", "degraded"],
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
            uptime: {
              type: "number",
              description: "Server uptime in seconds",
            },
            responseTimeMs: {
              type: "number",
            },
            services: {
              type: "object",
              properties: {
                database: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["ok", "error"] },
                    latencyMs: { type: "number", nullable: true },
                  },
                },
                redis: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["ok", "error"] },
                    latencyMs: { type: "number", nullable: true },
                  },
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            status: { type: "number" },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
