import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      school: process.env.SCHOOL_NAME,
      environment: process.env.NODE_ENV,
      status: 'ok',
    };
  }
}
