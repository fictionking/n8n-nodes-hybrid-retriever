import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { Document } from '@langchain/core/documents';
import { buildHybridRetriever } from './utils';

export class HybridSearch implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hybrid Search',
		name: 'hybridSearch',
		icon: 'file:../../icons/hybrid.png',
		group: ['transform'],
		version: 1,
		description: 'Executes a Hybrid Search and returns documents.',
		defaults: { name: 'Hybrid Search' },
		inputs: [
			{ displayName: 'Main', type: 'main' },
			// @ts-ignore
			{ displayName: 'Retrievers', type: 'ai_retriever', required: true },
			// @ts-ignore
			{ displayName: 'Rerank Model', type: 'ai_reranker', required: false,maxConnections: 1 },
		],
		outputs: [
			{ displayName: 'Documents', type: 'main' },
		],
		properties: [
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				required: true,
				description: 'The text to search for',
			},
			{
				displayName: 'Text Field Mapping',
				name: 'textFields',
				type: 'string',
				default: 'text, page_content, body, content',
				description: 'Comma-separated list of metadata fields to use as page content.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const query = this.getNodeParameter('query', 0) as string;
		
		const textFieldsStr = this.getNodeParameter('textFields', 0) as string;
		const textFields = textFieldsStr.split(',').map(s => s.trim()).filter(s => s);
		
		// dataIndex=0, rerankerIndex=0 (因为 Main 不算在 ai_xxx 类型索引里)
		const retriever = await buildHybridRetriever(this, 0, 0, textFields);
		
		const docs = await retriever.invoke(query);

		return [docs.map((doc: Document) => ({
			json: {
				pageContent: doc.pageContent,
				metadata: doc.metadata,
			},
		}))];
	}
}