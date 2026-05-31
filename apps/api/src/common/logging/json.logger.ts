import { ConsoleLogger, Injectable } from "@nestjs/common";

@Injectable()
export class JsonLogger extends ConsoleLogger {
  protected override formatMessage(logLevel: string, message: unknown, pidMessage: string, formattedLogLevel: string, contextMessage: string, timestampDiff: string): string {
    const payload = {
      level: logLevel,
      message: typeof message === "string" ? message : JSON.stringify(message),
      pid: pidMessage.trim(),
      context: contextMessage.trim(),
      levelTag: formattedLogLevel.trim(),
      timestampDiff: timestampDiff.trim(),
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(payload);
  }
}
