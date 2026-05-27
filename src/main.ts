import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TAMBAHKAN KODE INI UNTUK MEMBUKA PINTU CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', // Izinkan akses dari laptop kamu
      'https://johen-gaming-frontend.vercel.app', // Izinkan akses dari Vercel
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Pastikan port-nya diset ke env.PORT agar Railway tidak bingung
  await app.listen(process.env.PORT || 8080);
}
bootstrap();