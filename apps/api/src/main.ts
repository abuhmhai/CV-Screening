import { createNestApp } from "./create-app";
import { PrismaService } from "./prisma/prisma.service";

async function bootstrap() {
  const app = await createNestApp();

  const prisma = app.get(PrismaService);
  prisma.enableShutdownHooks(app);
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

bootstrap();
