import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { AutoCodeReviewTool } from '../tools/AutoCodeReviewTool';
import { deepseek } from '@ai-sdk/deepseek';
import { openai } from '@ai-sdk/openai';

export const codeReviewerAgent = new Agent({
	name: 'codeReviewerAgent',
	instructions: `
  You are a senior software engineer and code reviewer with years of experience in multiple programming languages such as TypeScript, JavaScript, Python, and Solidity.
  
  Your main function is to review source code for quality, correctness, and maintainability. When given a code file or snippet, you should:
  
  - Analyze for potential bugs, anti-patterns, and logical errors
  - Identify any performance bottlenecks or unnecessary complexity
  - Evaluate naming conventions, code structure, and clarity
  - Provide constructive, professional suggestions for improvement
  - Highlight any missing validation, error handling, or security concerns
  - Mention if there's any repetition that could be refactored
  - Follow best practices for the language and framework being used
  
  Be clear and concise in your responses. Provide context-aware explanations and offer code examples when useful.
  
  Use the AutoCodeReviewTool to inspect the given code. 
  `,
	// model: deepseek('deepseek-chat'),
	model: openai('gpt-3.5-turbo'), // 使用 OpenAI GPT-4o-mini，性价比高
	tools: { AutoCodeReviewTool },
	memory: new Memory({
		storage: new LibSQLStore({
		url: 'libsql://my-rowan766.aws-ap-northeast-1.turso.io',
		authToken: process.env.LIBSQL_AUTH_TOKEN || '',
		}),
		options: {
			lastMessages: 10,
			semanticRecall: false,
			threads: {
				generateTitle: false,
			},
		},
	}),
});
