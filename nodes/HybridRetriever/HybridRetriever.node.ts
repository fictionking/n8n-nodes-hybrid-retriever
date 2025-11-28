import { INodeType, INodeTypeDescription, ISupplyDataFunctions, SupplyData } from 'n8n-workflow';
import { buildHybridRetriever } from './utils';

export class HybridRetriever implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hybrid Retriever',
		name: 'hybridRetriever',
		icon: 'file:../../icons/hybrid.png',
		group: ['transform'],
		version: 1,
		description: 'Builds a Hybrid Retriever object for AI Agents.',
		defaults: { name: 'Hybrid Retriever' },
		inputs: [
			// @ts-ignore
			{ displayName: 'Retrievers', type: 'ai_retriever', required: true },
			// @ts-ignore
			{ displayName: 'Rerank Model', type: 'ai_reranker', required: false },
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

		// dataIndex=0, rerankerIndex=0
		return { response: await buildHybridRetriever(this, 0, 0, textFields) };
	}
}