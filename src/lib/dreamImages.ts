import { useEffect, useState } from 'react'
import type { DreamInput } from '../types/dream'
import { friendlyError } from './errors'
import { supabase } from './supabaseClient'

// Pictures attached to dreams, in the private dream-images bucket (supabase/schema.sql). Each
// user writes only under their own folder; a picture can be seen by whoever can see its dream.

const BUCKET = 'dream-images'
/** Mirrors the bucket's file_size_limit in schema.sql. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
// Pictures are scaled down to this before uploading: plenty for a page, and quick on phones.
const MAX_SIDE = 1600
// Signed links last an hour; they're renewed a few minutes before they run out.
const LINK_SECONDS = 60 * 60
const RENEW_MS = 5 * 60 * 1000

/**
 * The picked file scaled down to at most MAX_SIDE pixels and re-encoded (WebP where the browser
 * can, else JPEG), so a 3 MB PNG from an image generator uploads as a few hundred KB.
 */
export async function prepareImage(file: File): Promise<{ blob: Blob | null; error: string | null }> {
  if (!file.type.startsWith('image/')) return { blob: null, error: 'Choose an image file.' }
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { blob: null, error: 'That image couldn’t be opened. Try a JPEG, PNG or WebP.' }
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85))
  // Safari can't encode WebP and hands back a PNG instead; JPEG is far smaller then.
  let blob = await encode('image/webp')
  if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg')
  if (!blob) return { blob: null, error: 'That image couldn’t be prepared for upload.' }
  if (blob.size > MAX_IMAGE_BYTES) return { blob: null, error: 'That image is too large, even scaled down.' }
  return { blob, error: null }
}

export async function uploadDreamImage(userId: string, blob: Blob) {
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from(BUCKET)
    // Every upload gets a new name, so the file never changes and can be cached for good.
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false })
  return { path: error ? null : path, error: error ? friendlyError(error.message) : null }
}

/** Best effort: a leftover file only takes space, it's never shown without its dream. */
export async function removeDreamImages(paths: (string | null | undefined)[]) {
  const real = paths.filter((path): path is string => Boolean(path))
  if (real.length === 0) return
  links.forEach((_, path) => real.includes(path) && links.delete(path))
  await supabase.storage.from(BUCKET).remove(real)
}

/** Every picture the user uploaded, for deleting the account. */
export async function removeAllDreamImages(userId: string) {
  const { data } = await supabase.storage.from(BUCKET).list(userId, { limit: 1000 })
  await removeDreamImages((data ?? []).map((file) => `${userId}/${file.name}`))
}

// Signed links shared by every component on the page, so a picture is only signed once.
const links = new Map<string, { url: string; expires: number }>()

const fresh = (path: string) => {
  const link = links.get(path)
  return link && link.expires - Date.now() > RENEW_MS ? link.url : null
}

/** Viewable links for the given pictures, by path; missing ones fill in once signed. */
export function useDreamImageUrls(paths: (string | null | undefined)[]): Map<string, string> {
  const wanted = [...new Set(paths.filter((path): path is string => Boolean(path)))].sort()
  const key = wanted.join('|')
  // Bumped when new links arrive, so the component reads them from the shared map.
  const [, setVersion] = useState(0)

  useEffect(() => {
    const missing = key ? key.split('|').filter((path) => !fresh(path)) : []
    if (missing.length === 0) return
    let cancelled = false
    supabase.storage
      .from(BUCKET)
      .createSignedUrls(missing, LINK_SECONDS)
      .then(({ data }) => {
        const expires = Date.now() + LINK_SECONDS * 1000
        for (const item of data ?? []) {
          if (item.path && item.signedUrl) links.set(item.path, { url: item.signedUrl, expires })
        }
        if (!cancelled) setVersion((v) => v + 1)
      })
    return () => {
      cancelled = true
    }
  }, [key])

  const urls = new Map<string, string>()
  for (const path of wanted) {
    const url = links.get(path)?.url
    if (url) urls.set(path, url)
  }
  return urls
}

export function useDreamImageUrl(path: string | null | undefined): string | null {
  return useDreamImageUrls([path]).get(path ?? '') ?? null
}

/** A prompt to paste into an image generator such as ChatGPT. */
export function dreamImagePrompt(dream: Pick<DreamInput, 'title' | 'body' | 'mood' | 'symbols'>): string {
  const lines = [
    'Create an illustration of this dream. Dreamlike, atmospheric and cinematic, soft light, rich colour, no text or lettering in the image. Square format.',
    '',
    `Title: ${dream.title.trim() || 'Untitled dream'}`,
  ]
  if (dream.mood) lines.push(`Mood: ${dream.mood}`)
  if (dream.symbols.length > 0) lines.push(`Key symbols: ${dream.symbols.join(', ')}`)
  lines.push('', 'The dream:', dream.body.trim() || '(no description yet)')
  return lines.join('\n')
}
