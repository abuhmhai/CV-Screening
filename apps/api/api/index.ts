import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
import { createNestApp } from "../dist/create-app";

const expressApp = express();
const adapter = new ExpressAdapter(expressApp);
let ready = false;

async function bootstrap(): Promise<express.Express> {
  if (!ready) {
    await createNestApp(adapter);
    ready = true;
  }
  return expressApp;
}

export default async function handler(req: express.Request, res: express.Response): Promise<void> {
  const server = await bootstrap();
  server(req, res);
}
