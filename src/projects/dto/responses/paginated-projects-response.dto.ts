import { ProjectResponseDto } from './project-response.dto';
import { PaginationMetaResponseDto } from '../../../common/dto/responses/pagination-meta-response.dto';

export class PaginatedProjectsResponseDto {
  data!: ProjectResponseDto[];
  meta!: PaginationMetaResponseDto;
}
