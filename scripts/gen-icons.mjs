// Generates AkopFit PNG icons with no external deps (zlib PNG encoder).
import zlib from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const DARK = [10, 10, 11]
const LIME = [198, 255, 46]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// signed area / point-in-polygon (even-odd) for filling the "A"
function inPoly(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside
  }
  return inside
}

function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4)
  const r = size * 0.22 // corner radius
  // "A" geometry as two outer triangles minus inner, plus crossbar — built from polygons in 0..1 space
  const s = size
  const outer = [[0.5, 0.18], [0.82, 0.84], [0.66, 0.84], [0.5, 0.45], [0.34, 0.84], [0.18, 0.84]]
  const innerHole = [[0.5, 0.40], [0.60, 0.62], [0.40, 0.62]]
  const crossbar = [[0.40, 0.60], [0.60, 0.60], [0.635, 0.69], [0.365, 0.69]]

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4
      // rounded-rect mask
      let inBg = true
      const cx = Math.min(x, s - 1 - x), cy = Math.min(y, s - 1 - y)
      if (cx < r && cy < r) {
        const dx = r - cx, dy = r - cy
        if (dx * dx + dy * dy > r * r) inBg = false
      }
      let col = inBg ? DARK : [0, 0, 0]
      let a = inBg ? 255 : 0
      // letter A in lime
      const fx = x / s, fy = y / s
      const isA = (inPoly(fx, fy, outer) && !inPoly(fx, fy, innerHole)) || inPoly(fx, fy, crossbar)
      if (inBg && isA) col = LIME
      buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2]; buf[i + 3] = a
    }
  }
  return encodePNG(s, s, buf)
}

mkdirSync('public', { recursive: true })
for (const [name, size] of [['pwa-192.png', 192], ['pwa-512.png', 512], ['apple-touch-icon.png', 180], ['favicon-32.png', 32]]) {
  writeFileSync(`public/${name}`, makeIcon(size))
  console.log('wrote public/' + name)
}

// SVG favicon (crisp at any size)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<rect width="100" height="100" rx="22" fill="#0a0a0b"/>
<path d="M50 18 L82 84 L66 84 L50 45 L34 84 L18 84 Z M40 60 L60 60 L63.5 69 L36.5 69 Z" fill="#c6ff2e"/>
</svg>`
writeFileSync('public/favicon.svg', svg)
console.log('wrote public/favicon.svg')
