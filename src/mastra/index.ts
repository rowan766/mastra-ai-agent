
import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { LibSQLStore } from '@mastra/libsql';

import { weatherAgent } from './agents';
import { codeReviewerAgent } from './agents/CodeReviewerAgent';
import { CloudflareDeployer } from '@mastra/deployer-cloudflare';


export const mastra = new Mastra({
  deployer: new CloudflareDeployer({
		scope: process.env.CLOUDFLARE_ACCOUNT_ID || 'your-cloudflare-scope',
		projectName: 'mastra-workers',
		workerNamespace: 'production',
		auth: {
			apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
			apiEmail: 'row287630@gmail.com',
		},
	}),
  agents: { weatherAgent,codeReviewerAgent },
	storage: new LibSQLStore({
		url: 'libsql://my-rowan766.aws-ap-northeast-1.turso.io',
		authToken: process.env.LIBSQL_AUTH_TOKEN || '',
	}),
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
