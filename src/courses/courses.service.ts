import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCourseDto) {
    return this.prisma.course.create({ data: dto });
  }

  findAll() {
    return this.prisma.course.findMany({
      include: { _count: { select: { enrollments: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        subjects: {
          include: { teacher: { select: { id: true, name: true } } },
        },
        enrollments: {
          include: { student: { select: { id: true, name: true } } },
        },
      },
    });
    if (!course) throw new NotFoundException(`Curso ${id} no encontrado`);
    return course;
  }

  async update(id: number, dto: UpdateCourseDto) {
    await this.findOne(id);
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.course.delete({ where: { id } });
  }
}
