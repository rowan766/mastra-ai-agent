import { createTool } from '@mastra/core/tools';

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
	description:
		'Performs static analysis and AI-assisted code review on a file or code snippet',

	// 使用any类型绕过类型检查
	execute: async (context: any, options?: any) => {
		try {
			// 使用类型断言安全地访问参数
			// 这里假设代码和其他参数直接在context对象中或者在某个属性中
			const code = context.code || context.params?.code || '';
			const language = context.language || context.params?.language;
			const focus = context.focus || context.params?.focus;

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
				issues:
					issues.length > 0
						? issues
						: [
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
			const errorMessage =
				error instanceof Error ? error.message : String(error);
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

// detectLanguage 函数现在只根据代码内容检测
function detectLanguage(code: string): string {
	if (
		code.includes('function') &&
		(code.includes('interface') || code.includes('type '))
	)
		return 'typescript';
	if (
		code.includes('function') &&
		(code.includes('var') || code.includes('const'))
	)
		return 'javascript';
	if (code.includes('def ') && code.includes(':')) return 'python';
	if (code.includes('contract') && code.includes('pragma solidity'))
		return 'solidity';
	if (code.includes('import React') || code.includes('useState'))
		return 'react';

	return 'unknown';
}

// 分析代码并返回发现的问题
function analyzeCode(
	code: string,
	language: string,
	focus?: string[]
): CodeIssue[] {
	// 这里应该是真实的代码分析逻辑
	// 在此示例中，我们返回一个示例问题
	return [
		{
			severity: 'medium',
			type: 'style',
			line: 1,
			message: 'Sample issue: Consider using more descriptive variable names',
			suggestion: 'Rename variables to reflect their purpose',
		},
	];
}

// 生成代码审查摘要
function generateSummary(
	issues: CodeIssue[],
	language: string,
	focus?: string[]
): string {
	const issueCount = issues.length;
	const focusAreas = focus?.join(', ') || 'general quality';

	if (issueCount === 0) {
		return `No issues found in the ${language} code. The code appears to be well-written.`;
	}

	return `Found ${issueCount} issues in the ${language} code. Focus areas: ${focusAreas}.`;
}

// 计算代码质量指标
function calculateMetrics(issues: CodeIssue[]): {
	complexityScore: number;
	maintainabilityScore: number;
	securityScore: number;
} {
	// 简单的指标计算示例
	const critical = issues.filter((i) => i.severity === 'critical').length;
	const high = issues.filter((i) => i.severity === 'high').length;
	const medium = issues.filter((i) => i.severity === 'medium').length;

	// 计算指标得分 (示例算法)
	const complexityScore = Math.max(0, 10 - critical * 2 - high - medium * 0.5);
	const maintainabilityScore = Math.max(0, 10 - high - medium * 0.5);
	const securityScore = Math.max(0, 10 - critical * 3 - high * 1.5);

	return {
		complexityScore,
		maintainabilityScore,
		securityScore,
	};
}
