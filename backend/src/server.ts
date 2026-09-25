import { createApp } from "./app";
import { env } from "./config/env";

/**
 * Start the Start-X backend server.
 */
function startServer(): void {
  const app = createApp();
  const port = env.PORT;

  app.listen(port, () => {
    console.log("═══════════════════════════════════════════════════════");
    console.log("  🚀 Start-X Backend");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`  Environment : ${env.NODE_ENV}`);
    console.log(`  Port        : ${port}`);
    console.log(`  Frontend    : ${env.FRONTEND_URL}`);
    console.log(`  Health      : http://localhost:${port}/api/health`);
    console.log(`  API v1      : http://localhost:${port}/api/v1/health`);
    console.log(`  DB Health   : http://localhost:${port}/api/v1/database/health`);
    console.log(`  System Info : http://localhost:${port}/api/v1/system/info`);
    console.log("═══════════════════════════════════════════════════════");

    if (!env.SUPABASE_URL) {
      console.warn("  ⚠  SUPABASE_URL is not set — database & auth features disabled");
    }

    console.log("");
  });
}

startServer();
