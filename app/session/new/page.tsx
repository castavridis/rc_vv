import { redirect } from 'next/navigation'
import { getUser } from '../../_lib/auth/session'
import InputForm from '../../_components/InputForm'

export default async function NewSessionPage() {
  const user = await getUser()
  if (!user) redirect('/')

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-2xl font-bold font-mono mb-2">New Session</h1>
      <p className="text-sm text-zinc-500 mb-10">
        Submit a text description or image. VV will assess it against Aaker&apos;s 42 brand personality traits.
      </p>
      <InputForm />
    </div>
  )
}
