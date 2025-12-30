declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    MONGODB_URL: string;
    TOKEN: string;
    SUPABASE_URL: string;
    SUPABASE_ANON: string;
  }
}