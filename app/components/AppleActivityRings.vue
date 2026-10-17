<template>
  <div
    class="relative flex items-center justify-center select-none"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <svg :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`" class="w-full h-full -rotate-90">
      <g v-for="ring in rings" :key="ring.key">
        <circle
          :cx="center"
          :cy="center"
          :r="ring.radius"
          :stroke-width="ring.width"
          :stroke="ring.color"
          stroke-opacity="0.25"
          fill="none"
        />
        <circle
          :cx="center"
          :cy="center"
          :r="ring.radius"
          :stroke-width="ring.width"
          :stroke="ring.color"
          fill="none"
          stroke-linecap="round"
          :stroke-dasharray="ring.circumference"
          :stroke-dashoffset="ring.offset"
          :stroke-opacity="ring.pct > 0 ? 1 : 0"
          class="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </g>
    </svg>

    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface RingValue {
  key: string
  pct: number // 0 - 100
  color: string
}

const props = withDefaults(
  defineProps<{
    // Ordered from outer to inner
    values: RingValue[]
    size?: number
  }>(),
  { size: 220 }
)

const viewBoxSize = 200
const center = viewBoxSize / 2
// Stroke widths from outer to inner: thickest outside, thinnest inside
const strokeWidths = [10, 8, 6]
const gap = 4

const rings = computed(() => {
  let outerEdge = center
  return props.values.map((value, index) => {
    const width = strokeWidths[index] ?? strokeWidths[strokeWidths.length - 1]!
    const radius = outerEdge - width / 2
    outerEdge = radius - width / 2 - gap
    const circumference = 2 * Math.PI * radius
    const pct = Math.max(0, Math.min(100, value.pct || 0))
    return {
      ...value,
      pct,
      width,
      radius,
      circumference,
      offset: circumference * (1 - pct / 100),
    }
  })
})
</script>
