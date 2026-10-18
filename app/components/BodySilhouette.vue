<template>
  <!-- Stylized front view; the active measurement band is highlighted -->
  <svg viewBox="0 0 120 262" class="w-full h-full" role="img" :aria-label="ariaLabel">
    <g class="fill-[#dbe4d6] dark:fill-[#24332a]">
      <circle cx="60" cy="26" r="16" />
      <rect x="54" y="40" width="12" height="12" rx="4" />
      <path d="M34 54 Q60 47 86 54 Q95 58 94 70 Q90 100 82 124 Q91 142 90 162 L30 162 Q29 142 38 124 Q30 100 26 70 Q25 58 34 54 Z" />
      <rect x="9" y="60" width="15" height="96" rx="7.5" transform="rotate(7 16 60)" />
      <rect x="96" y="60" width="15" height="96" rx="7.5" transform="rotate(-7 104 60)" />
      <rect x="33" y="156" width="25" height="100" rx="12" />
      <rect x="62" y="156" width="25" height="100" rx="12" />
    </g>

    <g v-for="band in BANDS" :key="band.key">
      <line
        :x1="band.x1"
        :x2="band.x2"
        :y1="band.y"
        :y2="band.y"
        stroke-linecap="round"
        :stroke-width="band.key === active ? 3.5 : 2"
        :stroke-dasharray="band.key === active ? undefined : '3 4'"
        :class="band.key === active ? 'stroke-[#8cc63f]' : filled?.[band.key] ? 'stroke-[#8fb57a]' : 'stroke-[#b6c4ae] dark:stroke-[#3a4a3d]'"
        class="transition-all duration-300"
      />
      <circle
        v-if="band.key === active || filled?.[band.key]"
        :cx="band.x2"
        :cy="band.y"
        :r="band.key === active ? 4 : 3"
        :class="band.key === active ? 'fill-[#8cc63f]' : 'fill-[#8fb57a]'"
      />
    </g>
  </svg>
</template>

<script lang="ts">
export type BodyBand = 'chestCm' | 'waistCm' | 'hipsCm' | 'armCm' | 'thighCm'
</script>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  active?: BodyBand | null
  filled?: Partial<Record<BodyBand, boolean>>
}>()

const BANDS: { key: BodyBand; label: string; y: number; x1: number; x2: number }[] = [
  { key: 'chestCm', label: 'torace', y: 80, x1: 28, x2: 92 },
  { key: 'waistCm', label: 'vita', y: 118, x1: 35, x2: 85 },
  { key: 'hipsCm', label: 'fianchi', y: 150, x1: 29, x2: 91 },
  { key: 'armCm', label: 'braccio', y: 92, x1: 97, x2: 115 },
  { key: 'thighCm', label: 'coscia', y: 186, x1: 31, x2: 60 },
]

const ariaLabel = computed(() => {
  const band = BANDS.find((b) => b.key === props.active)
  return band ? `Dove misurare: ${band.label}` : 'Sagoma del corpo con i punti di misura'
})
</script>
