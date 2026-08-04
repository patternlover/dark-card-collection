const COLLECTION_CODE_PREFIX = /^[A-Z]{2,4}\s*-\s*/

export function formatCollectionName(name: string): string {
  return name.replace(COLLECTION_CODE_PREFIX, '')
}
