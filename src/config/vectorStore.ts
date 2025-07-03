// src/config/vectorStore.ts
import { PgVector } from '@mastra/pg';
import { LibSQLVector } from '@mastra/libsql';

// 选项1: 使用 PostgreSQL + pgvector (推荐用于生产)
export const createPgVectorStore = () => {
  return new PgVector({
    connectionString: process.env.POSTGRES_CONNECTION_STRING || 'postgresql://user:password@localhost:5432/code_review_db',
    schemaName: 'code_review_vectors' // 可选：自定义schema
  });
};

// 选项2: 使用 LibSQL Vector (开发环境或轻量级部署)
export const createLibSQLVectorStore = () => {
  return new LibSQLVector({
    connectionUrl: process.env.DATABASE_URL || 'file:./code_review_vectors.db',
    authToken: process.env.LIBSQL_AUTH_TOKEN
  });
};

// 根据环境选择向量存储
export const getVectorStore = () => {
  const usePostgres = process.env.USE_POSTGRES === 'true';
  
  if (usePostgres) {
    return createPgVectorStore();
  } else {
    return createLibSQLVectorStore();
  }
};

export const getVectorStoreType = (): 'postgresql' | 'libsql' => {
  return process.env.USE_POSTGRES === 'true' ? 'postgresql' : 'libsql';
};

export const checkVectorStoreHealth = async () => {
  try {
    const vectorStore = getVectorStore();
    const storeType = getVectorStoreType();
    console.log(`✅ Vector store (${storeType}) is healthy`);
    return { healthy: true, type: storeType };
  } catch (error) {
    console.error('❌ Vector store health check failed:', error);
    return { healthy: false, error: error.message };
  }
};

export const getMastraVectorConfig = () => {
  const usePostgres = process.env.USE_POSTGRES === 'true';
  
  if (usePostgres) {
    return {
      codeKnowledge: new PgVector({
        connectionString: process.env.POSTGRES_CONNECTION_STRING || 'postgresql://user:password@localhost:5432/code_review_db',
        schemaName: 'code_review_vectors'
      })
    };
  } else {
    return {
      codeKnowledge: new LibSQLVector({
        connectionUrl: process.env.DATABASE_URL || 'file:./code_review_vectors.db',
        authToken: process.env.LIBSQL_AUTH_TOKEN
      })
    };
  }
};