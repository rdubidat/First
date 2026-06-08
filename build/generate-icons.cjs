/*
 * Generates the app + tray icons for Growth Network Tasks with zero
 * dependencies. Draws "Leon" as a friendly paw print on a warm rounded
 * tile, encodes it as a real PNG using Node's built-in zlib.
 *
 *   node build/generate-icons.cjs
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// ---- tiny PNG encoder (RGBA, 8-bit) ----------------------------------------
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // rest zero
  // add filter byte (0) at the start of every scanline
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---- drawing helpers -------------------------------------------------------
function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}
function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4) // transparent
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    // simple alpha-over compositing
    const sa = a / 255
    const da = buf[i + 3] / 255
    const oa = sa + da * (1 - sa)
    if (oa === 0) return
    buf[i] = Math.round((r * sa + buf[i] * da * (1 - sa)) / oa)
    buf[i + 1] = Math.round((g * sa + buf[i + 1] * da * (1 - sa)) / oa)
    buf[i + 2] = Math.round((b * sa + buf[i + 2] * da * (1 - sa)) / oa)
    buf[i + 3] = Math.round(oa * 255)
  }
  const top = [0xeb, 0xb9, 0x78] // leon-300
  const bot = [0xc0, 0x63, 0x22] // leon-600
  const pad = [0xfd, 0xf8, 0xf1] // cream
  const r = size * 0.22 // corner radius
  // rounded-rect background with vertical gradient
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inside =
        x >= 0 && x < size && y >= 0 && y < size &&
        // rounded corner test
        (() => {
          const cx = Math.min(Math.max(x, r), size - r)
          const cy = Math.min(Math.max(y, r), size - r)
          const dx = x - cx
          const dy = y - cy
          return dx * dx + dy * dy <= r * r
        })()
      if (inside) set(x, y, mix(top, bot, y / size), 255)
    }
  }
  // paw: one big pad + four toe beans
  const disc = (cx, cy, rad, color) => {
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++) {
      for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
        const dx = x - cx
        const dy = (y - cy) * 1.18 // squash vertically a touch
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d <= rad) {
          const edge = Math.min(1, (rad - d) / 1.5) // soft edge AA
          set(x, y, color, Math.round(255 * edge))
        }
      }
    }
  }
  const s = size
  disc(s * 0.5, s * 0.62, s * 0.2, pad) // main pad
  disc(s * 0.3, s * 0.4, s * 0.095, pad) // toes
  disc(s * 0.43, s * 0.3, s * 0.1, pad)
  disc(s * 0.58, s * 0.3, s * 0.1, pad)
  disc(s * 0.71, s * 0.4, s * 0.095, pad)
  return encodePNG(size, size, buf)
}

const outDir = __dirname
fs.writeFileSync(path.join(outDir, 'icon.png'), drawIcon(512))
fs.writeFileSync(path.join(outDir, 'tray.png'), drawIcon(32))
fs.writeFileSync(path.join(outDir, 'tray@2x.png'), drawIcon(64))
console.log('Generated build/icon.png, build/tray.png, build/tray@2x.png')
