import type { IncomingMessage, ServerResponse } from 'http';
import serverless from 'serverless-http';
import { createApp } from '../src/app.factory';

let cachedHandler:
  | ((req: IncomingMessage, res: ServerResponse) => Promise<unknown>)
  | null = null;

async function getHandler() {
  if (cachedHandler) {
    return cachedHandler;
  }

  const app = await createApp();
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  cachedHandler = serverless(expressApp) as (
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<unknown>;

  return cachedHandler;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const serverlessHandler = await getHandler();
  return serverlessHandler(req, res);
}
