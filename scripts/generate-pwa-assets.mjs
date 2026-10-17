// Generates every public PWA asset from the DietaX logo (three concentric goal rings).
// Run with: pnpm generate:pwa-assets
//
// Output (public/):
//   favicon.svg, favicon.ico (16/32/48)
//   pwa-64x64.png, pwa-192x192.png, pwa-512x512.png   (purpose "any", rounded tile)
//   maskable-icon-512x512.png                           (purpose "maskable", full bleed + safe zone)
//   apple-touch-icon.png                                (180x180, full bleed, iOS rounds it)
//   splash/apple-splash-{light,dark}-{w}x{h}.png        (iOS launch screens)
// and scripts/pwa-splash-links.json with the <link rel="apple-touch-startup-image"> tags.

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sharp from 'sharp'
import { appleSplashScreenSizes } from '@vite-pwa/assets-generator/config'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const splashDir = join(publicDir, 'splash')

// Palette shared with the app (DayProgressSummary rings + page background)
const RINGS = [
  { color: '#8cc63f', pct: 0.78 }, // CHO (outer, thickest)
  { color: '#ab9cf0', pct: 0.62 }, // Pasti
  { color: '#8fc8f2', pct: 0.88 }, // Aderenza (inner, thinnest)
]
const THEMES = {
  light: { page: '#e5ede2', tileFrom: '#eaf5dd', tileTo: '#d3eabd', track: 0.24 },
  dark: { page: '#0c1610', tileFrom: '#1f3a24', tileTo: '#142a19', track: 0.2 },
}

/**
 * Concentric rings centered in a 512 box. `extent` is the outer edge radius of the outer ring.
 * Stroke widths keep the app's thick → thin ratio (10 / 8 / 6).
 */
function ringsSvg(extent, trackOpacity) {
  const widths = [44, 35, 26].map((w) => (w * extent) / 196)
  const gap = (14 * extent) / 196
  let outerEdge = extent
  return RINGS.map((ring, i) => {
    const w = widths[i]
    const r = outerEdge - w / 2
    outerEdge = r - w / 2 - gap
    const c = 2 * Math.PI * r
    return `
    <circle cx="256" cy="256" r="${r.toFixed(2)}" fill="none" stroke="${ring.color}" stroke-opacity="${trackOpacity}" stroke-width="${w.toFixed(2)}"/>
    <circle cx="256" cy="256" r="${r.toFixed(2)}" fill="none" stroke="${ring.color}" stroke-width="${w.toFixed(2)}"
      stroke-linecap="round" stroke-dasharray="${(c * ring.pct).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 256 256)"/>`
  }).join('')
}

/** Logo SVG. `rounded`: tile with transparent corners; otherwise full-bleed square. */
function logoSvg({ theme = 'light', rounded = true, extent = 196 } = {}) {
  const t = THEMES[theme]
  const radius = rounded ? 115 : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.tileFrom}"/>
      <stop offset="1" stop-color="${t.tileTo}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#bg)"/>${ringsSvg(extent, t.track)}
</svg>
`
}

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: Math.max(72, (72 * size) / 512 * 4) })
    .resize(size, size)
    .png({ compressionLevel: 9, palette: false })
    .toBuffer()

/** Minimal ICO container embedding PNG images (supported by all modern browsers). */
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  const dir = Buffer.alloc(16 * images.length)
  let offset = 6 + dir.length
  images.forEach(({ size, data }, i) => {
    const o = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, o)
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1)
    dir.writeUInt8(0, o + 2)
    dir.writeUInt8(0, o + 3)
    dir.writeUInt16LE(1, o + 4)
    dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(data.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += data.length
  })
  return Buffer.concat([header, dir, ...images.map((img) => img.data)])
}

async function splash(theme, width, height) {
  const t = THEMES[theme]
  const logoSize = Math.round(Math.min(width, height) * 0.3)
  const logo = await png(logoSvg({ theme, rounded: true }), logoSize)
  return sharp({ create: { width, height, channels: 4, background: t.page } })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function main() {
  const write = (name, data) => writeFile(join(publicDir, name), data)

  const rounded = logoSvg({ rounded: true })
  // Full-bleed art keeps everything inside the maskable safe zone (radius 40% of the icon)
  const fullBleed = logoSvg({ rounded: false, extent: 160 })

  await write('favicon.svg', rounded)
  await write(
    'favicon.ico',
    buildIco(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(rounded, size) }))))
  )
  for (const size of [64, 192, 512]) {
    await write(`pwa-${size}x${size}.png`, await png(rounded, size))
  }
  await write('maskable-icon-512x512.png', await png(fullBleed, 512))
  // iOS only rounds the corners, so the rings can be larger than in the maskable icon
  await write('apple-touch-icon.png', await png(logoSvg({ rounded: false, extent: 188 }), 180))

  // iOS launch screens: one per unique portrait resolution, light + dark
  await rm(splashDir, { recursive: true, force: true })
  await mkdir(splashDir, { recursive: true })
  const seen = new Set()
  const links = []
  for (const { width, height, scaleFactor } of Object.values(appleSplashScreenSizes)) {
    const key = `${width}x${height}`
    if (seen.has(key)) continue
    seen.add(key)
    for (const theme of ['light', 'dark']) {
      const file = `apple-splash-${theme}-${key}.png`
      await writeFile(join(splashDir, file), await splash(theme, width, height))
      links.push({
        rel: 'apple-touch-startup-image',
        href: `/splash/${file}`,
        media:
          `(device-width: ${width / scaleFactor}px) and (device-height: ${height / scaleFactor}px) and ` +
          `(-webkit-device-pixel-ratio: ${scaleFactor}) and (orientation: portrait) and (prefers-color-scheme: ${theme})`,
      })
    }
  }
  await writeFile(join(root, 'scripts', 'pwa-splash-links.json'), JSON.stringify(links, null, 2) + '\n')

  console.log(`PWA assets generated: 8 icons, ${links.length} splash screens`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
