import { AwsClient } from 'npm:aws4fetch@1.0.20'
import { assertAllowedOrigin } from '../_shared/cors.ts'
import { empty, handleError, HttpError, json, readJson } from '../_shared/http.ts'
import { requireRole } from '../_shared/auth.ts'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface ImageType {
  contentType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  extension: 'jpg' | 'png' | 'gif' | 'webp'
}

interface DeleteRequest {
  assetIds?: string[]
}

interface R2Context {
  client: AwsClient
  bucket: string
  endpoint: string
  publicBaseUrl: string
}

function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function createR2Context(): R2Context {
  return {
    client: new AwsClient({
      accessKeyId: requiredEnvironment('R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnvironment('R2_SECRET_ACCESS_KEY'),
      service: 's3',
      region: 'auto'
    }),
    bucket: requiredEnvironment('R2_BUCKET'),
    endpoint: requiredEnvironment('R2_ENDPOINT').replace(/\/$/, ''),
    publicBaseUrl: requiredEnvironment('R2_PUBLIC_BASE_URL').replace(/\/$/, '')
  }
}

function encodedPath(path: string): string {
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

function objectUrl(context: R2Context, objectKey: string): string {
  return `${context.endpoint}/${encodeURIComponent(context.bucket)}/${encodedPath(objectKey)}`
}

function publicUrl(context: R2Context, objectKey: string): string {
  return `${context.publicBaseUrl}/${encodedPath(objectKey)}`
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value)
}

function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { contentType: 'image/jpeg', extension: 'jpg' }
  }
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { contentType: 'image/png', extension: 'png' }
  }
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) {
    return { contentType: 'image/gif', extension: 'gif' }
  }
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { contentType: 'image/webp', extension: 'webp' }
  }
  return null
}

function safeOriginalName(name: string): string {
  const baseName = name.split(/[\\/]/).pop()?.trim() || 'image'
  return baseName.slice(0, 255)
}

async function uploadImage(request: Request, context: Awaited<ReturnType<typeof requireRole>>) {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    throw new HttpError(415, 'Upload must use multipart/form-data', 'unsupported_media_type')
  }

  const form = await request.formData()
  const candidate = form.get('file')
  if (!(candidate instanceof File)) {
    throw new HttpError(400, 'No image file was provided', 'file_required')
  }
  if (candidate.size === 0 || candidate.size > MAX_FILE_SIZE) {
    throw new HttpError(400, 'Image must be between 1 byte and 10 MB', 'invalid_file_size')
  }

  const bytes = new Uint8Array(await candidate.arrayBuffer())
  const imageType = detectImageType(bytes)
  if (!imageType) {
    throw new HttpError(400, 'Only valid JPEG, PNG, GIF, and WebP images are allowed', 'invalid_image_type')
  }

  const r2 = createR2Context()
  const assetId = crypto.randomUUID()
  const now = new Date()
  const objectKey = `posts/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${assetId}.${imageType.extension}`
  const targetUrl = objectUrl(r2, objectKey)

  const uploadResponse = await r2.client.fetch(targetUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': imageType.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    },
    body: bytes
  })

  if (!uploadResponse.ok) {
    throw new Error(`R2 upload failed with status ${uploadResponse.status}`)
  }

  const asset = {
    id: assetId,
    object_key: objectKey,
    public_url: publicUrl(r2, objectKey),
    original_name: safeOriginalName(candidate.name),
    content_type: imageType.contentType,
    file_size: candidate.size,
    uploaded_by: context.user.id
  }

  const { error: insertError } = await context.adminClient.from('media_assets').insert(asset)
  if (insertError) {
    // Compensate so a database failure does not leave an untracked paid object.
    await r2.client.fetch(targetUrl, { method: 'DELETE' }).catch(() => undefined)
    throw insertError
  }

  return {
    id: asset.id,
    url: asset.public_url,
    fileName: objectKey.split('/').pop(),
    originalName: asset.original_name,
    contentType: asset.content_type,
    fileSize: asset.file_size
  }
}

async function deleteImages(request: Request, context: Awaited<ReturnType<typeof requireRole>>) {
  const body = await readJson<DeleteRequest>(request)
  const assetIds = [...new Set(body.assetIds || [])]

  if (assetIds.length === 0) return { deletedAssetIds: [] }
  if (assetIds.length > 100 || assetIds.some(id => !UUID_PATTERN.test(id))) {
    throw new HttpError(400, 'assetIds must contain at most 100 valid IDs', 'invalid_asset_ids')
  }

  const { data: links, error: linksError } = await context.adminClient
    .from('post_assets')
    .select('asset_id')
    .in('asset_id', assetIds)
  if (linksError) throw linksError

  const linkedIds = new Set((links || []).map(link => link.asset_id))
  const unlinkedIds = assetIds.filter(id => !linkedIds.has(id))
  if (unlinkedIds.length === 0) return { deletedAssetIds: [] }

  const { data: assets, error: assetsError } = await context.adminClient
    .from('media_assets')
    .select('id, object_key')
    .in('id', unlinkedIds)
  if (assetsError) throw assetsError

  const r2 = createR2Context()
  const deletedAssetIds: string[] = []

  for (const asset of assets || []) {
    const response = await r2.client.fetch(objectUrl(r2, asset.object_key), { method: 'DELETE' })
    if (response.ok || response.status === 404) deletedAssetIds.push(asset.id)
  }

  if (deletedAssetIds.length > 0) {
    const { error: deleteError } = await context.adminClient
      .from('media_assets')
      .delete()
      .in('id', deletedAssetIds)
    if (deleteError) throw deleteError
  }

  return { deletedAssetIds }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return empty(request)

  try {
    assertAllowedOrigin(request)
    const context = await requireRole(request, ['Admin', 'Manager'])

    if (request.method === 'POST') {
      return json(request, await uploadImage(request, context), 201)
    }
    if (request.method === 'DELETE') {
      return json(request, await deleteImages(request, context))
    }

    throw new HttpError(405, 'Method not allowed', 'method_not_allowed')
  } catch (error) {
    return handleError(request, error)
  }
})
