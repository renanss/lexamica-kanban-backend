import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  MONGODB_URL: z.string().url(),
  CORS_ORIGIN: z.string().url(),
}).passthrough();

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error('❌ Invalid environment variables:', envParse.error.format());
  throw new Error('Invalid environment variables');
}

const envProxy = new Proxy(envParse.data, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    if (prop in process.env) {
      console.warn(`⚠️  Warning: Accessing non-validated environment variable "${prop}". Consider adding it to the schema.`);
      return process.env[prop];
    }
    return undefined;
  }
});

export type Env = z.infer<typeof envSchema> & {
  [key: string]: string | undefined;
};

export default envProxy as Env; 