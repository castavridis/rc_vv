'use server'

import { parse } from 'node-html-parser'

export interface ScrapeResult {
  meta: { title: string; sourceUrl: string; description?: string }
  images: { src: string; alt?: string; width?: number; height?: number }[]
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  let html: string
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (err) {
    throw new Error(`Failed to fetch URL: ${String(err)}`)
  }

  const root = parse(html)

  // --- Metadata ---
  const getMeta = (property: string): string | undefined =>
    root.querySelector(`meta[property="${property}"]`)?.getAttribute('content') ??
    root.querySelector(`meta[name="${property}"]`)?.getAttribute('content')

  const ogTitle = getMeta('og:title')
  const pageTitle = root.querySelector('title')?.text ?? ''
  const title = ogTitle || pageTitle || new URL(url).hostname
  const description = getMeta('og:description') ?? getMeta('description')

  // --- Images ---
  const seen = new Set<string>()
  const images: ScrapeResult['images'] = []

  const addImage = (
    rawSrc: string,
    alt?: string,
    width?: number,
    height?: number,
  ) => {
    if (!rawSrc) return
    let src: string
    try {
      src = new URL(rawSrc, url).href
    } catch {
      return
    }
    // Skip data URIs and already-seen URLs
    if (src.startsWith('data:') || seen.has(src)) return
    // Skip images that are explicitly flagged as tiny via attributes
    if ((width && width < 100) || (height && height < 100)) return
    seen.add(src)
    images.push({ src, alt, width, height })
  }

  // 1. og:image / twitter:image first
  const ogImage = getMeta('og:image') ?? getMeta('twitter:image')
  if (ogImage) addImage(ogImage)

  // 2. All <img> tags
  for (const img of root.querySelectorAll('img')) {
    const alt = img.getAttribute('alt') ?? undefined
    const widthAttr = img.getAttribute('width')
    const heightAttr = img.getAttribute('height')
    const width = widthAttr ? parseInt(widthAttr, 10) : undefined
    const height = heightAttr ? parseInt(heightAttr, 10) : undefined

    // Pick best src: prefer srcset largest variant, fallback to src
    const srcset = img.getAttribute('srcset')
    let bestSrc = img.getAttribute('src') ?? ''

    if (srcset) {
      // srcset entries: "url 2x" or "url 800w"
      const entries = srcset
        .split(',')
        .map((e) => e.trim().split(/\s+/))
        .filter((e) => e.length >= 1)

      // Sort by descriptor: prefer largest width descriptor
      const withDescriptor = entries.map(([s, d]) => ({
        src: s,
        w: d?.endsWith('w') ? parseInt(d, 10) : 0,
        x: d?.endsWith('x') ? parseFloat(d) : 0,
      }))
      withDescriptor.sort((a, b) => (b.w || b.x) - (a.w || a.x))
      if (withDescriptor[0]?.src) bestSrc = withDescriptor[0].src
    }

    addImage(bestSrc, alt, width, height)
  }

  return {
    meta: { title: title.trim(), sourceUrl: url, description },
    images,
  }
}
