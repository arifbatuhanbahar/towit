/**
 * Hafif, bağımlılıksız bir loglayıcı. Üretimde JSON, geliştirmede insan-okur
 * renkli çıktı üretir. `NFR-09` gereği: kullanıcıya genel mesaj döndürülürken
 * burada teknik ayrıntı korunur.
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: number = LEVEL_ORDER[(process.env.LOG_LEVEL as Level) ?? "info"] ?? LEVEL_ORDER.info;
const IS_PROD = process.env.NODE_ENV === "production";

const COLORS: Record<Level, string> = {
  debug: "\x1b[2m",   // dim
  info: "\x1b[36m",   // cyan
  warn: "\x1b[33m",   // yellow
  error: "\x1b[31m",  // red
};
const RESET = "\x1b[0m";

function write(level: Level, message: string, meta?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < MIN_LEVEL) return;

  if (IS_PROD) {
    const line = JSON.stringify({ ts: new Date().toISOString(), level, message, ...meta });
    const stream = level === "error" ? process.stderr : process.stdout;
    stream.write(line + "\n");
    return;
  }

  const prefix = `${COLORS[level]}[${level.toUpperCase()}]${RESET}`;
  const metaStr = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  const stream = level === "error" ? process.stderr : process.stdout;
  stream.write(`${prefix} ${message}${metaStr}\n`);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};
