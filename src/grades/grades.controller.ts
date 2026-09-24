import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { Role } from '../generated/prisma/enums.js';
import { CreateGradeDto } from './dto/create-grade.dto.js';
import { GradesService } from './grades.service.js';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  upsert(@Body() dto: CreateGradeDto, @CurrentUser() user: JwtPayload) {
    return this.gradesService.upsert(dto, user);
  }

  @Get('student/:studentId')
  findByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.gradesService.findByStudent(studentId, user);
  }
}
