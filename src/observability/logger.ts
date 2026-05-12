import pino from "pino";

const level =
  (process.env.IFLOW_LOG_LEVEL as
    | "fatal"
    | "error"
    | "warn"
    | "info"
    | "debug"
    | "trace"
    | undefined) ?? "info";

export const logger = pino({
  level,
  redact: {
    paths: [
      "req.headers.authorization",
      "err.headers.authorization",
      "res.headers.authorization",
      "args.IFLOW_API_BEARER",
      "errorData.details.confirm_token",
      "errorData.details.pending_id",
    ],
    remove: true,
  },
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
});
