import { OpenRouter } from '@openrouter/sdk'

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const completion = await openRouter.chat.send({
  model: 'minimax/minimax-m1',
  messages: [
    {
      role: 'user',
      content: 'What is the meaning of life?',
    }
  ],
  stream: false,
})

export default function Page() {
  return (
    <div>
      <h1>Hello!</h1>
      <p>Here is OpenRouter's response:</p>
      <p>{ JSON.stringify(completion.choices[0]) }</p>
    </div>
  )
}
