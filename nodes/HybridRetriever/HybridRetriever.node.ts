import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, ISupplyDataFunctions, SupplyData } from 'n8n-workflow';
import { buildHybridRetriever } from './utils';

export class HybridRetriever implements INodeType {
	// ... (description 保持不变) ...
    description: INodeTypeDescription = {
		displayName: 'Hybrid Retriever (Object)',
		name: 'hybridRetriever',
		icon: 'file:../../icons/hybrid.png',
		group: ['transform'],
		version: 1,
		description: 'Builds a Hybrid Retriever object for AI Agents.',
		defaults: { name: 'Hybrid Retriever' },
		inputs: [
			// @ts-ignore
			{ displayName: 'Retrievers', name: 'retrievers', type: 'ai_retriever', required: true },
			// @ts-ignore
			{ displayName: 'Rerank Model', type: 'ai_reranker', required: false,maxConnections: 1 },
		],
		outputs: [
			// @ts-ignore
			{ displayName: 'Retriever Object', type: 'ai_retriever' },
		],
		properties: [
			{
				displayName: 'Text Field Mapping',
				name: 'textFields',
				type: 'string',
				default: 'text, page_content, body, content',
				description: 'Comma-separated list of metadata fields to use as page content.',
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions): Promise<SupplyData> {
		const textFieldsStr = this.getNodeParameter('textFields', 0) as string;
		const textFields = textFieldsStr.split(',').map(s => s.trim()).filter(s => s);
		return { response: await buildHybridRetriever(this, 0, 0, textFields) };
	}

    // 【核心修复】添加 execute 方法
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return [[{
			json: {
				message: "✅ Retriever Object Configured.",
				hint: "This node outputs a Retriever Object. Please connect it to a Chain or Agent."
			}
		}]];
	}
}