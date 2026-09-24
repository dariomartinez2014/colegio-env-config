import { IsInt, Max, Min } from 'class-validator';

export class CreateGradeDto {
  @IsInt()
  studentId: number;

  @IsInt()
  subjectId: number;

  @IsInt()
  @Min(1)
  @Max(3)
  period: number;

  @IsInt()
  @Min(0)
  @Max(100)
  score: number;
}
