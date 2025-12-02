# n8n-nodes-hybrid-retriever

这个 n8n 社区节点包提供了混合检索器功能，允许你组合多个检索器并优化文档检索过程。

## 功能特性

- **多检索器集成**：将多个检索器（如向量检索器、关键词检索器）合并为一个统一的混合检索器
- **可选的重排序**：支持连接重排序模型以进一步优化检索结果
- **元数据文本提取**：自动从文档元数据中提取文本内容，确保检索质量
- **灵活的字段映射**：可配置从哪些元数据字段提取文本内容
- **三种使用模式**：
  - 直接执行搜索并返回文档（Hybrid Search 节点）
  - 创建检索器对象供后续节点使用（Hybrid Retriever 节点）
  - 创建 AI Agent 工具，将混合检索功能集成到 AI 代理工作流中（Hybrid Retriever Tool 节点）

## 包含的节点

### 1. Hybrid Search

**功能**：直接执行混合搜索并返回检索到的文档。

**输入**：
- Main 输入：包含查询数据
- Retrievers 输入：连接一个或多个检索器节点
- Rerank Model 输入（可选）：连接重排序模型节点

**参数**：
- Query：搜索查询文本
- Text Field Mapping：用于从元数据提取文本的字段列表（逗号分隔）

**输出**：
- Documents 输出：检索到的文档列表，每个文档包含 pageContent 和 metadata

### 2. Hybrid Retriever

**功能**：创建一个混合检索器对象，可用于AI节点的Retrieve输入。

**输入**：
- Retrievers 输入：连接一个或多个检索器节点
- Rerank Model 输入（可选）：连接重排序模型节点

**参数**：
- Text Field Mapping：用于从元数据提取文本的字段列表（逗号分隔）

**输出**：
- Retriever Object 输出：创建的混合检索器对象

### 3. Hybrid Retriever Tool

**功能**：将混合检索器包装为 AI Agent 工具，使 AI 代理能够使用混合检索功能。

**输入**：
- Retrievers 输入：连接一个或多个检索器节点
- Rerank Model 输入（可选）：连接重排序模型节点

**参数**：
- Tool Name：工具名称，在代理中必须唯一，使用下划线代替空格
- Tool Description：工具描述，AI 代理使用此描述决定何时使用该工具
- Text Field Mapping：用于从元数据提取文本的字段列表（逗号分隔）

**输出**：
- Tool 输出：创建的 AI 工具对象，可连接到 AI Agent 节点

## 核心工作原理

该节点包的核心功能是构建混合检索系统，主要包括以下步骤：

1. **检索器集成**：使用 `EnsembleRetriever` 将多个检索器合并，默认采用等权重策略
2. **元数据处理**：通过 `MetadataFixingRetriever` 自动从元数据中提取文本内容
3. **重排序优化**：可选地使用 `ContextualCompressionRetriever` 应用重排序模型

### 元数据文本提取功能

当文档的主内容（pageContent）为空时，系统会自动尝试从配置的元数据字段中提取文本，并将其作为主内容。这解决了某些检索器返回空内容文档的问题。

## 安装

### 方法 1：直接安装（推荐）

在 n8n 中，转到 "Settings > Community Nodes"，搜索并安装 `@fictionking/n8n-nodes-hybrid-retriever` 包。

### 方法 2：手动安装

1. 克隆此仓库
```bash
git clone https://github.com/fictionking/n8n-nodes-hybrid-retriever.git
cd n8n-nodes-hybrid-retriever
```

2. 安装依赖
```bash
npm install
```

3. 构建项目
```bash
npm run build
```

4. 链接到 n8n
```bash
npm link
```

5. 在 n8n 中启用开发模式
```bash
n8n start --dev
```

## 使用示例

### 示例 1：直接搜索

1. 添加一个或多个检索器节点（如向量数据库检索器）
2. 添加 Hybrid Search 节点
3. 连接检索器节点到 Hybrid Search 节点的 Retrievers 输入
4. 设置查询文本和字段映射
5. 执行工作流，获取检索结果

### 示例 2：创建检索器对象

1. 添加一个或多个检索器节点
2. 添加一个可选的重排序节点
3. 添加 Hybrid Retriever 节点
4. 连接检索器和重排序节点
5. 将 Hybrid Retriever 的输出连接到使用检索器的节点（如 AI Agent）

### 示例 3：创建 AI Agent 工具

1. 添加一个或多个检索器节点
2. 添加一个可选的重排序节点
3. 添加 Hybrid Retriever Tool 节点
4. 配置工具名称和描述
5. 连接检索器和重排序节点
6. 将 Hybrid Retriever Tool 的输出连接到 AI Agent 节点的 Tools 输入端口
7. AI 代理将能够根据需要使用该工具进行知识检索

## 配置字段说明

### Text Field Mapping

这个配置允许你指定从哪些元数据字段中提取文本内容。默认值为 `"text, page_content, body, content"`，表示按此顺序尝试从这些字段中提取文本。

你可以根据你的文档结构自定义这个列表，使用逗号分隔不同的字段名。

## 开发

如果你想为此项目做贡献或修改代码：

1. 启动开发模式
```bash
npm run dev
```

2. 代码检查
```bash
npm run lint
```

3. 自动修复代码问题
```bash
npm run lint:fix
```

## 技术栈

- TypeScript
- n8n-workflow
- langchain

## License

[MIT](LICENSE.md)
