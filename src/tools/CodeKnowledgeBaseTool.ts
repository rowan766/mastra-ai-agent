// src/tools/CodeKnowledgeBaseTool.ts
import { createTool } from '@mastra/core/tools';
import { MDocument } from '@mastra/rag';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getVectorStore } from '../config/vectorStore';
import { z } from 'zod';

interface CodeKnowledgeEntry {
  code: string;
  language: string;
  description: string;
  tags: string[];
  bestPractices?: string[];
  commonIssues?: string[];
  fileName?: string;
  source?: string;
}

export const CodeKnowledgeBaseTool = createTool({
  id: 'code-knowledge-base',
  description: 'Manages code knowledge base for code review reference',
  inputSchema: z.object({
    action: z.enum(['add', 'search', 'update']),
    code: z.string().optional(),
    language: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    query: z.string().optional(),
    limit: z.number().default(5).optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    results: z.array(z.any()).optional(),
    message: z.string().optional()
  }),
  
  execute: async ({ context }) => {
    const vectorStore = getVectorStore();
    const { action, code, language, description, tags, query, limit } = context;

    try {
      switch (action) {
        case 'add':
          return await addCodeToKnowledgeBase({
            vectorStore,
            code: code!,
            language: language!,
            description: description!,
            tags: tags || []
          });

        case 'search':
          return await searchCodeKnowledge({
            vectorStore,
            query: query!,
            limit: limit!
          });

        case 'update':
          return {
            success: true,
            message: 'Update functionality to be implemented'
          };

        default:
          return {
            success: false,
            message: 'Invalid action specified'
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
});

// 添加代码到知识库
async function addCodeToKnowledgeBase({
  vectorStore,
  code,
  language,
  description,
  tags
}: {
  vectorStore: any;
  code: string;
  language: string;
  description: string;
  tags: string[];
}) {
  // 创建文档
  const doc = MDocument.fromText(code);
  
  // 分块处理
  const chunks = await doc.chunk({
    strategy: 'recursive',
    size: 512,
    overlap: 50,
    separator: '\n'
  });

  // 生成嵌入
  const { embeddings } = await embedMany({
    values: chunks.map(chunk => `${language}: ${description}\n${chunk.text}`),
    model: openai.embedding('text-embedding-3-small')
  });

  // 存储到向量数据库
  await vectorStore.upsert({
    indexName: 'code_knowledge',
    vectors: embeddings,
    metadata: chunks.map((chunk, index) => ({
      text: chunk.text,
      language,
      description,
      tags,
      chunkIndex: index,
      timestamp: new Date().toISOString()
    }))
  });

  return {
    success: true,
    message: `Successfully added ${chunks.length} code chunks to knowledge base`
  };
}

// 搜索代码知识
async function searchCodeKnowledge({
  vectorStore,
  query,
  limit
}: {
  vectorStore: any;
  query: string;
  limit: number;
}) {
  // 生成查询嵌入
  const { embeddings: queryEmbeddings } = await embedMany({
    values: [query],
    model: openai.embedding('text-embedding-3-small')
  });

  // 搜索相似代码
  const results = await vectorStore.query({
    indexName: 'code_knowledge',
    queryVector: queryEmbeddings[0],
    topK: limit,
    includeMetadata: true
  });

  return {
    success: true,
    results: results.map((result: any) => ({
      code: result.metadata.text,
      language: result.metadata.language,
      description: result.metadata.description,
      tags: result.metadata.tags,
      similarity: result.score,
      timestamp: result.metadata.timestamp
    }))
  };
}