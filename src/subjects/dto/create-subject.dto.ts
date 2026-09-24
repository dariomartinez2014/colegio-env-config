import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  courseId: number;

  @IsOptional()
  @IsInt()
  teacherId?: number;
}
