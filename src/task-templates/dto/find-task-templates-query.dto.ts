import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { SortOrder } from '../../common/enums/sort-order.enum';

enum TaskTemplateSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  USAGE_COUNT = 'usageCount',
  LAST_USED_AT = 'lastUsedAt',
}

export class FindTaskTemplatesQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination (default: 1)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page for pagination (default: 10)',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'bug',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    enum: TaskTemplateSortBy,
    example: TaskTemplateSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(TaskTemplateSortBy)
  sortBy?: TaskTemplateSortBy = TaskTemplateSortBy.CREATED_AT;

  @ApiPropertyOptional({
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
