import pino from "pino";
import { config } from "../iflow/config.js";

export const logger = pino({
  level: config.IFLOW_LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "err.headers.authorization",
      "res.headers.authorization",
      "args.IFLOW_API_BEARER",
    ],
    remove: true,
  },
  transport: process.env.NODE_ENV === "development" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  } : undefined,
});
