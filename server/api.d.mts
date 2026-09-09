import type { IncomingMessage, ServerResponse } from "node:http";
export function createApi(
  env?: NodeJS.ProcessEnv,
): (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => Promise<unknown>;
