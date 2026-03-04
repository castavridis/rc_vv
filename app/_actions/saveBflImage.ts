'use server'

import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { slugify } from '../_lib/bflSubjects'

export interface SaveResult {
  success: boolean
  filePath?: string
  error?: string
}

export async function saveBflImage(
  subject: string,
  level: number,
  iteration: number,
  dataUri: string
): Promise<SaveResult> {
  try {
    let buffer: Buffer
    let ext = 'png'

    if (dataUri.startsWith('data:')) {
      // Data URI: data:image/png;base64,...
      const match = dataUri.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!match) {
        console.error(`[BFL Save] Invalid data URI, starts with: ${dataUri.substring(0, 80)}`)
        return { success: false, error: 'Invalid data URI format' }
      }
      ext = match[1]
      buffer = Buffer.from(match[2], 'base64')
    } else if (dataUri.startsWith('http')) {
      const res = await fetch(dataUri)
      if (!res.ok) {
        return { success: false, error: `Failed to download image: HTTP ${res.status}` }
      }
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('png')) ext = 'png'
      else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg'
      else if (contentType.includes('webp')) ext = 'webp'
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      return { success: false, error: 'Unknown image format (not data URI or URL)' }
    }

    const slug = slugify(subject)
    const dir = path.join(process.cwd(), 'generated', 'bfl', slug)
    await mkdir(dir, { recursive: true })

    const timestamp = Date.now()
    const filename = `${slug}_level-${level}_iter-${iteration}_${timestamp}.${ext || 'png'}`
    const filePath = path.join(dir, filename)

    await writeFile(filePath, buffer)

    return { success: true, filePath: path.relative(process.cwd(), filePath) }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
