export async function callOpenRouter(model: string, messages: unknown[], maxTokens?: number): Promise<string> {
  const body: Record<string, unknown> = { model, messages }
  if (maxTokens !== undefined) body.max_tokens = maxTokens

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${text}`)
  }

  const data = await res.json()
  const message = data.choices?.[0]?.message
  let content = message?.content

  // Some reasoning models return content as an array of blocks
  if (Array.isArray(content)) {
    content = content
      .filter((b: { type: string; text?: string }) => b.type === 'text' && typeof b.text === 'string')
      .map((b: { text: string }) => b.text)
      .join('')
  }

  // Some reasoning models return null content with a reasoning field
  if ((content == null || content === '') && typeof message?.reasoning === 'string') {
    content = message.reasoning
  }

  if (typeof content !== 'string' || content === '') {
    console.error('[openrouter] unexpected response shape for model', model, JSON.stringify(data?.choices?.[0]))
    throw new Error(`No text content in response (content=${JSON.stringify(content)})`)
  }
  return content
}
