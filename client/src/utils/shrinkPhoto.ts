// Makes a photo small enough to upload, inside the browser / app, before it is sent.
// Phone cameras often make 6-12 MB pictures, more than the server's 5 MB limit. The server shrinks every
// photo to max 1600 px anyway (LocalPhotoStorage), so we do the same here first: same result, faster upload.
// Photos that already fit are sent unchanged; the server still checks and cleans every photo.

const MAX_DIMENSION = 1600 // the same as "PhotoStorage:MaxDimension" on the server
const JPEG_QUALITY = 0.9

export async function shrinkPhoto(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file

  // createImageBitmap turns the photo upright using its EXIF orientation (phones store photos sideways)
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare the photo.')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    // A new JPEG drawn from pixels has no EXIF data at all (no GPS location)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob) throw new Error('Could not prepare the photo.')

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } finally {
    bitmap.close()
  }
}
