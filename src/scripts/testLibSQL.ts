// scripts/testLibSQL.ts
import { LibSQLVector } from '@mastra/libsql';
import * as dotenv from 'dotenv';

dotenv.config();

async function testLibSQL() {
  console.log('🧪 Testing LibSQL Vector...');
  
  try {
    // 创建本地文件数据库（最简单的方式）
    const vectorStore = new LibSQLVector({
      connectionUrl: 'file:./test-vectors.db', // 会自动创建
      // 不需要 authToken（本地文件模式）
    });

    console.log('✅ LibSQL Vector store created successfully!');
    
    // 测试创建索引
    await vectorStore.createIndex({
      indexName: 'test_index',
      dimension: 10 // 小一点的维度用于测试
    });
    
    console.log('✅ Test index created successfully!');
    
    // 测试插入向量
    const testVector = Array.from({length: 10}, () => Math.random());
    await vectorStore.upsert({
      indexName: 'test_index',
      vectors: [testVector],
      metadata: [{ text: 'This is a test' }]
    });
    
    console.log('✅ Test vector inserted successfully!');
    
    // 测试查询
    const results = await vectorStore.query({
      indexName: 'test_index',
      queryVector: testVector,
      topK: 1
    });
    
    console.log('✅ Query successful!', results);
    console.log('🎉 LibSQL is working perfectly!');
    
  } catch (error) {
    console.error('❌ LibSQL test failed:', error);
  }
}

// 运行测试
if (require.main === module) {
  testLibSQL();
}