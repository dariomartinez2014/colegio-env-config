import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: CreateGradeDto, user: JwtPayload) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject) {
      throw new NotFoundException(`Materia ${dto.subjectId} no encontrada`);
    }
    if (user.role === Role.TEACHER && subject.teacherId !== user.sub) {
      throw new ForbiddenException(
        'Solo puedes calificar tus propias materias',
      );
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: dto.studentId,
          courseId: subject.courseId,
        },
      },
    });
    if (!enrollment) {
      throw new BadRequestException(
        'El estudiante no está inscrito en el curso de esta materia',
      );
    }

    const grade = await this.prisma.grade.upsert({
      where: {
        studentId_subjectId_period: {
          studentId: dto.studentId,
          subjectId: dto.subjectId,
          period: dto.period,
        },
      },
      update: { score: dto.score },
      create: dto,
    });
    return this.withStatus(grade);
  }

  async findByStudent(studentId: number, user: JwtPayload) {
    if (user.role === Role.STUDENT && user.sub !== studentId) {
      throw new ForbiddenException('Solo puedes ver tus propias notas');
    }

    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      include: { subject: { select: { id: true, name: true } } },
      orderBy: [{ subjectId: 'asc' }, { period: 'asc' }],
    });
    return grades.map((grade) => this.withStatus(grade));
  }

  private withStatus<T extends { score: number }>(grade: T) {
    const minPassingGrade = parseInt(process.env.MIN_PASSING_GRADE ?? '51', 10);
    return { ...grade, approved: grade.score >= minPassingGrade };
  }
}
