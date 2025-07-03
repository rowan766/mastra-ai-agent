// src/tools/AutoCodeReviewTool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// 定义问题的类型
interface CodeIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  line?: number;
  message: string;
  suggestion?: string;
  code?: string;
}

// 定义输出结果的类型
interface CodeReviewResult {
  language: string;
  issues: CodeIssue[];
  summary: string;
  metrics?: {
    complexityScore?: number;
    maintainabilityScore?: number;
    securityScore?: number;
  };
}

export const AutoCodeReviewTool = createTool({
  id: 'auto-code-review',
  description: 'Performs static analysis and AI-assisted code review on a file or code snippet',
  inputSchema: z.object({
    code: z.string().describe('The code to review'),
    language: z.string().optional().describe('Programming language (auto-detected if not provided)'),
    focus: z.array(z.string()).optional().describe('Specific areas to focus on (e.g., security, performance)')
  }),
  outputSchema: z.object({
    language: z.string(),
    issues: z.array(z.object({
      severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
      type: z.string(),
      line: z.number().optional(),
      message: z.string(),
      suggestion: z.string().optional(),
      code: z.string().optional()
    })),
    summary: z.string(),
    metrics: z.object({
      complexityScore: z.number().optional(),
      maintainabilityScore: z.number().optional(),
      securityScore: z.number().optional()
    }).optional()
  }),

  execute: async ({ context }) => {
    try {
      const { code, language, focus } = context;

      if (!code) {
        return {
          language: 'unknown',
          issues: [
            {
              severity: 'critical',
              type: 'system',
              message: 'No code provided for review',
            },
          ],
          summary: 'No code was provided for review.',
        };
      }

      // 检测语言
      const detectedLanguage = language || detectLanguage(code);

      // 分析代码
      const issues = analyzeCode(code, detectedLanguage, focus);

      return {
        language: detectedLanguage,
        issues: issues.length > 0 ? issues : [
          {
            severity: 'info',
            type: 'general',
            message: 'No issues found in the code.',
          },
        ],
        summary: generateSummary(issues, detectedLanguage, focus),
        metrics: calculateMetrics(issues),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        language: 'unknown',
        issues: [
          {
            severity: 'critical',
            type: 'system',
            message: `Error during code review: ${errorMessage}`,
          },
        ],
        summary: 'An error occurred during the code review process.',
      };
    }
  },
});

// 检测编程语言
function detectLanguage(code: string): string {
  // TypeScript 检测
  if (code.includes('interface ') || code.includes('type ') || code.includes(': string') || code.includes(': number')) {
    return 'typescript';
  }
  
  // React 检测
  if (code.includes('import React') || code.includes('useState') || code.includes('useEffect') || code.includes('JSX')) {
    return 'react';
  }
  
  // JavaScript 检测
  if (code.includes('function ') || code.includes('const ') || code.includes('let ') || code.includes('var ')) {
    return 'javascript';
  }
  
  // Python 检测
  if (code.includes('def ') || code.includes('import ') || code.includes('print(') || /^\s*#/.test(code)) {
    return 'python';
  }
  
  // Solidity 检测
  if (code.includes('contract ') || code.includes('pragma solidity') || code.includes('function ') && code.includes('public')) {
    return 'solidity';
  }
  
  // Java 检测
  if (code.includes('public class') || code.includes('public static void main')) {
    return 'java';
  }
  
  // C# 检测
  if (code.includes('using System') || code.includes('namespace ') || code.includes('public class')) {
    return 'csharp';
  }

  return 'unknown';
}

// 分析代码并返回发现的问题
function analyzeCode(code: string, language: string, focus?: string[]): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const lines = code.split('\n');

  // 通用代码分析
  analyzeGeneralIssues(code, lines, issues);
  
  // 语言特定分析
  switch (language) {
    case 'typescript':
    case 'javascript':
    case 'react':
      analyzeJavaScriptTypeScript(code, lines, issues);
      break;
    case 'python':
      analyzePython(code, lines, issues);
      break;
    case 'solidity':
      analyzeSolidity(code, lines, issues);
      break;
  }

  // 焦点领域分析
  if (focus) {
    analyzeFocusAreas(code, lines, issues, focus);
  }

  return issues;
}

