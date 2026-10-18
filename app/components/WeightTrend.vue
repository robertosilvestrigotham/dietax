<template>
  <figure class="space-y-1">
    <figcaption class="flex items-baseline justify-between">
      <span class="text-xs font-semibold text-[#1f2421] dark:text-white">Andamento del peso</span>
      <span v-if="delta !== null" class="text-xs tabular-nums text-[#8a918c] dark:text-[#8e8f94]">
        {{ delta > 0 ? '+' : '' }}{{ delta }} kg dall'inizio
      </span>
    </figcaption>

    <div class="relative" @pointerleave="hovered = null">
      <svg :viewBox="`0 0 ${W} ${H}`" class="w-full h-auto overflow-visible" role="img" :aria-label="ariaLabel">
        <!-- Recessive grid: min and max -->
        <g class="stroke-[#e4e9e1] dark:stroke-[#2c2d31]" stroke-width="1">
          <line :x1="PAD_L" :x2="W - PAD_R" :y1="y(range.max)" :y2="y(range.max)" />
          <line :x1="PAD_L" :x2="W - PAD_R" :y1="y(range.min)" :y2="y(range.min)" />
        </g>
        <g class="fill-[#8a918c] dark:fill-[#8e8f94]" font-size="10">
          <text :x="PAD_L - 6" :y="y(range.max) + 3" text-anchor="end">{{ range.max }}</text>
          <text :x="PAD_L - 6" :y="y(range.min) + 3" text-anchor="end">{{ range.min }}</text>
        </g>

        <!-- Crosshair -->
        <line
          v-if="hovered !== null"
          :x1="x(hovered)"
          :x2="x(hovered)"
          :y1="PAD_T"
          :y2="H - PAD_B"
          class="stroke-[#c8d3c2] dark:stroke-[#3a3b40]"
          stroke-width="1"
        />

        <path :d="linePath" fill="none" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" class="stroke-[#5f8a3a] dark:stroke-[#d4f65a]" />

        <!-- Points with a 2px surface ring, plus larger invisible hit targets -->
        <g v-for="(p, i) in points" :key="p.date">
          <circle
            :cx="x(i)"
            :cy="y(p.weightKg)"
            :r="hovered === i || i === points.length - 1 ? 5 : 4"
            class="fill-[#5f8a3a] dark:fill-[#d4f65a] stroke-white dark:stroke-[#222326]"
            stroke-width="2"
          />
          <rect
            :x="x(i) - hitWidth / 2"
            :y="0"
            :width="hitWidth"
            :height="H"
            fill="transparent"
            tabindex="0"
            :aria-label="`${formatDay(p.date)}: ${p.weightKg} kg`"
            class="outline-none cursor-default"
            @pointerenter="hovered = i"
            @focus="hovered = i"
            @blur="hovered = null"
          />
        </g>

        <!-- Direct label on the latest value only -->
        <text
          v-if="hovered === null && points.length"
          :x="lastLabel.x"
          :y="lastLabel.y"
          text-anchor="end"
          font-size="11"
          font-weight="600"
          class="fill-[#1f2421] dark:fill-white"
        >
          {{ points[points.length - 1]!.weightKg }} kg
        </text>
      </svg>

      <!-- Tooltip: value first, date second -->
      <div
        v-if="hovered !== null && points[hovered]"
        class="absolute -top-1 pointer-events-none -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-lg bg-[#1f2421] dark:bg-white text-white dark:text-[#1f2421] text-center whitespace-nowrap"
        :style="{ left: `${(x(hovered) / W) * 100}%` }"
      >
        <div class="text-xs font-bold tabular-nums">{{ points[hovered]!.weightKg }} kg</div>
        <div class="text-[10px] opacity-70">{{ formatDay(points[hovered]!.date) }}</div>
      </div>
    </div>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BodyMeasurement } from '~/types/meal'
import { parseDateKey } from '~/utils/date'

const props = defineProps<{ measurements: BodyMeasurement[] }>()

const W = 320
const H = 110
const PAD_L = 30
const PAD_R = 10
const PAD_T = 22
const PAD_B = 10

const hovered = ref<number | null>(null)
const points = computed(() => props.measurements)

const range = computed(() => {
  const weights = points.value.map((p) => p.weightKg)
  let min = Math.floor(Math.min(...weights))
  let max = Math.ceil(Math.max(...weights))
  if (max - min < 2) {
    min -= 1
    max += 1
  }
  return { min, max }
})

const x = (i: number) =>
  points.value.length < 2 ? (PAD_L + W - PAD_R) / 2 : PAD_L + (i / (points.value.length - 1)) * (W - PAD_L - PAD_R)
const y = (kg: number) => PAD_T + ((range.value.max - kg) / (range.value.max - range.value.min)) * (H - PAD_T - PAD_B)

const hitWidth = computed(() => Math.max(24, (W - PAD_L - PAD_R) / Math.max(1, points.value.length - 1)))

const linePath = computed(() => points.value.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.weightKg)}`).join(' '))

// Latest value label: beside the point when the line arrives from above (it would cross the text), else above it
const lastLabel = computed(() => {
  const n = points.value.length
  const last = points.value[n - 1]
  const prev = points.value[n - 2]
  if (!last) return { x: 0, y: 0 }
  const comesFromAbove = prev && prev.weightKg > last.weightKg
  return comesFromAbove
    ? { x: x(n - 1) - 10, y: y(last.weightKg) + 4 }
    : { x: x(n - 1), y: y(last.weightKg) - 10 }
})

const delta = computed(() => {
  if (points.value.length < 2) return null
  return Math.round((points.value[points.value.length - 1]!.weightKg - points.value[0]!.weightKg) * 10) / 10
})

const formatDay = (dateKey: string) =>
  parseDateKey(dateKey).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

const ariaLabel = computed(() => {
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  return first && last ? `Peso da ${first.weightKg} a ${last.weightKg} kg` : 'Andamento del peso'
})
</script>
