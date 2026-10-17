<template>
  <canvas
    ref="canvasRef"
    class="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700"
    :class="isReady ? 'opacity-100' : 'opacity-0'"
    aria-hidden="true"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// Soft animated "mesh gradient": pastel colour zones drifting and blending.
// Rendered at reduced resolution (it's all blur anyway) and throttled to ~30fps.

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isReady = ref(false)

const RESOLUTION_SCALE = 0.35
const FRAME_INTERVAL = 1000 / 30

const PALETTES = {
  light: ['#dcefcb', '#f1f6c6', '#cfeedd', '#e6e3f7', '#d6e9f7'],
  dark: ['#1a3320', '#26301a', '#143029', '#232540', '#162b38'],
}

const VERTEX_SHADER = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uColors[5];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv;
  p.x *= uRes.x / uRes.y;
  float t = uTime * 0.06;

  // Domain warp so the zones get organic, non-linear edges
  p += 0.18 * vec2(sin(p.y * 3.1 + t * 2.3), cos(p.x * 2.7 - t * 1.9));
  p += 0.10 * vec2(sin(p.y * 5.3 - t * 1.4), cos(p.x * 4.9 + t * 1.7));

  float aspect = uRes.x / uRes.y;
  vec2 c0 = vec2(aspect * (0.25 + 0.20 * sin(t * 1.10)), 0.25 + 0.20 * cos(t * 0.90));
  vec2 c1 = vec2(aspect * (0.80 + 0.15 * cos(t * 0.70)), 0.20 + 0.20 * sin(t * 1.30));
  vec2 c2 = vec2(aspect * (0.55 + 0.25 * sin(t * 0.80 + 2.0)), 0.60 + 0.20 * cos(t * 1.00 + 1.0));
  vec2 c3 = vec2(aspect * (0.15 + 0.15 * cos(t * 1.20 + 4.0)), 0.85 + 0.12 * sin(t * 0.60));
  vec2 c4 = vec2(aspect * (0.85 + 0.12 * sin(t * 0.95 + 3.0)), 0.85 + 0.15 * cos(t * 1.15 + 2.0));

  float k = 6.0;
  float w0 = exp(-k * dot(p - c0, p - c0));
  float w1 = exp(-k * dot(p - c1, p - c1));
  float w2 = exp(-k * dot(p - c2, p - c2));
  float w3 = exp(-k * dot(p - c3, p - c3)) * 0.8;
  float w4 = exp(-k * dot(p - c4, p - c4)) * 0.8;
  float sum = w0 + w1 + w2 + w3 + w4 + 0.0001;

  vec3 col = (uColors[0] * w0 + uColors[1] * w1 + uColors[2] * w2 + uColors[3] * w3 + uColors[4] * w4) / sum;

  // Tiny grain to avoid banding
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0 * 2.0;

  gl_FragColor = vec4(col, 1.0);
}
`

const hexToRgb = (hex: string): number[] => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

let gl: WebGLRenderingContext | null = null
let rafId = 0
let lastFrame = 0
let startTime = 0
let uRes: WebGLUniformLocation | null = null
let uTime: WebGLUniformLocation | null = null
let uColors: WebGLUniformLocation | null = null
let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null
let reducedMotion = false

const compile = (type: number, source: string): WebGLShader | null => {
  if (!gl) return null
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

const applyPalette = () => {
  if (!gl || !uColors) return
  const isDark = document.documentElement.classList.contains('dark')
  const flat = (isDark ? PALETTES.dark : PALETTES.light).flatMap(hexToRgb)
  gl.uniform3fv(uColors, new Float32Array(flat))
}

const resize = () => {
  const canvas = canvasRef.value
  if (!canvas || !gl) return
  const width = Math.max(1, Math.round(canvas.clientWidth * RESOLUTION_SCALE))
  const height = Math.max(1, Math.round(canvas.clientHeight * RESOLUTION_SCALE))
  canvas.width = width
  canvas.height = height
  gl.viewport(0, 0, width, height)
  gl.uniform2f(uRes, width, height)
}

const draw = (now: number) => {
  if (!gl) return
  gl.uniform1f(uTime, (now - startTime) / 1000)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

const loop = (now: number) => {
  rafId = requestAnimationFrame(loop)
  if (document.hidden || now - lastFrame < FRAME_INTERVAL) return
  lastFrame = now
  draw(now)
}

const redrawIfStatic = () => {
  if (reducedMotion) draw(performance.now())
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false })
  if (!gl) return

  const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER)
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  const program = gl.createProgram()
  if (!vs || !fs || !program) return
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
  gl.useProgram(program)

  // One oversized triangle covering the viewport
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  uRes = gl.getUniformLocation(program, 'uRes')
  uTime = gl.getUniformLocation(program, 'uTime')
  uColors = gl.getUniformLocation(program, 'uColors')

  applyPalette()
  resize()

  resizeObserver = new ResizeObserver(() => {
    resize()
    redrawIfStatic()
  })
  resizeObserver.observe(canvas)

  themeObserver = new MutationObserver(() => {
    applyPalette()
    redrawIfStatic()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  // Random phase so the background doesn't always start identical
  startTime = performance.now() - Math.random() * 60_000
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) {
    draw(performance.now())
  } else {
    rafId = requestAnimationFrame(loop)
  }
  isReady.value = true
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  gl = null
})
</script>
