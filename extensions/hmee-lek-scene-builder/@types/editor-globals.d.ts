declare const Editor: {
  Message: {
    request(channel: string, message: string, ...args: unknown[]): Promise<any>;
    send(channel: string, message: string, ...args: unknown[]): void;
  };
  Dialog?: {
    warn(message: string, options?: Record<string, unknown>): Promise<unknown> | unknown;
    info(message: string, options?: Record<string, unknown>): Promise<unknown> | unknown;
  };
};

declare const module: {
  exports: unknown;
};

declare function require(id: string): any;
