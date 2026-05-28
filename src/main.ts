import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Pastikan CORS terbuka dengan benar
  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  
  await app.listen(port, '0.0.0.0'); 
  
  console.log(`Application is running on port ${port}`);
}
bootstrap();