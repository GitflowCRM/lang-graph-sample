import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('LangChain Chatbot API')
    .setDescription('API documentation for the LangChain Chatbot')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Server is running at http://localhost:${process.env.PORT ?? 3000}`,
  );
  // swagger
  console.log(
    `Swagger is running at http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
