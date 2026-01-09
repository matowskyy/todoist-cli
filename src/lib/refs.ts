import { formatError } from './output.js'

export function isIdRef(ref: string): boolean {
  return ref.startsWith('id:')
}

export function extractId(ref: string): string {
  return ref.slice(3)
}

export function requireIdRef(ref: string, entityName: string): string {
  if (!isIdRef(ref)) {
    throw new Error(
      formatError(
        'INVALID_REF',
        `Invalid ${entityName} reference "${ref}".`,
        [`Use id:xxx format (e.g., id:${ref})`]
      )
    )
  }
  return extractId(ref)
}
