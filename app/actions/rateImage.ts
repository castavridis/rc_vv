'use server'

import { OpenRouter } from '@openrouter/sdk'

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

export default async function rateImage(imgUrl: string) {
  const completion = await openRouter.chat.send({
    model: 'qwen/qwen3-vl-235b-a22b-instruct@preset/brand-rater',
    messages: [
      {
        role: 'user',
        content: imgUrl,
      }
    ],
    stream: false,
  })
  return completion.choices[0]
}