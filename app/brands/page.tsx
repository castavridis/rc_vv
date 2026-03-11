import { redirect } from 'next/navigation'
import { getUser } from '../_lib/auth/session'
import { promises as fs } from 'fs'
import path from 'path'
import BrandGrid from './BrandGrid'

interface BrandData {
  brand: string
  industry: string
  scores: Record<string, number>
  imageFile: string | null
}

export default async function BrandsPage() {
  const user = await getUser()
  if (!user) redirect('/')

  const csvPath = path.join(process.cwd(), 'data/brand-rankings/brand_personality_5pt_scale.csv')
  const imgDir = path.join(process.cwd(), 'data/reference-images')

  let brands: BrandData[] = []

  try {
    const csv = await fs.readFile(csvPath, 'utf-8')
    const lines = csv.trim().split('\n')
    const header = lines[0].split(',')
    // header: Brand,Industry,Competence,Sincerity,Excitement,Sophistication,Ruggedness
    const dimCols = header.slice(2)

    // Get available image files
    const imgFiles = await fs.readdir(imgDir)
    const imgMap = new Map<string, string>()
    for (const f of imgFiles) {
      const name = f.replace(/\.(png|jpg|jpeg|svg|webp)$/i, '').toLowerCase()
      imgMap.set(name, f)
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols.length < header.length) continue
      const brand = cols[0]
      const industry = cols[1]
      const scores: Record<string, number> = {}
      for (let j = 0; j < dimCols.length; j++) {
        scores[dimCols[j]] = parseFloat(cols[j + 2]) || 0
      }

      // Match image file by lowercased brand name
      const slug = brand.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9&+-]/g, '')
      const imageFile = imgMap.get(slug) ?? imgMap.get(brand.toLowerCase().replace(/\s+/g, '-')) ?? null

      brands.push({ brand, industry, scores, imageFile })
    }
  } catch (e) {
    console.error('[BrandsPage] Failed to load CSV:', e)
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-lg font-mono font-semibold text-zinc-800">Brand Personality Rankings</h1>
        <p className="text-xs font-mono text-zinc-400 mt-1">
          {brands.length} brands · Aaker 5-dimension model · scores 1–5
        </p>
      </div>

      <BrandGrid brands={brands} />
    </div>
  )
}
