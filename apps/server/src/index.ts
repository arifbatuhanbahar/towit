import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load the server-local env file, independent from shell cwd.
loadEnv({ path: path.resolve(__dirname, "../.env"), override: false });

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  logger.info("Towit API listening", { url: `http://localhost:${port}` });
});
