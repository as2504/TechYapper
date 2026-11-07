// Draws a shareable battle scorecard (1080×1350 PNG) and shares or downloads it.
export async function shareBattle({ score, total, rounds, streak, date }: { score: number; total: number; rounds: (boolean | null)[]; streak: number; date: string }) {
  const W = 1080, H = 1350
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const g = cv.getContext('2d')!
  try { await document.fonts.ready } catch { /* ignore */ }
  g.fillStyle = '#16140F'; g.fillRect(0, 0, W, H)
  g.fillStyle = '#E5482A'; g.fillRect(0, 0, 18, H)
  g.fillStyle = '#F3EFE6'
  g.font = '500 30px "JetBrains Mono", monospace'
  g.fillText(`YAP BATTLE · ${date}`, 110, 170)
  g.font = '600 380px Fraunces, Georgia, serif'
  g.fillText(String(score), 100, 620)
  const w = g.measureText(String(score)).width
  g.fillStyle = 'rgba(243,239,230,.35)'
  g.font = '600 180px Fraunces, Georgia, serif'
  g.fillText(`/${total}`, 110 + w, 620)
  rounds.forEach((r, i) => {
    g.fillStyle = r == null ? '#2B2925' : r ? '#2F9E61' : '#E5482A'
    g.beginPath(); g.roundRect(110 + i * 150, 720, 126, 126, 18); g.fill()
  })
  g.fillStyle = '#F3EFE6'
  g.font = '600 64px Fraunces, Georgia, serif'
  g.fillText(`${streak}-day streak`, 110, 1000)
  g.fillStyle = 'rgba(243,239,230,.6)'
  g.font = '400 36px Geist, system-ui, sans-serif'
  g.fillText('Can you beat it?', 110, 1070)
  g.fillStyle = '#F3EFE6'
  g.font = '600 44px Fraunces, Georgia, serif'
  g.fillText('techyapper', 110, 1230)
  g.fillStyle = 'rgba(243,239,230,.6)'
  g.font = '400 32px "JetBrains Mono", monospace'
  g.fillText('techyapper.sumitsk.in', 110, 1280)

  const blob: Blob = await new Promise((res) => cv.toBlob((b) => res(b!), 'image/png'))
  const file = new File([blob], `techyapper-battle-${date}.png`, { type: 'image/png' })
  const text = `I scored ${score}/${total} on today's Yap Battle. ${streak}-day streak. https://techyapper.sumitsk.in`
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return 'shared' } catch { return 'cancelled' }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = file.name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
  return 'downloaded'
}
