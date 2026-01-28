/**
 * AI API 客户端 - 支持多个 API 提供商的自动切换
 * 优先使用 VectorEngine，失败时自动切换到 OpenRouter
 */

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIRequestOptions {
  messages: Message[];
  stream?: boolean;
  model?: string;
  preferredProvider?: 'Cloudsway' | 'VectorEngine' | 'OpenRouter';
}

interface AIProvider {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  headers: Record<string, string>;
  authHeaders?: Record<string, string>;
}

function getProviders(preferredProvider?: AIRequestOptions['preferredProvider']): AIProvider[] {
  const providers: AIProvider[] = [];

  // 优先使用 Cloudsway
  if (process.env.CLOUDSWAY_API_KEY) {
    providers.push({
      name: 'Cloudsway',
      baseUrl: process.env.CLOUDSWAY_BASE_URL || 'https://genaiapi.cloudsway.net/v1/ai/GMLRiwsNjqSYwmBE/chat/completions',
      model: process.env.CLOUDSWAY_MODEL || 'MaaS_Sonnet_4',
      headers: {
        'Content-Type': 'application/json',
      },
      authHeaders: {
        'Authorization': `Bearer ${process.env.CLOUDSWAY_API_KEY}`,
      },
    });
  }

  // 其次使用 VectorEngine
  if (process.env.VECTORENGINE_API_KEY) {
    providers.push({
      name: 'VectorEngine',
      baseUrl: 'https://api.vectorengine.ai/v1/chat/completions',
      apiKey: process.env.VECTORENGINE_API_KEY,
      model: 'claude-sonnet-4-5-20250929',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // OpenRouter 作为备用
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: 'anthropic/claude-3.5-sonnet',
      headers: {
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'ProductThink',
      },
    });
  }

  if (preferredProvider) {
    return providers
      .filter(p => p.name === preferredProvider)
      .concat(providers.filter(p => p.name !== preferredProvider));
  }

  return providers;
}

export async function createAICompletion(options: AIRequestOptions): Promise<{
  response: Response;
  provider: string;
}> {
  const providers = getProviders(options.preferredProvider);

  if (providers.length === 0) {
    throw new Error('No AI API key configured');
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`[AI Client] Trying ${provider.name}...`);

      const requestHeaders: Record<string, string> = {
        ...provider.headers,
      };
      if (provider.apiKey) {
        requestHeaders['Authorization'] = `Bearer ${provider.apiKey}`;
      }
      if (provider.authHeaders) {
        Object.assign(requestHeaders, provider.authHeaders);
      }

      const response = await fetch(provider.baseUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          model: options.model || provider.model,
          messages: options.messages,
          stream: options.stream ?? true,
        }),
      });

      if (response.ok) {
        console.log(`[AI Client] ${provider.name} succeeded`);
        return { response, provider: provider.name };
      }

      // 如果响应不成功，记录错误并尝试下一个提供商
      const errorBody = await response.text();
      console.error(`[AI Client] ${provider.name} failed with status ${response.status}:`, errorBody);
      lastError = new Error(`${provider.name} API error: ${response.status}`);
    } catch (error) {
      console.error(`[AI Client] ${provider.name} request failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('All AI providers failed');
}

// 非流式请求的便捷方法
export async function createAICompletionJson(options: Omit<AIRequestOptions, 'stream'>): Promise<{
  content: string;
  provider: string;
}> {
  const { response, provider } = await createAICompletion({
    ...options,
    stream: false,
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return { content, provider };
}

export function getActiveProviders(): string[] {
  return getProviders().map(p => p.name);
}
