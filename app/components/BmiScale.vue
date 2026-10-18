<template>
  <div class="space-y-1.5" role="img" :aria-label="`BMI ${bmi}, ${bmiLabel(bmi)}`">
    <!-- Marker -->
    <div class="relative h-5">
      <div
        class="absolute -translate-x-1/2 flex flex-col items-center transition-all duration-500"
        :style="{ left: `${position(bmi)}%` }"
      >
        <span class="text-[11px] font-bold tabular-nums text-[#1f2421] dark:text-white leading-none">{{ bmi }}</span>
        <span class="w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-[#1f2421] dark:border-t-white mt-0.5"></span>
      </div>
    </div>
    <!-- Ranges, separated by a 2px surface gap -->
    <div class="flex gap-0.5 h-2.5">
      <div
        v-for="range in RANGES"
        :key="range.label"
        class="h-full first:rounded-l-full last:rounded-r-full"
        :class="range.color"
        :style="{ width: `${position(range.to) - position(range.from)}%` }"
      ></div>
    </div>
    <div class="flex text-[10px] text-[#8a918c] dark:text-[#8e9790]">
      <span
        v-for="range in RANGES"
        :key="range.label"
        class="text-center truncate"
        :class="bmiLabel(bmi) === range.label ? 'font-semibold text-[#1f2421] dark:text-white' : ''"
        :style="{ width: `${position(range.to) - position(range.from)}%` }"
      >
        {{ range.label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { bmiLabel } from '~/utils/body'

defineProps<{ bmi: number }>()

const MIN = 15
const MAX = 40
const RANGES = [
  { from: MIN, to: 18.5, label: 'Sottopeso', color: 'bg-[#8fc8f2]' },
  { from: 18.5, to: 25, label: 'Normopeso', color: 'bg-[#8cc63f]' },
  { from: 25, to: 30, label: 'Sovrappeso', color: 'bg-[#f2b36b]' },
  { from: 30, to: MAX, label: 'Obesità', color: 'bg-[#e8907a]' },
]

const position = (value: number) => ((Math.min(MAX, Math.max(MIN, value)) - MIN) / (MAX - MIN)) * 100
</script>
