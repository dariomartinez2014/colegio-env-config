import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CoursesModule } from './courses/courses.module.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
import { GradesModule } from './grades/grades.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SubjectsModule } from './subjects/subjects.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    SubjectsModule,
    EnrollmentsModule,
    GradesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
