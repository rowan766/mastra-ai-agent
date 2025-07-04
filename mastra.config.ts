import { config } from '@mastra/core';

export default config({
  name: 'my-mastra-app2',
  
  // 环境配置
  environment: process.env.NODE_ENV || 'development',
  
  // 工具目录
  toolsDir: './src/mastra/tools',
  
  // 数据目录
  dataDir: './data',
  
  // 数据库配置（支持 LibSQL 和 PostgreSQL）
  db: {
    provider: process.env.USE_POSTGRES === 'true' ? 'postgres' : 'libsql',
    url: process.env.USE_POSTGRES === 'true' 
      ? process.env.POSTGRES_CONNECTION_STRING 
      : process.env.DATABASE_URL,
    authToken: process.env.USE_POSTGRES === 'true' 
      ? undefined 
      : process.env.LIBSQL_AUTH_TOKEN
  },
  
  // 向量数据库配置（根据 USE_POSTGRES 环境变量选择）
  vectors: {
    provider: process.env.USE_POSTGRES === 'true' ? 'postgres' : 'libsql',
    config: process.env.USE_POSTGRES === 'true' 
      ? {
          connectionString: process.env.POSTGRES_CONNECTION_STRING,
          tableName: 'document_embeddings',
          vectorDimension: 1536 // OpenAI 嵌入维度
        }
      : {
          url: process.env.DATABASE_URL,
          authToken: process.env.LIBSQL_AUTH_TOKEN,
          tableName: 'document_embeddings',
          vectorDimension: 1536
        }
  },
  
  // LLM 配置
  llms: [
    {
      name: 'openai',
      provider: 'openai',
      config: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo'
      }
    },
    {
      name: 'deepseek',
      provider: 'deepseek', 
      config: {
        apiKey: process.env.DEEPSEEK_API_KEY,
        model: 'deepseek-chat'
      }
    }
  ],
  
  // RAG 配置
  rag: {
    enabled: true,
    chunkSize: 1000,
    chunkOverlap: 200,
    documentsPath: './data/documents',
    embeddingModel: 'openai', // 使用 OpenAI 生成嵌入
    vectorStore: 'postgres'   // 使用 PostgreSQL 存储向量
  },
  
  // 内存配置
  memory: {
    provider: 'postgres',
    config: {
      connectionString: process.env.DATABASE_URL
    }
  }
});