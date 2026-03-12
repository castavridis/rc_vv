import { promises as fs } from 'fs'
import path from 'path'
import supabase from '../_actions/supabase'
import { cosineSimilarity } from './artwork-similarity'
import { dimensionCosineSimilarity, type DimensionVector } from './dimension-similarity'
import { computeDimensionScores, type DimensionScores } from './dimensionScores'
import { type TraitScoreMap } from './taste-profile'
import { BRAND_PERSONALITY, DIMENSIONS, type Dimension, type Trait } from './brand'

export interface SimilarSession {
  id: string
  title: string
  autoTitle: string
  createdAt: string
  thumbnailUrl: string | null
  similarity: number
  reason: string
}

export interface SimilarBrand {
  brand: string
  industry: string
  scores: Record<string, number>
  imageFile: string | null
  similarity: number
  reason: string
}

export interface SimilarArtwork {
  artworkId: string
  imageUrl: string | null
  title: string | null
  similarity: number
  reason: string
}

export interface SimilarItemsResult {
  sessions: SimilarSession[]
  brands: SimilarBrand[]
  artworks: SimilarArtwork[]
}

const TOP_N = 6

/** Given two trait-level profiles, find the top shared dimensions driving similarity */
function explainTraitSimilarity(a: TraitScoreMap, b: TraitScoreMap): string {
  // Score each dimension by the sum of products of matching trait scores
  const dimStrength: { dim: Dimension; strength: number }[] = []
  for (const dim of DIMENSIONS) {
    const facets = BRAND_PERSONALITY[dim]
    let strength = 0
    for (const traits of Object.values(facets)) {
      for (const t of traits!) {
        strength += (a[t] ?? 0) * (b[t] ?? 0)
      }
    }
    dimStrength.push({ dim, strength })
  }
  dimStrength.sort((a, b) => b.strength - a.strength)
  const top = dimStrength.filter(d => d.strength > 0).slice(0, 2)
  if (top.length === 0) return 'Weak overlap across all dimensions'
  return `Both strong in ${top.map(d => d.dim).join(' and ')}`
}

/** Given two dimension-level score vectors, find the top shared dimensions */
function explainDimensionSimilarity(a: DimensionScores, b: Record<string, number>): string {
  const dimStrength = DIMENSIONS.map(d => ({
    dim: d,
    strength: (a[d] ?? 0) * (b[d] ?? 0),
  }))
  dimStrength.sort((a, b) => b.strength - a.strength)
  const top = dimStrength.filter(d => d.strength > 0).slice(0, 2)
  if (top.length === 0) return 'Weak overlap across all dimensions'
  return `Both strong in ${top.map(d => d.dim).join(' and ')}`
}

export async function findSimilarItems(
  sessionId: string,
  userId: string,
  traits: TraitScoreMap,
  dimensionScores: DimensionScores,
): Promise<SimilarItemsResult> {
  const [sessions, brands, artworks] = await Promise.all([
    findSimilarSessions(sessionId, userId, traits),
    findSimilarBrands(dimensionScores),
    findSimilarArtworks(userId, traits),
  ])
  return { sessions, brands, artworks }
}

async function findSimilarSessions(
  sessionId: string,
  userId: string,
  refTraits: TraitScoreMap,
): Promise<SimilarSession[]> {
  // Get all other sessions for this user
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, title, auto_title, created_at')
    .eq('user_id', userId)
    .neq('id', sessionId)

  if (!sessions || sessions.length === 0) return []

  // Get trait profiles for all those sessions
  const sessionIds = sessions.map(s => s.id)
  const { data: allTraits } = await supabase
    .from('trait_profiles')
    .select('session_id, trait, score')
    .in('session_id', sessionIds)

  if (!allTraits || allTraits.length === 0) return []

  // Group traits by session
  const traitsBySession: Record<string, Record<string, number>> = {}
  for (const row of allTraits) {
    if (!traitsBySession[row.session_id]) traitsBySession[row.session_id] = {}
    traitsBySession[row.session_id][row.trait] = row.score
  }

  // Get latest composition thumbnail per session
  const { data: compositions } = await supabase
    .from('compositions')
    .select('session_id, thumbnail_url')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: false })

  const thumbBySession: Record<string, string> = {}
  if (compositions) {
    for (const c of compositions) {
      if (!thumbBySession[c.session_id] && c.thumbnail_url) {
        thumbBySession[c.session_id] = c.thumbnail_url
      }
    }
  }

  // Rank by similarity
  const ranked: SimilarSession[] = []
  for (const s of sessions) {
    const sTraits = traitsBySession[s.id]
    if (!sTraits) continue
    const similarity = cosineSimilarity(refTraits, sTraits as TraitScoreMap)
    const reason = explainTraitSimilarity(refTraits, sTraits as TraitScoreMap)
    ranked.push({
      id: s.id,
      title: s.title,
      autoTitle: s.auto_title,
      createdAt: s.created_at,
      thumbnailUrl: thumbBySession[s.id] ?? null,
      similarity,
      reason,
    })
  }

  return ranked.sort((a, b) => b.similarity - a.similarity).slice(0, TOP_N)
}

