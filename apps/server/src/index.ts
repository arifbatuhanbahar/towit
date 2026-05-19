import "dotenv/config";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  logger.info("Towit API listening", { url: `http://localhost:${port}` });
});
