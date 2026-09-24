import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { UpdateSubjectDto } from './dto/update-subject.dto.js';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubjectDto) {
    if (dto.teacherId) await this.ensureTeacher(dto.teacherId);
    return this.prisma.subject.create({ data: dto });
  }

  findAll(courseId?: number) {
    return this.prisma.subject.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        course: true,
        teacher: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        course: true,
        teacher: { select: { id: true, name: true } },
      },
    });
    if (!subject) throw new NotFoundException(`Materia ${id} no encontrada`);
    return subject;
  }

  async update(id: number, dto: UpdateSubjectDto) {
    await this.findOne(id);
    if (dto.teacherId) await this.ensureTeacher(dto.teacherId);
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.subject.delete({ where: { id } });
  }

  private async ensureTeacher(teacherId: number) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
    });
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new BadRequestException(
        `El usuario ${teacherId} no existe o no es profesor`,
      );
    }
  }
}
