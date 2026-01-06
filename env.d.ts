declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    MONGODB_URL: string;
    TOKEN: string;
    REFRESH_TOKEN_SECRET: string;
    SUPABASE_URL: string;
    SUPABASE_ANON: string;
  }
}