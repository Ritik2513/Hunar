import { env } from "./config/env.js";
import app from "./app.js";

const server = app.listen(env.PORT, () => {
  console.log(`Hunar provider running on port ${env.PORT}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received. Shutting down provider...`);

  server.close((error) => {
    if (error) {
      console.error("Error while shutting down provider:", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
