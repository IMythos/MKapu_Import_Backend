import { NestFactory } from '@nestjs/core';
import { AdministrationModule } from './administration.module';

async function bootstrap() {
  const app = await NestFactory.create(AdministrationModule);
  await app.listen(process.env.port ?? 3002);
}
bootstrap();
