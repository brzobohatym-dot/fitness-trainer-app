import type { AiProvider, AiMessage } from './provider'

export class OpenAiProvider implements AiProvider {
  private getClient() {
    const OpenAI = require('openai').default
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  private get model() {
    return process.env.OPENAI_MODEL || 'gpt-4o-mini'
  }

  async chat(messages: AiMessage[]): Promise<string> {
    const client = this.getClient()
    const response = await client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })
    return response.choices[0]?.message?.content || ''
  }

  async *stream(messages: AiMessage[]): AsyncGenerator<string, void, unknown> {
    const client = this.getClient()
    const response = await client.chat.completions.create({
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    })

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
}
