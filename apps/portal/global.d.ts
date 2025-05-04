declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

declare const process: { env: NodeJS.ProcessEnv }; 