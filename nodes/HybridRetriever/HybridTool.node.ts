import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { createRetrieverTool } from 'langchain/tools/retriever';
import { Document } from '@langchain/core/documents';
import { buildHybridRetriever } from './utils';

export class HybridTool implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hybrid Retriever Tool',
		name: 'hybridTool',
		icon: 'file:../../icons/hybrid.png',
		group: ['transform'],
		version: 1,
		description: 'Wraps the Hybrid Retriever as a Tool for AI Agents.',
		defaults: { name: 'Hybrid Tool' },
		inputs: [
			// @ts-ignore
			{ displayName: 'Retrievers', name: 'retrievers', type: 'ai_retriever', required: true },
			// @ts-ignore
			{ displayName: 'Rerank Model', type: 'ai_reranker', required: false,maxConnections: 1 },
		],
		outputs: [
			// @ts-ignore
			{ displayName: 'Tool', type: 'ai_tool' },
		],
		properties: [
			{
				displayName: 'Tool Name',
				name: 'toolName',
				type: 'string',
				default: 'knowledge_base',
				required: true,
				description: 'Name of the tool. Must be unique within the agent. Use underscores instead of spaces.',
				validateType: 'string-alphanumeric',
			},
			{
				displayName: 'Tool Description',
				name: 'toolDescription',
				type: 'string',
				default: 'Useful for searching information about...',
				required: true,
				typeOptions: {
					rows: 3,
				},
				description: 'Description of what this tool does. The AI Agent uses this to decide when to use the tool.',
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

	// 场景 1: AI Agent 初始化工具时调用 (标准方式)
	async supplyData(this: ISupplyDataFunctions): Promise<SupplyData> {
		const toolName = this.getNodeParameter('toolName', 0) as string;
		const toolDescription = this.getNodeParameter('toolDescription', 0) as string;
		const textFieldsStr = this.getNodeParameter('textFields', 0) as string;
		const textFields = textFieldsStr.split(',').map(s => s.trim()).filter(s => s);

		const retriever = await buildHybridRetriever(this, 0, 0, textFields);

		const tool = createRetrieverTool(retriever, {
			name: toolName,
			description: toolDescription,
		});

		return {
			response: tool,
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// 1. 获取输入数据
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		
		const textFieldsStr = this.getNodeParameter('textFields', 0) as string;
		const textFields = textFieldsStr.split(',').map(s => s.trim()).filter(s => s);

		// 构建检索器
		const retriever = await buildHybridRetriever(this, 0, 0, textFields);

		// 2. 遍历每一条输入数据
		for (let i = 0; i < items.length; i++) {
			const itemJson = items[i].json;
			
			const query = (itemJson.query as string) || (itemJson.chatInput as string) || '';

			if (!query) {
				continue;
			}

			try {
				// 执行检索
				const docs = await retriever.invoke(query);

				// 格式化输出
				const docItems = docs.map((doc: Document) => ({
					json: {
						pageContent: doc.pageContent,
						metadata: doc.metadata,
						// 把输入中的 toolCallId 带回去 (如果存在)，方便后续合并
						_toolCallId: itemJson.toolCallId, 
						_query: query 
					},
				}));
				
				returnData.push(...docItems);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}