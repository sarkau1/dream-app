import { useCallback, useEffect, useState } from 'react'
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
// Each picture also gets a small copy for the journal's thumbnails.
const THUMB_SIDE = 320
// Signed links last an hour; they're renewed a few minutes before they run out.
const LINK_SECONDS = 60 * 60
const RENEW_MS = 5 * 60 * 1000

/**
 * The picked file scaled down to at most MAX_SIDE pixels and re-encoded (WebP where the browser
 * can, else JPEG), so a 3 MB PNG from an image generator uploads as a few hundred KB; plus a
 * THUMB_SIDE copy for thumbnails.
 */
export async function prepareImage(
  file: File,
): Promise<{ blob: Blob | null; thumb: Blob | null; error: string | null }> {
  if (!file.type.startsWith('image/')) return { blob: null, thumb: null, error: 'Choose an image file.' }
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { blob: null, thumb: null, error: 'That image couldn’t be opened. Try a JPEG, PNG or WebP.' }
  }
  const blob = await scaled(bitmap, MAX_SIDE)
  const thumb = await scaled(bitmap, THUMB_SIDE)
  bitmap.close()
  if (!blob) return { blob: null, thumb: null, error: 'That image couldn’t be prepared for upload.' }
  if (blob.size > MAX_IMAGE_BYTES) {
    return { blob: null, thumb: null, error: 'That image is too large, even scaled down.' }
  }
  return { blob, thumb, error: null }
}

async function scaled(bitmap: ImageBitmap, maxSide: number): Promise<Blob | null> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85))
  // Safari can't encode WebP and hands back a PNG instead; JPEG is far smaller then.
  const webp = await encode('image/webp')
  return webp && webp.type === 'image/webp' ? webp : encode('image/jpeg')
}

/** Where a picture's small copy is kept: "<user>/<id>.webp" becomes "<user>/<id>.thumb.webp". */
export function thumbPath(path: string): string {
  return path.replace(/(\.[a-z]+)$/, '.thumb$1')
}

export async function uploadDreamImage(userId: string, blob: Blob, thumb: Blob | null) {
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  // Every upload gets a new name, so the file never changes and can be cached for good.
  const put = (to: string, body: Blob) =>
    supabase.storage
      .from(BUCKET)
      .upload(to, body, { contentType: body.type, cacheControl: '31536000', upsert: false })
  const { error } = await put(path, blob)
  if (error) return { path: null, error: friendlyError(error.message) }
  // The thumbnail is a nicety: without one the journal shows the full picture.
  if (thumb && thumb.type === blob.type) await put(thumbPath(path), thumb)
  return { path, error: null }
}

/** Best effort: a leftover file only takes space, it's never shown without its dream. */
export async function removeDreamImages(paths: (string | null | undefined)[]) {
  const real = paths.filter((path): path is string => Boolean(path))
  if (real.length === 0) return
  for (const path of real) {
    links.delete(linkKey(path, false))
    links.delete(linkKey(path, true))
  }
  // Each picture's thumbnail goes with it (removing one that doesn't exist is harmless).
  await supabase.storage.from(BUCKET).remove([...real, ...real.map(thumbPath)])
}

/** Every picture the user uploaded, thumbnails included, for deleting the account. */
export async function removeAllDreamImages(userId: string) {
  const { data } = await supabase.storage.from(BUCKET).list(userId, { limit: 1000 })
  const paths = (data ?? []).map((file) => `${userId}/${file.name}`)
  if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths)
}

// Signed links shared by every component on the page, so a picture is only signed once.
const links = new Map<string, { url: string; expires: number }>()
// Pictures added before thumbnails were made have no small copy; remembered so it's asked once.
const noThumb = new Set<string>()
const RETRY_DELAYS_MS = [1000, 3000, 8000]
// A picture that couldn't be signed (its file is gone, or the network kept failing) is left alone
// this long before trying again, so it never loops.
const COOL_DOWN_MS = 60_000
const failedAt = new Map<string, number>()

// Outside the hook, since reading the clock while rendering isn't allowed.
const msUntilRenewal = (expires: number) => Math.max(1000, expires - RENEW_MS - Date.now() + 1000)
const coolingDown = (key: string) => Date.now() - (failedAt.get(key) ?? 0) < COOL_DOWN_MS
const clock = () => Date.now()

