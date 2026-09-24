import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEnrollmentDto) {
    const student = await this.prisma.user.findUnique({
      where: { id: dto.studentId },
    });
    if (!student || student.role !== Role.STUDENT) {
      throw new BadRequestException(
        `El usuario ${dto.studentId} no existe o no es estudiante`,
      );
    }

    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!course) {
      throw new NotFoundException(`Curso ${dto.courseId} no encontrado`);
    }

    const maxStudents = parseInt(
      process.env.MAX_STUDENTS_PER_COURSE ?? '30',
      10,
    );
    if (course._count.enrollments >= maxStudents) {
      throw new BadRequestException(
        `El curso ${course.name} ya tiene el cupo máximo de ${maxStudents} estudiantes`,
      );
    }

    const exists = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: dto.studentId,
          courseId: dto.courseId,
        },
      },
    });
    if (exists) {
      throw new ConflictException('El estudiante ya está inscrito en el curso');
    }

    return this.prisma.enrollment.create({
      data: dto,
      include: {
        course: true,
        student: { select: { id: true, name: true } },
      },
    });
  }

  findAll(user: JwtPayload) {
    return this.prisma.enrollment.findMany({
      where: user.role === Role.STUDENT ? { studentId: user.sub } : undefined,
      include: {
        course: true,
        student: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });
    if (!enrollment) {
      throw new NotFoundException(`Inscripción ${id} no encontrada`);
    }
    return this.prisma.enrollment.delete({ where: { id } });
  }
}
