// src/tools/VectorQueryTool.ts
import { createVectorQueryTool } from '@mastra/rag';
import { openai } from '@ai-sdk/openai';
import { getVectorStore } from '../config/vectorStore';

// 创建代码最佳实践查询工具
export const CodeBestPracticesQueryTool = createVectorQueryTool({
  vectorStoreName: 'codeKnowledge',
  indexName: 'code_knowledge',
  model: openai.embedding('text-embedding-3-small'),
  description: 'Search for code best practices, examples, and patterns from the knowledge base'
});

// 创建代码问题模式查询工具  
export const CodeIssuesPatternsQueryTool = createVectorQueryTool({
  vectorStoreName: 'codeKnowledge',
  indexName: 'code_knowledge',
  model: openai.embedding('text-embedding-3-small'),
  description: 'Search for common code issues, anti-patterns, and their solutions'
});

// 创建代码风格指南查询工具
export const CodeStyleGuideQueryTool = createVectorQueryTool({
  vectorStoreName: 'codeKnowledge', 
  indexName: 'code_knowledge',
  model: openai.embedding('text-embedding-3-small'),
  description: 'Search for coding style guidelines and conventions'
});