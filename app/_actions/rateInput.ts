'use server'

import { OpenRouter } from '@openrouter/sdk'

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

export default async function rateInput(text: string, type: 'image' | 'text') {
  const preset = type ? 'brand-rater' : 'text-rater'
  const completion = await openRouter.chat.send({
    model: `qwen/qwen3-vl-235b-a22b-instruct@preset/${preset}`,
    messages: [
      {
        role: 'user',
        content: text,
      }
    ],
    stream: false,
  })
  return completion.choices[0]
}