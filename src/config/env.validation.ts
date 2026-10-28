import { plainToInstance } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  ValidateIf,
  validateSync,
} from 'class-validator';

// Formats accepted by the `ms` package used by @nestjs/jwt, e.g. "15m", "7d".
const MS_DURATION = /^\d+(ms|s|m|h|d|w|y)$/;

export class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsUrl({ require_tld: false })
  APP_URL!: string;

  @IsUrl({ require_tld: false })
  FRONTEND_URL!: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @Matches(/^postgres(ql)?:\/\//, {
    message: 'DATABASE_URL must be a PostgreSQL connection string',
  })
  DATABASE_URL!: string;

  @IsNotEmpty()
  JWT_SECRET!: string;

  @Matches(MS_DURATION)
  JWT_EXPIRES_IN!: string;

  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  // Parsed manually by AuthService, which supports only minutes, hours and days.
  @Matches(/^\d+[dhm]$/, {
    message: 'JWT_REFRESH_EXPIRES_IN must look like 30m, 12h or 7d',
  })
  JWT_REFRESH_EXPIRES_IN!: string;

  @IsNotEmpty()
  JWT_RESET_PASSWORD_SECRET!: string;

  @Matches(MS_DURATION)
  JWT_RESET_PASSWORD_EXPIRES_IN!: string;

  @IsNotEmpty()
  SENDGRID_API_KEY!: string;

  @IsEmail()
  SENDGRID_FROM_EMAIL!: string;

  @IsNotEmpty()
  SENDGRID_FROM_NAME!: string;

  @IsNotEmpty()
  SENDGRID_PASSWORD_RESET_TEMPLATE_ID!: string;

  @IsNotEmpty()
  REDIS_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT!: number;

  // Both or neither: with credentials Bull Board requires Basic auth.
  @ValidateIf((env: EnvironmentVariables) => !!env.BULL_BOARD_PASSWORD)
  @IsNotEmpty()
  BULL_BOARD_USERNAME?: string;

  @ValidateIf((env: EnvironmentVariables) => !!env.BULL_BOARD_USERNAME)
  @IsNotEmpty()
  BULL_BOARD_PASSWORD?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const details = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join('\n  - ');

    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }

  return validatedConfig;
}
