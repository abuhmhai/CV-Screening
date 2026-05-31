import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { BigIntSerializerInterceptor } from "./common/interceptors/bigint-serializer.interceptor";
import { JsonLogger } from "./common/logging/json.logger";
import { PrismaService } from "./prisma/prisma.service";

async function bootstrap() {
  const logger = new JsonLogger("Bootstrap");
  const app = await NestFactory.create(AppModule, {
    logger
  });
  app.setGlobalPrefix("api/v1");
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());

  const prisma = app.get(PrismaService);
  prisma.enableShutdownHooks(app);
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

bootstrap();