const linkKey = (path: string, thumb: boolean) => (thumb ? `thumb:${path}` : path)

const fresh = (key: string) => {
  const link = links.get(key)
  return link !== undefined && link.expires - Date.now() > RENEW_MS
}

/** Signs the pictures (or their thumbnails); false if the request failed. */
async function sign(paths: string[], thumbs: boolean): Promise<boolean> {
  const targets = thumbs ? paths.map((path) => (noThumb.has(path) ? path : thumbPath(path))) : paths
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(targets, LINK_SECONDS)
  if (error || !data) return false
  const expires = Date.now() + LINK_SECONDS * 1000
  const withoutThumb: string[] = []
  data.forEach((item, i) => {
    const key = linkKey(paths[i], thumbs)
    if (item.signedUrl) {
      links.set(key, { url: item.signedUrl, expires })
      failedAt.delete(key)
    } else if (targets[i] !== paths[i]) {
      noThumb.add(paths[i])
      withoutThumb.push(paths[i])
    } else failedAt.set(key, Date.now())
  })
  // No small copy: show the full picture instead.
  return withoutThumb.length === 0 || sign(withoutThumb, thumbs)
}

/**
 * Viewable links for the given pictures, by path; missing ones fill in once signed. Links are
 * renewed before they run out, signing is retried when it fails, and `reload` re-signs a picture
 * that didn't load (pass it to the image's onError).
 */
export function useDreamImageUrls(
  paths: (string | null | undefined)[],
  { thumbnails = false } = {},
): { urls: Map<string, string>; reload: (path: string) => void } {
  const wanted = [...new Set(paths.filter((path): path is string => Boolean(path)))].sort()
  const wantedKey = wanted.join('|')
  // When the links were last looked at; set again when new ones arrive, they're about to expire,
  // or one failed to load.
  const [now, setNow] = useState(clock)

  useEffect(() => {
    const all = wantedKey ? wantedKey.split('|') : []
    const waiting = all.filter((path) => coolingDown(linkKey(path, thumbnails)))
    const missing = all.filter((path) => !fresh(linkKey(path, thumbnails)) && !waiting.includes(path))
    let cancelled = false
    let timer: number | undefined
    const bump = () => {
      if (!cancelled) setNow(clock())
    }

    if (missing.length > 0) {
      void (async () => {
        for (let attempt = 0; ; attempt++) {
          const ok = await sign(missing, thumbnails).catch(() => false)
          if (ok || cancelled) break
          if (attempt >= RETRY_DELAYS_MS.length) {
            for (const path of missing) failedAt.set(linkKey(path, thumbnails), clock())
            break
          }
          await new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
        }
        bump()
      })()
    } else if (waiting.length > 0) {
      // Try the failed ones again once they've cooled down.
      timer = window.setTimeout(bump, COOL_DOWN_MS)
    } else if (all.length > 0) {
      // Everything is signed: come back just before the first link would need renewing.
      const soonest = Math.min(...all.map((path) => links.get(linkKey(path, thumbnails))!.expires))
      timer = window.setTimeout(bump, msUntilRenewal(soonest))
    }
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [wantedKey, thumbnails, now])

  const reload = useCallback(
    (path: string) => {
      const key = linkKey(path, thumbnails)
      const link = links.get(key)
      // A link signed in the last minute is new already; re-signing it again would only loop on a
      // file that's really gone.
      if (link && clock() - (link.expires - LINK_SECONDS * 1000) < 60_000) return
      links.delete(key)
      setNow(clock())
    },
    [thumbnails],
  )

  // Only links that still work: an expired one would just show a broken picture.
  const urls = new Map<string, string>()
  for (const path of wanted) {
    const link = links.get(linkKey(path, thumbnails))
    if (link && link.expires > now) urls.set(path, link.url)
  }
  return { urls, reload }
}

export function useDreamImageUrl(path: string | null | undefined) {
  const { urls, reload } = useDreamImageUrls([path])
  return {
    url: path ? (urls.get(path) ?? null) : null,
    reload: () => {
      if (path) reload(path)
    },
  }
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
