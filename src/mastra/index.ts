// src/mastra/index.ts
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';

import { codeReviewerAgent } from '../agents/CodeReviewerAgent';
import { getMastraVectorConfig } from '../config/vectorStore';

export const mastra = new Mastra({
  agents: { codeReviewerAgent },
  storage: new LibSQLStore({
    url: 'libsql://my-rowan766.aws-ap-northeast-1.turso.io',
    authToken: process.env.LIBSQL_AUTH_TOKEN || '',
  }) as any,
  vectors: getMastraVectorConfig() as any,
  telemetry: {
    enabled: false
  }
});