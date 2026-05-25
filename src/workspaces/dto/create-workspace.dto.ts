import { MinLength, MaxLength, IsString, IsOptional } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
