import { createApp } from "./app.js";
import { PORT } from "./config.js";
import { logger } from "./lib/logger.js";

const app = createApp();
const server = app.listen(PORT, () => {
  logger.info("server started", { port: PORT, url: `http://localhost:${PORT}` });
});

function shutdown(signal: string): void {
  logger.info("shutting down", { signal });

  server.close((error) => {
    if (error) {
      logger.error("shutdown failed", { error: error.message });
      process.exit(1);
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error("forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
