export function generateIdentifier(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getOrCreateIdentifier(roomCode: string): string {
  const storageKey = `identifier-${roomCode}`

  if (typeof window === 'undefined') {
    return ''
  }

  let identifier = localStorage.getItem(storageKey)

  if (!identifier) {
    identifier = generateIdentifier()
    localStorage.setItem(storageKey, identifier)
  }

  return identifier
}
