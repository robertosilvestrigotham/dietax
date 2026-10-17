<template>
  <div
    class="relative flex items-center justify-center select-none"
    :class="customSizeClass"
    :style="customStyle"
  >
    <svg
      :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`"
      class="w-full h-full transform -rotate-90 overflow-visible"
    >
      <defs>
        <!-- Soft Mint/Lime Ring Gradient matching reference design -->
        <linearGradient id="oasisRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a3db68" />
          <stop offset="60%" stop-color="#93cc54" />
          <stop offset="100%" stop-color="#84bd45" />
        </linearGradient>
      </defs>

      <!-- Background Track (very soft sage/cream #e4ecd7) -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        fill="none"
        class="stroke-[#e4eed7] dark:stroke-[#1d3320]"
      />

      <!-- Active Progress Arc (Fresh lime green) -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        stroke="url(#oasisRingGrad)"
        fill="none"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :stroke-opacity="pct > 0 ? 1 : 0"
        class="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>

    <!-- Inside the ring: Daily Budget / Target label + big bold number -->
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
      <span class="text-[11px] sm:text-xs font-semibold text-[#7c9274] dark:text-[#8ea593] tracking-normal mb-0.5">
        Target Giornaliero
      </span>
      <div class="flex items-baseline justify-center">
        <span class="text-3xl sm:text-4xl font-extrabold text-[#1f2d1e] dark:text-white tracking-tight">
          {{ value }}
        </span>
        <span class="text-sm font-semibold text-[#7c9274] dark:text-[#8ea593] ml-1">
          {{ unit }}
        </span>
      </div>
      <span class="text-[11px] font-medium text-[#849a7c] dark:text-[#809a85] mt-1">
        {{ Math.round(pct) }}% consumati
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    percentage: number // 0 - 100
    value: number | string
    unit?: string
    size?: number
  }>(),
  {
    unit: 'g CHO',
  }
)

const customStyle = computed(() => {
  if (props.size) {
    return { width: `${props.size}px`, height: `${props.size}px` }
  }
  return undefined
})

const customSizeClass = computed(() => {
  if (props.size) return ''
  return 'w-[200px] h-[200px] sm:w-[220px] sm:h-[220px]'
})

const viewBoxSize = 200
const center = viewBoxSize / 2 // 100
const strokeWidth = 14
const radius = 78
const circumference = 2 * Math.PI * radius

const pct = computed(() => Math.max(0, Math.min(100, props.percentage || 0)))
const dashOffset = computed(() => circumference * (1 - pct.value / 100))
</script>
