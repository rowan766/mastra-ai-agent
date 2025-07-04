const fs = require('fs')
const path = require('path')

console.log('🚀 开始设置 Mastra AI Agent 项目 (支持 LibSQL + PostgreSQL)...')

// 创建必要的目录
const directories = [
  './data',
  './data/documents',
  './data/knowledge-base',
  './src/mastra/tools',
  './src/scripts',
  './uploads'
]

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`✅ 创建目录: ${dir}`)
  } else {
    console.log(`📁 目录已存在: ${dir}`)
  }
})

// 创建环境变量文件
const envPath = './.env'
const envExample = `# OpenAI API (用于嵌入和LLM)
OPENAI_API_KEY=your_openai_api_key_here

# LibSQL 配置 (Turso) - 你的现有配置
LIBSQL_AUTH_TOKEN=your_libsql_token_here
DATABASE_URL=libsql://your-database.turso.io

# 向量存储选择（重要：决定使用哪个数据库）
USE_POSTGRES=false  # false=使用LibSQL, true=使用PostgreSQL

# PostgreSQL 配置 (AWS RDS) - 你的现有配置
POSTGRES_CONNECTION_STRING=postgresql://postgres:password@your-aws-rds.amazonaws.com:5432/postgres

# Cloudflare 配置 (用于部署) - 你的现有配置
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# Mastra 配置
MASTRA_ENV=development
DOCUMENTS_PATH=./data/documents

# 环境设置
NODE_ENV=development
LOG_LEVEL=info
`

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envExample, 'utf8')
  console.log('✅ 创建环境变量文件: .env')
  console.log('⚠️  请编辑 .env 文件，设置您的数据库连接和 API 密钥')
} else {
  console.log('📝 环境变量文件已存在: .env')
}

// 创建示例文档
const sampleDocPath = './data/documents/示例文档.md'
const sampleContent = `# Mastra AI Agent 示例文档 (混合数据库版本)

这是一个示例文档，用于测试 RAG 功能。

## 功能特点

1. **智能问答**: 基于知识库内容回答问题
2. **灵活数据库**: 支持 LibSQL (Turso) 和 PostgreSQL (AWS RDS)
3. **向量检索**: 自动选择最适合的向量存储方案
4. **实时索引**: 自动索引新上传的文档
5. **云原生**: 支持 Cloudflare 部署

## 数据库配置

### LibSQL (Turso)
- 轻量级、边缘计算优化
- 适合开发和小规模应用
- 自动同步和分布式

### PostgreSQL (AWS RDS)  
- 企业级、高性能
- 支持 pgvector 向量扩展
- 适合生产环境

## 配置切换

通过 \`USE_POSTGRES\` 环境变量控制：
- \`USE_POSTGRES=false\`: 使用 LibSQL (开发环境)
- \`USE_POSTGRES=true\`: 使用 PostgreSQL (生产环境)

## 技术栈

- **AI框架**: Mastra 0.1.15
- **数据库**: LibSQL + PostgreSQL (混合支持)
- **向量存储**: 自适应选择
- **LLM**: OpenAI GPT
- **部署**: Cloudflare Workers

这种混合架构让你可以在开发时使用轻量的 LibSQL，在生产时切换到强大的 PostgreSQL！
`

if (!fs.existsSync(sampleDocPath)) {
  fs.writeFileSync(sampleDocPath, sampleContent, 'utf8')
  console.log('✅ 创建示例文档')
} else {
  console.log('📝 示例文档已存在')
}

// 创建 PostgreSQL Docker Compose 文件
const dockerComposePath = './docker-compose.yml'
const dockerComposeContent = `version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: mastra_db
      POSTGRES_USER: username
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U username -d mastra_db"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 可选：添加 pgAdmin 用于数据库管理
  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - "8080:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    restart: unless-stopped
    depends_on:
      - postgres

volumes:
  postgres_data:
  pgadmin_data:
`

if (!fs.existsSync(dockerComposePath)) {
  fs.writeFileSync(dockerComposePath, dockerComposeContent, 'utf8')
  console.log('✅ 创建 Docker Compose 配置')
} else {
  console.log('📝 Docker Compose 配置已存在')
}

// 创建 PostgreSQL 初始化脚本
const initSqlPath = './init.sql'
const initSqlContent = `-- 初始化 PostgreSQL 数据库
-- 创建 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建全文搜索扩展
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 创建用于向量相似度搜索的索引函数
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
RETURNS float AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql;

-- 设置一些性能优化参数
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET work_mem = '256MB';

-- 重新加载配置
SELECT pg_reload_conf();
`

if (!fs.existsSync(initSqlPath)) {
  fs.writeFileSync(initSqlPath, initSqlContent, 'utf8')
  console.log('✅ 创建 PostgreSQL 初始化脚本')
} else {
  console.log('📝 PostgreSQL 初始化脚本已存在')
}

// 创建基础工具文件
const toolIndexPath = './src/mastra/tools/index.ts'
const toolIndexContent = `// Mastra 工具索引文件
export {};

// TODO: 在这里导出你的自定义工具
// export { myTool } from './my-tool';
`

if (!fs.existsSync(toolIndexPath)) {
  fs.writeFileSync(toolIndexPath, toolIndexContent, 'utf8')
  console.log('✅ 创建工具索引文件')
} else {
  console.log('📝 工具索引文件已存在')
}

console.log('\n🎉 项目设置完成！')
console.log('\n📋 接下来的步骤:')
console.log('1. 编辑 .env 文件，设置 API 密钥和数据库选择')
console.log('2. 设置 USE_POSTGRES 环境变量选择数据库:')
console.log('   - USE_POSTGRES=false (使用 LibSQL/Turso)')
console.log('   - USE_POSTGRES=true (使用 PostgreSQL/AWS RDS)')
console.log('3. 运行 "pnpm install" 安装依赖')
console.log('4. 运行 "pnpm dev" 启动开发服务器')
console.log('\n🔧 数据库管理:')
console.log('- LibSQL: 通过 Turso Dashboard 管理')
console.log('- PostgreSQL: 使用 AWS RDS Console 或 pgAdmin')
console.log('\n☁️  部署:')
console.log('- 开发: LibSQL + Cloudflare Workers')
console.log('- 生产: PostgreSQL + Cloudflare Workers')
console.log('\n💡 提示: 项目会根据 USE_POSTGRES 环境变量自动选择合适的数据库')