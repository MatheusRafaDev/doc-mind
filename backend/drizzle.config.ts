import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/banco/esquema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.URL_BANCO_DADOS || 'postgres://docmind:docmind123@localhost:5433/docmind',
  },
});
