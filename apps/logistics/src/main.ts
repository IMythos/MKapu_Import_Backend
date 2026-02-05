/* logistics/src/main.ts */
import { NestFactory } from '@nestjs/core';
import { LogisticsModule } from './logistics.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // Creamos la aplicación
  const app = await NestFactory.create(LogisticsModule);

  // Configuramos el microservicio TCP una sola vez
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 3005,
    },
  });

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // IMPORTANTE: Solo llamar a esto una vez. 
  // Esto activará el microservicio configurado arriba.
  await app.startAllMicroservices();
  
  // Iniciamos el servidor HTTP
  await app.listen(3003);
  
  console.log(`📦 Logistics HTTP: http://localhost:3003`);
  console.log(`⚡ Logistics TCP: 127.0.0.1:3005`);
}

bootstrap();