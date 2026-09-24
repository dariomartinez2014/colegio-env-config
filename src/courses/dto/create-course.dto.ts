import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  level: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
