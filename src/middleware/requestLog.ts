import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

export function requestLog(request: Request, response: Response, next: NextFunction): void {
  const startedAt = Date.now();

  response.on("finish", () => {
    logger.info("request", {
      method: request.method,
      path: request.originalUrl,
      status: response.statusCode,
      duration_ms: Date.now() - startedAt,
      ip: request.ip || request.socket.remoteAddress,
    });
  });

  next();
}
