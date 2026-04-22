import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'npm run build',
  functions: {
    'app/api/generate/**/route.ts': { maxDuration: 300 },
    'app/api/interview/route.ts': { maxDuration: 60 },
    'app/api/score/route.ts': { maxDuration: 30 },
  },
};
