import express from "express";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "./config.js";
import { createRateLimit } from "./middleware/rateLimit.js";
import { requestLog } from "./middleware/requestLog.js";
import { securityHeaders } from "./middleware/security.js";
import { router } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(securityHeaders);
  app.use(requestLog);
  app.use(createRateLimit({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX }));
  app.use(router);

  return app;
}
