import type { AiProvider, AiMessage } from './provider'

export class AnthropicProvider implements AiProvider {
  private getClient() {
    const Anthropic = require('@anthropic-ai/sdk').default
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  private get model() {
    return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929'
  }

  async chat(messages: AiMessage[]): Promise<string> {
    const client = this.getClient()
    const systemMessage = messages.find(m => m.role === 'system')
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemMessage?.content || '',
      messages: chatMessages,
    })

    return response.content[0]?.type === 'text' ? response.content[0].text : ''
  }

  async *stream(messages: AiMessage[]): AsyncGenerator<string, void, unknown> {
    const client = this.getClient()
    const systemMessage = messages.find(m => m.role === 'system')
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const stream = client.messages.stream({
      model: this.model,
      max_tokens: 2048,
      system: systemMessage?.content || '',
      messages: chatMessages,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  }
}
