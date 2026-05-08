import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'npm run build',
  functions: {
    'app/api/generate/carousel/route.ts': { maxDuration: 60 },
    'app/api/generate/video/route.ts': { maxDuration: 90 },
    'app/api/interview/route.ts': { maxDuration: 60 },
    'app/api/score/route.ts': { maxDuration: 30 },
  },
};
