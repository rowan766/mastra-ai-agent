import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testLibSQLConnection() {
  console.log('🔍 测试 LibSQL 连接...');
  
  try {
    // 动态导入 LibSQL 客户端
    const { createClient } = await import('@libsql/client');
    
    const client = createClient({
      url: process.env.DATABASE_URL!,
      authToken: process.env.LIBSQL_AUTH_TOKEN!,
    });
    
    console.log('📊 数据库配置:');
    console.log('- URL:', process.env.DATABASE_URL);
    console.log('- 认证令牌:', process.env.LIBSQL_AUTH_TOKEN ? '已设置' : '未设置');
    
    // 测试简单查询
    const result = await client.execute('SELECT 1 as test');
    console.log('✅ LibSQL 连接成功!');
    console.log('📋 测试查询结果:', result.rows);
    
    // 测试创建表
    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS test_table (
          id INTEGER PRIMARY KEY,
          name TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ 表创建/验证成功');
      
      // 插入测试数据
      await client.execute(`
        INSERT OR REPLACE INTO test_table (id, name) 
        VALUES (1, 'Mastra Test')
      `);
      console.log('✅ 数据插入成功');
      
      // 查询测试数据
      const testData = await client.execute('SELECT * FROM test_table WHERE id = 1');
      console.log('📋 测试数据:', testData.rows);
      
    } catch (error) {
      console.warn('⚠️  表操作警告:', error);
    }
    
    await client.close();
    console.log('🎉 LibSQL 连接测试完成!');
    
  } catch (error) {
    console.error('❌ LibSQL 连接失败:', error);
    console.error('💡 请检查:');
    console.error('  1. DATABASE_URL 是否正确');
    console.error('  2. LIBSQL_AUTH_TOKEN 是否有效');
    console.error('  3. 网络连接是否正常');
    process.exit(1);
  }
}

async function testPostgreSQLConnection() {
  console.log('🔍 测试 PostgreSQL 连接...');
  
  try {
    const { Client } = await import('pg');
    
    const client = new Client({
      connectionString: process.env.POSTGRES_CONNECTION_STRING!,
    });
    
    await client.connect();
    console.log('✅ PostgreSQL 连接成功!');
    
    // 测试查询
    const result = await client.query('SELECT version()');
    console.log('📋 PostgreSQL 版本:', result.rows[0].version);
    
    // 检查 pgvector 扩展
    try {
      await client.query('SELECT * FROM pg_extension WHERE extname = $1', ['vector']);
      console.log('✅ pgvector 扩展可用');
    } catch (error) {
      console.warn('⚠️  pgvector 扩展不可用，可能需要安装');
    }
    
    await client.end();
    console.log('🎉 PostgreSQL 连接测试完成!');
    
  } catch (error) {
    console.error('❌ PostgreSQL 连接失败:', error);
    console.error('💡 请检查:');
    console.error('  1. POSTGRES_CONNECTION_STRING 是否正确');
    console.error('  2. 数据库服务是否运行');
    console.error('  3. 网络连接和防火墙设置');
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 开始数据库连接测试...\n');
  
  const usePostgres = process.env.USE_POSTGRES === 'true';
  
  console.log(`📍 当前配置: USE_POSTGRES=${process.env.USE_POSTGRES}`);
  console.log(`🎯 将测试: ${usePostgres ? 'PostgreSQL' : 'LibSQL'}\n`);
  
  if (usePostgres) {
    await testPostgreSQLConnection();
  } else {
    await testLibSQLConnection();
  }
  
  console.log('\n✨ 所有测试完成!');
}

main().catch(console.error);