async function findSimilarBrands(
  refScores: DimensionScores,
): Promise<SimilarBrand[]> {
  const csvPath = path.join(process.cwd(), 'data/brand-rankings/brand_personality_5pt_scale.csv')
  const imgDir = path.join(process.cwd(), 'data/reference-images')

  let csv: string
  try {
    csv = await fs.readFile(csvPath, 'utf-8')
  } catch {
    return []
  }

  const lines = csv.trim().split('\n')
  const header = lines[0].split(',')
  const dimCols = header.slice(2)

  // Build image lookup
  let imgMap = new Map<string, string>()
  try {
    const imgFiles = await fs.readdir(imgDir)
    for (const f of imgFiles) {
      const name = f.replace(/\.(png|jpg|jpeg|svg|webp)$/i, '').toLowerCase()
      imgMap.set(name, f)
    }
  } catch {
    // no images dir
  }

  const ranked: SimilarBrand[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length < header.length) continue
    const brand = cols[0]
    const industry = cols[1]
    const scores: Record<string, number> = {}
    for (let j = 0; j < dimCols.length; j++) {
      scores[dimCols[j]] = parseFloat(cols[j + 2]) || 0
    }

    const brandVec = Object.fromEntries(
      DIMENSIONS.map(d => [d, scores[d] ?? 0])
    ) as DimensionVector

    const similarity = dimensionCosineSimilarity(refScores, brandVec)

    const slug = brand.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9&+-]/g, '')
    const imageFile = imgMap.get(slug) ?? imgMap.get(brand.toLowerCase().replace(/\s+/g, '-')) ?? null

    const reason = explainDimensionSimilarity(refScores, scores)
    ranked.push({ brand, industry, scores, imageFile, similarity, reason })
  }

  return ranked.sort((a, b) => b.similarity - a.similarity).slice(0, TOP_N)
}

async function findSimilarArtworks(
  userId: string,
  refTraits: TraitScoreMap,
): Promise<SimilarArtwork[]> {
  // Get user's rated artworks
  const { data: ratings } = await supabase
    .from('artwork_ratings')
    .select('artwork_id, trait, score')
    .eq('user_id', userId)

  if (!ratings || ratings.length === 0) return []

  // Group ratings by artwork → trait profile
  const byArtwork: Record<string, Record<string, number>> = {}
  for (const r of ratings) {
    if (!byArtwork[r.artwork_id]) byArtwork[r.artwork_id] = {}
    byArtwork[r.artwork_id][r.trait] = r.score
  }

  // Get artwork metadata
  const artworkIds = Object.keys(byArtwork)
  const { data: artworks } = await supabase
    .from('artworks')
    .select('id, image_url, title')
    .in('id', artworkIds)

  const artworkMap: Record<string, { imageUrl: string | null; title: string | null }> = {}
  if (artworks) {
    for (const a of artworks) {
      artworkMap[a.id] = { imageUrl: a.image_url, title: a.title }
    }
  }

  // Rank by similarity
  const ranked: SimilarArtwork[] = []
  for (const [artworkId, profile] of Object.entries(byArtwork)) {
    const similarity = cosineSimilarity(refTraits, profile as TraitScoreMap)
    const reason = explainTraitSimilarity(refTraits, profile as TraitScoreMap)
    const meta = artworkMap[artworkId]
    ranked.push({
      artworkId,
      imageUrl: meta?.imageUrl ?? null,
      title: meta?.title ?? null,
      similarity,
      reason,
    })
  }

  return ranked.sort((a, b) => b.similarity - a.similarity).slice(0, TOP_N)
}
