import http from 'http'
import { IpcChannel } from '@shared/IpcChannel'
import { windowService } from './WindowService'
import { reduxService } from './ReduxService'
import mcpService from './MCPService'
import { nanoid } from '@reduxjs/toolkit'

export class LocalAPIServer {
  private server: http.Server | null = null
  constructor(private port = 1234) {}

  start() {
    if (this.server) return
    this.server = http.createServer(this.handleRequest.bind(this))
    this.server.listen(this.port, '127.0.0.1', () => {
      console.log(`[LocalAPI] listening on port ${this.port}`)
    })
  }

  close() {
    this.server?.close()
    this.server = null
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'text/plain')
      res.end('Method Not Allowed')
      return
    }

    const url = new URL(req.url || '/', `http://localhost:${this.port}`)
    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(chunk as Buffer)
    }
    let body: any = {}
    try {
      const data = Buffer.concat(chunks).toString()
      body = data ? JSON.parse(data) : {}
    } catch {
      res.statusCode = 400
      res.end('Invalid JSON')
      return
    }

    switch (url.pathname) {
      case '/add-mcp-server': {
        const jsonString = body.serverJson || body.server
        if (typeof jsonString === 'string') {
          try {
            const server = JSON.parse(jsonString)
            const win = windowService.getMainWindow()
            win?.webContents.send(IpcChannel.Mcp_AddServer, server)
            await mcpService.initClient(server)
            res.end('ok')
          } catch {
            res.statusCode = 400
            res.end('Invalid serverJson')
          }
        } else {
          res.statusCode = 400
          res.end('Missing serverJson')
        }
        break
      }
      case '/create-agent':
        if (body.agent) {
          await reduxService.dispatch({ type: 'agents/addAgent', payload: body.agent })
          res.end('ok')
        } else {
          res.statusCode = 400
          res.end('Missing agent')
        }
        break
      case '/open-session':
        if (body.assistantId) {
          const topic = {
            id: nanoid(),
            assistantId: body.assistantId,
            name: body.name || 'New Topic',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: []
          }
          await reduxService.dispatch({ type: 'assistants/addTopic', payload: { assistantId: body.assistantId, topic } })
          if (body.question) {
            const message = {
              id: nanoid(),
              assistantId: body.assistantId,
              topicId: topic.id,
              role: 'user',
              content: body.question,
              createdAt: new Date().toISOString(),
              status: 'pending',
              type: 'text',
              blocks: []
            }
            await reduxService.dispatch({ type: 'newMessages/addMessage', payload: { topicId: topic.id, message } })
          }
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ topicId: topic.id }))
        } else {
          res.statusCode = 400
          res.end('Missing assistantId')
        }
        break
      default:
        res.statusCode = 404
        res.end('Not Found')
    }
  }
}

export const localApiServer = new LocalAPIServer()
