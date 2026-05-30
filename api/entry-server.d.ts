declare module '../dist/server/entry-server.js' {
  import type { Request, Response } from 'express';
  export function render(req: Request, res: Response): Promise<void>;
}
