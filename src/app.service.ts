import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getInfo() {
    return {
      school: this.config.getOrThrow<string>('SCHOOL_NAME'),
      environment: this.config.getOrThrow<string>('NODE_ENV'),
      status: 'ok',
    };
  }
}
