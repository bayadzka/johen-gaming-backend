import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Mengaktifkan validasi global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));

  // Mengaktifkan CORS
  app.enableCors();

  // Setup Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Johen Gaming API')
    .setDescription('Dokumentasi API untuk Prototype Digital Marketplace')
    .setVersion('1.0')
    .addBearerAuth() // Nanti kepakai banget buat endpoint yang butuh login
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  // Swagger akan bisa diakses di URL: http://localhost:3000/api
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();