# 本地 API 使用文档

本文档介绍如何通过本地 1234 端口提供的 API 与 Cherry Studio 进行交互。该 API 仅接受 `POST` 请求，允许本地第三方软件通过接口执行以下操作：

- 添加 MCP 服务器
- 创建新的智能体（Agent）
- 创建会话并向默认模型发送问题，支持上传文档或图片

## 基本信息

- **地址**：`http://127.0.0.1:1234`
- **请求方式**：仅支持 `POST`
- **请求头**：`Content-Type: application/json`

每个接口均以 JSON 形式接收和返回数据。出现错误时，接口将返回相应的 HTTP 状态码和错误信息。

## 接口列表

### 1. `/add-mcp-server`

以导入 JSON 的方式添加并立即运行 MCP 服务器。请求体需要提供字符串形式的 `serverJson` 字段。

请求参数示例：

```json
{
  "serverJson": "{ \"name\": \"MCP 本地服务\", \"type\": \"stdio\", \"command\": \"node\", \"args\": [\"server.js\"], \"isActive\": true }"
}
```

成功时返回 `200 OK`，响应体为 `ok`。

示例 `curl` 调用：

```bash
curl -X POST http://127.0.0.1:1234/add-mcp-server \
  -H "Content-Type: application/json" \
  -d '{"serverJson":"{ \"name\": \"MCP 本地服务\", \"type\": \"stdio\", \"command\": \"node\", \"args\": [\"server.js\"], \"isActive\": true }"}'
```

### 2. `/create-agent`

创建新的智能体。

请求参数示例：

```json
{
  "agent": {
    "id": "agent1",
    "name": "助手A",
    "model": "gpt-3.5-turbo"
  }
}
```

成功时返回 `200 OK`，响应体为 `ok`。

### 3. `/open-session`

根据指定的智能体创建会话，并可附带初始化问题。支持上传文档或图片。

请求参数示例：

```json
{
  "assistantId": "agent1",
  "name": "我的会话",
  "question": "你好，帮我总结一下这个文档",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "<base64>"
    }
  ]
}
```

返回示例：

```json
{
  "topicId": "<新会话ID>"
}
```

其中 `attachments` 字段为可选，可以包含多个对象，`content` 应为文件的 Base64 编码。图片也以同样方式上传。

## 错误码

- `400 Bad Request`：请求参数错误或缺失。
- `404 Not Found`：接口路径不存在。
- `405 Method Not Allowed`：请求方法不是 `POST`。

## 调试建议

1. 使用 `curl` 或其他 HTTP 客户端工具发送请求。
2. 确保请求体为合法的 JSON 格式。
3. 服务启动成功后会在控制台输出 `"[LocalAPI] listening on port 1234"`。

更多自定义需求可根据实际情况扩展接口。欢迎提交改进建议。

