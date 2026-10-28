import {
  WinstonModuleOptions,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import * as winston from 'winston';

// nest-winston's Logger#error() always attaches a `stack: [trace]` field,
// even when no real Error/stack was passed (e.g. `logger.error(message, '')`
// in LoggingMiddleware). Strip it when empty so logs don't show clutter
// like `- { stack: [ '' ] }`. Real stack traces (non-empty) are untouched.
const stripEmptyStack = winston.format((info) => {
  if (
    Array.isArray(info.stack) &&
    (info.stack.length === 0 || !info.stack[0])
  ) {
    delete info.stack;
  }
  return info;
});

export function createWinstonOptions(nodeEnv: string): WinstonModuleOptions {
  const isProduction = nodeEnv === 'production';

  return {
    level: isProduction ? 'info' : 'debug',
    transports: [
      new winston.transports.Console({
        format: isProduction
          ? winston.format.combine(
              stripEmptyStack(),
              winston.format.timestamp(),
              winston.format.json(),
            )
          : winston.format.combine(
              stripEmptyStack(),
              winston.format.timestamp(),
              nestWinstonModuleUtilities.format.nestLike('TaskFlowApi', {
                colors: true,
                prettyPrint: true,
              }),
            ),
      }),
    ],
  };
}
