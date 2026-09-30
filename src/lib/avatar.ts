import { supabase } from './supabase.ts'

const BUCKET = 'avatars'
const MAX_SIDE = 512

// Shrink photos before upload: phone pictures are often 5-10 MB, an avatar needs ~50 KB.
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process that image.'))), 'image/webp', 0.85),
  )
}

const extFor: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }

/** Uploads a new profile photo, removes the user's old ones, and returns the public URL. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')

  let blob: Blob
  try {
    blob = await resizeImage(file)
  } catch {
    throw new Error('That image format is not supported. Try a JPG or PNG.')
  }

  // A fresh filename each time so browsers and the offline cache never show the old photo.
  const path = `${userId}/avatar-${Date.now()}.${extFor[blob.type] ?? 'png'}`
  const storage = supabase.storage.from(BUCKET)

  const { error } = await storage.upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
  if (error) throw new Error(error.message)

  const { data: existing } = await storage.list(userId)
  const stale = (existing ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== path)
  if (stale.length) await storage.remove(stale)

  return storage.getPublicUrl(path).data.publicUrl
}
