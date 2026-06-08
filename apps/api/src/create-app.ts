import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { BigIntSerializerInterceptor } from "./common/interceptors/bigint-serializer.interceptor";
import { JsonLogger } from "./common/logging/json.logger";

export async function createNestApp(expressAdapter?: ExpressAdapter): Promise<INestApplication> {
  const app = expressAdapter
    ? await NestFactory.create(AppModule, expressAdapter, { logger: new JsonLogger("Nest") })
    : await NestFactory.create(AppModule, { logger: new JsonLogger("Nest") });

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

  if (expressAdapter) {
    await app.init();
  }

  return app;
}
