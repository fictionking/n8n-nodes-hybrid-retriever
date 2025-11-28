/**
 * n8n-nodes-hybrid-retriever
 * 
 * Advanced Hybrid Retriever node for n8n with Rerank support and Metadata passthrough
 * This package provides nodes to create hybrid search systems combining multiple retrievers.
 * 
 * @module n8n-nodes-hybrid-retriever
 */

// 导出节点配置，采用简洁的实现风格
module.exports = {
  // 导出节点
  nodes: [
    // Hybrid Retriever 节点
    require('./dist/nodes/HybridRetriever/HybridRetriever.node.js'),
    // Hybrid Search 节点
    require('./dist/nodes/HybridRetriever/HybridSearch.node.js'),
  ],
  // 从package.json动态获取版本号，避免硬编码
  version: require('./package.json').version,
};

// 为了保持兼容性，额外导出节点类
const HybridRetrieverNode = require('./dist/nodes/HybridRetriever/HybridRetriever.node.js');
const HybridSearchNode = require('./dist/nodes/HybridRetriever/HybridSearch.node.js');

// 兼容旧版n8n的直接节点类访问
module.exports.HybridRetriever = HybridRetrieverNode.HybridRetriever;
module.exports.HybridSearch = HybridSearchNode.HybridSearch;

