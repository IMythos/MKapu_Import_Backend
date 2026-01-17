/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {'^/': '/auth/',},
    }),
  );
  app.use(
    '/admin', 
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
      pathRewrite: {'^/': '/admin/',},
    }),
  );
  await app.listen(3000);
  console.log(`🌍 API Gateway corriendo en: http://localhost:3000`);
}
bootstrap();
