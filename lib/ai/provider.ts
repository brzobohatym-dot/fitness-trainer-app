export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiProvider {
  /** Non-streaming chat completion */
  chat(messages: AiMessage[]): Promise<string>
  /** Streaming chat completion — yields text chunks */
  stream(messages: AiMessage[]): AsyncGenerator<string, void, unknown>
}

export function createAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER || 'openai'

  switch (provider) {
    case 'openai': {
      const { OpenAiProvider } = require('./openai') as typeof import('./openai')
      return new OpenAiProvider()
    }
    case 'anthropic': {
      const { AnthropicProvider } = require('./anthropic') as typeof import('./anthropic')
      return new AnthropicProvider()
    }
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}. Use "openai" or "anthropic".`)
  }
}
