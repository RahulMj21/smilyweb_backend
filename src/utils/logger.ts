import pino from "pino";
import dayjs from "dayjs";
import ENV from "../../config";

const level = ENV.logLevel;

const logger = pino({
  transport: {
    target: "pino-pretty",
  },
  level,
  base: {
    pid: false,
  },
  timestamp: () => `,"time":"${dayjs().format()}"`,
});

export default logger;
