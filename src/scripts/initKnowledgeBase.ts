// scripts/initKnowledgeBase.ts
import { MDocument } from '@mastra/rag';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getVectorStore } from '../config/vectorStore';
import * as fs from 'fs/promises';
import * as path from 'path';

interface KnowledgeEntry {
  title: string;
  content: string;
  language: string;
  category: string;
  tags: string[];
}

// 预定义的代码知识库内容
const codeKnowledgeEntries: KnowledgeEntry[] = [
  {
    title: "TypeScript Best Practices",
    content: `
// Use strict typing
interface UserProfile {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

// Avoid 'any' type, use proper typing
function processUser(user: UserProfile): void {
  // Implementation
}

// Use optional chaining and nullish coalescing
const userName = user?.profile?.name ?? 'Anonymous';
    `,
    language: "typescript",
    category: "best-practices",
    tags: ["typescript", "typing", "interfaces", "safety"]
  },
  {
    title: "React Hooks Best Practices",
    content: `
// Good: Custom hook with proper dependency array
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!userId) return;
    
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]); // Proper dependency
  
  return { user, loading };
}

// Bad: Missing dependencies
useEffect(() => {
  fetchData(param);
}, []); // Missing 'param' in dependencies
    `,
    language: "react",
    category: "best-practices", 
    tags: ["react", "hooks", "useEffect", "dependencies"]
  },
  {
    title: "Common Security Issues",
    content: `
// BAD: SQL Injection vulnerability
const query = \`SELECT * FROM users WHERE id = '\${userId}'\`;

// GOOD: Parameterized query
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);

// BAD: XSS vulnerability
element.innerHTML = userInput;

// GOOD: Safe text content
element.textContent = userInput;
// OR: Proper sanitization
element.innerHTML = DOMPurify.sanitize(userInput);
    `,
    language: "javascript",
    category: "security",
    tags: ["security", "sql-injection", "xss", "sanitization"]
  },
  {
    title: "Error Handling Patterns",
    content: `
// Good: Proper error handling with specific error types
class ValidationError extends Error {
  constructor(field: string, message: string) {
    super(\`Validation error in \${field}: \${message}\`);
    this.name = 'ValidationError';
  }
}

async function processData(data: unknown): Promise<ProcessedData> {
  try {
    const validated = validateData(data);
    return await processValidatedData(validated);
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Validation failed', { error: error.message });
      throw error;
    }
    logger.error('Unexpected error', { error });
    throw new Error('Processing failed');
  }
}
    `,
    language: "typescript",
    category: "error-handling",
    tags: ["error-handling", "validation", "async", "logging"]
  }
];

export async function initializeKnowledgeBase() {
  console.log('🚀 Initializing code knowledge base...');
  
  const vectorStore = getVectorStore();
  
  try {
    // 创建索引
    await vectorStore.createIndex({
      indexName: 'code_knowledge',
      dimension: 1536 // OpenAI text-embedding-3-small 维度
    });

    // 处理每个知识条目
    for (const entry of codeKnowledgeEntries) {
      console.log(`📄 Processing: ${entry.title}`);
      
      // 创建文档
      const doc = MDocument.fromText(entry.content);
      
      // 分块
      const chunks = await doc.chunk({
        strategy: 'recursive',
        size: 512,
        overlap: 50,
        separator: '\n'
      });

      // 生成嵌入
      const { embeddings } = await embedMany({
        values: chunks.map(chunk => 
          `${entry.title}\n${entry.language}: ${entry.category}\n${chunk.text}`
        ),
        model: openai.embedding('text-embedding-3-small')
      });

      // 存储到向量数据库
      await vectorStore.upsert({
        indexName: 'code_knowledge',
        vectors: embeddings,
        metadata: chunks.map((chunk, index) => ({
          title: entry.title,
          text: chunk.text,
          language: entry.language,
          category: entry.category,
          tags: entry.tags,
          chunkIndex: index,
          timestamp: new Date().toISOString()
        }))
      });

      console.log(`✅ Added ${chunks.length} chunks for: ${entry.title}`);
    }

    console.log('🎉 Knowledge base initialization completed!');
    
  } catch (error) {
    console.error('❌ Error initializing knowledge base:', error);
    throw error;
  }
}

// 从文件加载知识库（可选）
export async function loadKnowledgeFromFiles(dirPath: string) {
  const files = await fs.readdir(dirPath);
  const markdownFiles = files.filter(file => file.endsWith('.md'));
  
  for (const file of markdownFiles) {
    const filePath = path.join(dirPath, file);
    const content = await fs.readFile(filePath, 'utf-8');
    
    // 从文件名推断语言和类别
    const [language, category] = file.replace('.md', '').split('-');
    
    const entry: KnowledgeEntry = {
      title: file.replace('.md', '').replace('-', ' '),
      content,
      language: language || 'general',
      category: category || 'general',
      tags: [language, category].filter(Boolean)
    };
    
    // 处理并存储（类似上面的逻辑）
  }
}

// 直接运行初始化
if (require.main === module) {
  initializeKnowledgeBase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}