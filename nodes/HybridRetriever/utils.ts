import {
	IExecuteFunctions,
	ISupplyDataFunctions,
	NodeOperationError,
} from 'n8n-workflow';
import { EnsembleRetriever } from 'langchain/retrievers/ensemble';
import { ContextualCompressionRetriever } from 'langchain/retrievers/contextual_compression';
import { BaseRetriever } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { CallbackManagerForRetrieverRun } from '@langchain/core/callbacks/manager';

// --- 辅助类：负责从 Metadata 中提取文本到 pageContent ---
export class MetadataFixingRetriever extends BaseRetriever {
	lc_namespace = ["n8n", "retrievers"];

	constructor(
		private childRetriever: BaseRetriever, 
		private textFields: string[] 
	) { 
		super(); 
	}

	async _getRelevantDocuments(query: string, runManager?: CallbackManagerForRetrieverRun): Promise<Document[]> {
		// 调用子检索器
		const docs = await this.childRetriever.invoke(query, { callbacks: runManager?.getChild() });
		
		return docs.map((doc: Document) => {
			let content = doc.pageContent;
			// 克隆 metadata 防止修改原始引用
			const newMetadata = doc.metadata ? { ...doc.metadata } : {};

			// 【核心功能】如果主内容为空，尝试从配置的字段中提取并清理 metadata
			if (!content || content.trim() === '') {
				for (const field of this.textFields) {
					if (typeof newMetadata[field] === 'string' && newMetadata[field].trim() !== '') {
						// 1. 提取内容到主字段
						content = newMetadata[field];
						// 2. 从 metadata 中删除该字段，减少冗余
						delete newMetadata[field];
						break;
					}
				}
			}

			return new Document({
				pageContent: content, 
				metadata: newMetadata,
			});
		});
	}
}

// --- 核心组装函数 ---
export async function buildHybridRetriever(
	ctx: IExecuteFunctions | ISupplyDataFunctions,
	dataIndex: number,         
	rerankerDataIndex: number, 
	textFields: string[]
): Promise<BaseRetriever> {
	
	// 1. 获取 Retrievers 数据
	// @ts-ignore
	const inputData = await ctx.getInputConnectionData('ai_retriever', dataIndex);
	const rawRetrievers = Array.isArray(inputData) ? (inputData as BaseRetriever[]) : [inputData as BaseRetriever];

	if (!rawRetrievers || !rawRetrievers[0]) {
		throw new NodeOperationError(ctx.getNode(), 'Please connect at least one Retriever.');
	}

	// 2. 包装检索器 (只做文本修复，不做来源标记)
	const fixedRetrievers = rawRetrievers.map((r) => {
		return new MetadataFixingRetriever(r, textFields);
	});
	
	// 3. 构建混合检索器 (Ensemble)
	const ensembleRetriever = new EnsembleRetriever({
		retrievers: fixedRetrievers,
		weights: new Array(fixedRetrievers.length).fill(1.0), // 默认等权
	});

	let finalRetriever: BaseRetriever = ensembleRetriever;

	// 4. 获取 Reranker (可选)
	try {
		// @ts-ignore
		const rerankerInput = await ctx.getInputConnectionData('ai_reranker', rerankerDataIndex);
		// 转换为 any 以避免类型依赖
		const reranker = (Array.isArray(rerankerInput) ? rerankerInput[0] : rerankerInput) as any;

		// 安全检查
		if (reranker && typeof reranker.compressDocuments === 'function') {
			finalRetriever = new ContextualCompressionRetriever({
				baseCompressor: reranker,
				baseRetriever: ensembleRetriever,
			});
		}
	} catch (e) {
		// Ignore reranker errors
	}

	return finalRetriever;
}