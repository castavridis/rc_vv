export async function callOpenRouter(model: string, messages: unknown[]): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${text}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw new Error('No text content in response')
  return content
}
