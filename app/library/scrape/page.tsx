import { redirect } from 'next/navigation'
import { getUser } from '../../_lib/auth/session'
import ScrapeClient from '../../_components/ScrapeClient'

export default async function ScrapePage() {
  const user = await getUser()
  if (!user) redirect('/')

  return <ScrapeClient />
}
