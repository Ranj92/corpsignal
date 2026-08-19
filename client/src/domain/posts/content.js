const ASSET_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Extract managed image IDs without coupling the post API to the editor implementation. */
export function extractAssetIds(html) {
  const ids = new Set()
  const pattern = /data-asset-id=["']([^"']+)["']/gi
  let match

  while ((match = pattern.exec(html || '')) !== null) {
    if (ASSET_ID_PATTERN.test(match[1])) ids.add(match[1].toLowerCase())
  }

  return [...ids]
}
