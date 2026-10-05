/** Only the proven UiSession.pendingInteractions observable, never invented remote events. */
export function observeNeedsAction(source, { enabled, show, onFailure = () => {}, onUnsupported = onFailure }) {
  if (typeof source?.getSnapshot !== 'function' || typeof source.subscribe !== 'function') return null
  let disposed = false
  let previous = new Set()
  let off
  const identities = () => {
    const snapshot = source.getSnapshot()
    if (!(snapshot instanceof Map)) throw new TypeError('unsupported pending interaction snapshot')
    const next = new Set()
    for (const [sessionId, interaction] of snapshot) {
      if (!interaction || typeof interaction.key !== 'string' || !interaction.key || typeof interaction.kind !== 'string' || interaction.sessionId !== sessionId) throw new TypeError('unsupported pending interaction value')
      next.add(JSON.stringify([sessionId, interaction.kind, interaction.key]))
    }
    return next
  }
  try { previous = identities() } catch { return null }
  const update = () => {
    if (disposed) return
    let next
    try { next = identities() } catch { disposed = true; off?.(); onUnsupported(); return }
    const fresh = [...next].some(key => !previous.has(key))
    for (const key of next) previous.add(key)
    if (previous.size > 4096) { disposed = true; off?.(); onUnsupported(); return }
    if (fresh && enabled()) Promise.resolve().then(() => {
      if (!disposed && enabled()) return show()
    }).catch(onFailure)
  }
  try { off = source.subscribe(update) } catch { return null }
  if (typeof off !== 'function') return null
  return () => { disposed = true; off() }
}
