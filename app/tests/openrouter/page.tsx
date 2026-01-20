import { OpenRouter } from '@openrouter/sdk'

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const completion = await openRouter.chat.send({
  model: 'qwen3-vl-235b-a22b-instruct',
  messages: [
    {
      role: 'user',
      content: 'What is the meaning of life?',
    }
  ],
  stream: false,
})

export default function OpenRouterPage() {
  return (
    <div>
      <h1>Here is OpenRouter's response:</h1>
      <p>{ JSON.stringify(completion.choices[0]) }</p>
    </div>
  )
}
