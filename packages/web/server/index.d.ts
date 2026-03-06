import type { Express } from "express";
import type { Server } from "http";

export interface WebUiServerController {
  expressApp: Express;
  httpServer: Server;
  getPort: () => number | null;
  getKronosCodePort: () => number | null;
  isReady: () => boolean;
  restartKronosCode: () => Promise<void>;
  stop: (options?: { exitProcess?: boolean }) => Promise<void>;
}

export interface StartWebUiServerOptions {
  port?: number;
  attachSignals?: boolean;
  exitOnShutdown?: boolean;
  uiPassword?: string | null;
}

export declare function startWebUiServer(
  options?: StartWebUiServerOptions
): Promise<WebUiServerController>;

export declare function gracefulShutdown(options?: { exitProcess?: boolean }): Promise<void>;
export declare function setupProxy(app: Express): void;
export declare function restartKronosCode(): Promise<void>;
export declare function parseArgs(argv?: string[]): { port: number; uiPassword: string | null };