// 通用问题分析
function analyzeGeneralIssues(code: string, lines: string[], issues: CodeIssue[]) {
  // 检查过长的行
  lines.forEach((line, index) => {
    if (line.length > 120) {
      issues.push({
        severity: 'low',
        type: 'style',
        line: index + 1,
        message: 'Line is too long (>120 characters)',
        suggestion: 'Consider breaking this line into multiple lines'
      });
    }
  });

  // 检查TODO和FIXME注释
  lines.forEach((line, index) => {
    if (line.includes('TODO') || line.includes('FIXME')) {
      issues.push({
        severity: 'info',
        type: 'maintenance',
        line: index + 1,
        message: 'TODO/FIXME comment found',
        suggestion: 'Consider addressing this TODO item'
      });
    }
  });

  // 检查硬编码值
  const hardcodedPatterns = [
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP地址
    /(['"])(https?:\/\/[^'"]+)\1/, // URL
    /(['"])([A-Za-z0-9+/]{20,})\1/ // 可能的密钥
  ];

  lines.forEach((line, index) => {
    hardcodedPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        issues.push({
          severity: 'medium',
          type: 'maintainability',
          line: index + 1,
          message: 'Hardcoded value detected',
          suggestion: 'Consider using configuration variables or constants'
        });
      }
    });
  });
}

// JavaScript/TypeScript 特定分析
function analyzeJavaScriptTypeScript(code: string, lines: string[], issues: CodeIssue[]) {
  // 检查var使用
  lines.forEach((line, index) => {
    if (line.includes('var ')) {
      issues.push({
        severity: 'medium',
        type: 'best-practice',
        line: index + 1,
        message: 'Use of "var" keyword',
        suggestion: 'Use "const" or "let" instead of "var"'
      });
    }
  });

  // 检查console.log
  lines.forEach((line, index) => {
    if (line.includes('console.log')) {
      issues.push({
        severity: 'low',
        type: 'maintenance',
        line: index + 1,
        message: 'Console.log statement found',
        suggestion: 'Remove console.log statements before production'
      });
    }
  });

  // 检查== vs ===
  lines.forEach((line, index) => {
    if (line.includes('==') && !line.includes('===')) {
      issues.push({
        severity: 'medium',
        type: 'best-practice',
        line: index + 1,
        message: 'Use of loose equality (==)',
        suggestion: 'Use strict equality (===) instead'
      });
    }
  });

  // 检查未处理的Promise
  lines.forEach((line, index) => {
    if (line.includes('await ') && !line.includes('try') && !line.includes('catch')) {
      const nextLines = lines.slice(index, index + 5);
      const hasTryCatch = nextLines.some(l => l.includes('try') || l.includes('catch'));
      if (!hasTryCatch) {
        issues.push({
          severity: 'high',
          type: 'error-handling',
          line: index + 1,
          message: 'Unhandled async operation',
          suggestion: 'Add proper error handling for async operations'
        });
      }
    }
  });
}

// Python 特定分析
function analyzePython(code: string, lines: string[], issues: CodeIssue[]) {
  // 检查缩进
  lines.forEach((line, index) => {
    if (line.trim() && line.match(/^\t/)) {
      issues.push({
        severity: 'low',
        type: 'style',
        line: index + 1,
        message: 'Use of tabs for indentation',
        suggestion: 'Use 4 spaces for indentation instead of tabs'
      });
    }
  });

  // 检查print语句
  lines.forEach((line, index) => {
    if (line.includes('print(') && !line.includes('#')) {
      issues.push({
        severity: 'low',
        type: 'maintenance',
        line: index + 1,
        message: 'Print statement found',
        suggestion: 'Consider using logging instead of print statements'
      });
    }
  });
}

// Solidity 特定分析
function analyzeSolidity(code: string, lines: string[], issues: CodeIssue[]) {
  // 检查pragma版本
  const pragmaLine = lines.find(line => line.includes('pragma solidity'));
  if (pragmaLine && pragmaLine.includes('^')) {
    issues.push({
      severity: 'medium',
      type: 'security',
      message: 'Floating pragma version',
      suggestion: 'Lock pragma to specific compiler version for production'
    });
  }

  // 检查未使用的变量
  lines.forEach((line, index) => {
    if (line.includes('function ') && line.includes('public') && !line.includes('view') && !line.includes('pure')) {
      issues.push({
        severity: 'medium',
        type: 'gas-optimization',
        line: index + 1,
        message: 'Public function without view/pure modifier',
        suggestion: 'Add view or pure modifier if function does not modify state'
      });
    }
  });
}

// 焦点领域分析
function analyzeFocusAreas(code: string, lines: string[], issues: CodeIssue[], focus: string[]) {
  if (focus.includes('security')) {
    // 安全相关检查
    lines.forEach((line, index) => {
      if (line.includes('eval(') || line.includes('innerHTML')) {
        issues.push({
          severity: 'critical',
          type: 'security',
          line: index + 1,
          message: 'Potential security vulnerability',
          suggestion: 'Avoid using eval() or innerHTML with user input'
        });
      }
    });
  }

  if (focus.includes('performance')) {
    // 性能相关检查
    lines.forEach((line, index) => {
      if (line.includes('for') && line.includes('length')) {
        issues.push({
          severity: 'low',
          type: 'performance',
          line: index + 1,
          message: 'Potential performance issue in loop',
          suggestion: 'Cache array length in variable outside loop'
        });
      }
    });
  }
}

// 生成代码审查摘要
function generateSummary(issues: CodeIssue[], language: string, focus?: string[]): string {
  const issueCount = issues.length;
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const focusAreas = focus?.join(', ') || 'general quality';

  if (issueCount === 0) {
    return `No issues found in the ${language} code. The code appears to be well-written.`;
  }

  let summary = `Found ${issueCount} issue${issueCount > 1 ? 's' : ''} in the ${language} code.`;
  
  if (criticalCount > 0) {
    summary += ` ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} require immediate attention.`;
  }
  
  if (highCount > 0) {
    summary += ` ${highCount} high-priority issue${highCount > 1 ? 's' : ''} should be addressed.`;
  }

  summary += ` Focus areas: ${focusAreas}.`;

  return summary;
}

// 计算代码质量指标
function calculateMetrics(issues: CodeIssue[]): {
  complexityScore: number;
  maintainabilityScore: number;
  securityScore: number;
} {
  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;
  const low = issues.filter(i => i.severity === 'low').length;

  // 计算指标得分 (0-10分制)
  const complexityScore = Math.max(0, 10 - critical * 3 - high * 2 - medium * 1 - low * 0.5);
  const maintainabilityScore = Math.max(0, 10 - critical * 2 - high * 1.5 - medium * 1 - low * 0.3);
  const securityScore = Math.max(0, 10 - critical * 4 - high * 2.5 - medium * 1.5);

  return {
    complexityScore: Math.round(complexityScore * 10) / 10,
    maintainabilityScore: Math.round(maintainabilityScore * 10) / 10,
    securityScore: Math.round(securityScore * 10) / 10,
  };
}