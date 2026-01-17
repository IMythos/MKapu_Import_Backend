import { Injectable } from '@nestjs/common';

@Injectable()
export class AdministrationService {
  getHello(): string {
    return 'Hello World!';
  }
}
