<template>
  <div class="ui-modal-backdrop" @click.self="closeMeasurement">
    <div class="ui-modal sm:max-w-md">
      <div class="relative isolate overflow-hidden px-5 pt-5 pb-5 bg-gradient-to-br from-[#e3f2d3] to-[#eef5c8] dark:from-[#1b3420] dark:to-[#1f2c14]">
        <ShaderBackground class="-z-10" />
        <div class="flex items-start justify-between gap-3">
          <span class="w-14 h-14 rounded-[20px] bg-white/75 dark:bg-white/10 backdrop-blur flex items-center justify-center shadow-[0_6px_20px_rgba(60,100,40,0.12)]">
            <Scales class="w-8 h-8 text-[#5f8a3a] dark:text-[#a7c49a]" />
          </span>
          <button type="button" @click="closeMeasurement" class="w-9 h-9 rounded-full flex items-center justify-center bg-white/60 dark:bg-white/10 text-[#1f2421] dark:text-white" aria-label="Chiudi">
            <X class="w-4 h-4" weight="bold" />
          </button>
        </div>
        <h3 class="mt-4 text-2xl font-bold tracking-tight text-[#1f2421] dark:text-white">Come va?</h3>
        <p v-if="last" class="text-sm text-[#4a5a44] dark:text-[#b9cbb0]">Ultima misurazione il {{ formatDay(last.date) }}</p>
      </div>

      <div class="ui-modal-body px-5 pb-5 space-y-3">
        <label class="ui-card p-4 flex items-center gap-4">
          <span class="flex-1 min-w-0">
            <span class="block text-xs text-[#8a918c] dark:text-[#8e9790]">Peso di oggi</span>
            <span class="flex items-baseline gap-1">
              <input
                v-model.number="weightKg"
                type="number"
                inputmode="decimal"
                step="0.1"
                :placeholder="last ? String(last.weightKg) : '72'"
                class="w-28 bg-transparent border-0 p-0 text-4xl font-bold text-[#1f2421] dark:text-white placeholder:text-[#d6dbd7] dark:placeholder:text-[#3a433c] focus:ring-0 focus:outline-none tabular-nums"
              />
              <span class="text-base text-[#8a918c]">kg</span>
            </span>
          </span>
          <span
            v-if="weightDelta !== null"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm font-semibold tabular-nums"
            :class="weightDelta <= 0 ? 'bg-[#eaf3dc] text-[#4c7a22] dark:bg-[#1f3320] dark:text-[#a7c49a]' : 'bg-[#fbeedd] text-[#9a5d1c] dark:bg-[#3a2a16] dark:text-[#f2b36b]'"
          >
            <component :is="weightDelta < 0 ? TrendDown : weightDelta > 0 ? TrendUp : Equals" class="w-4 h-4" weight="bold" />
            {{ weightDelta > 0 ? '+' : '' }}{{ weightDelta }}
          </span>
        </label>

        <div class="ui-card">
          <MeasurementFields v-model="measures" :previous="last" />
        </div>

        <div
          v-if="newTarget && newTarget !== mealStore.preferences.kcalGoal && mealStore.profile?.autoKcalGoal"
          class="ui-card p-4 flex items-center gap-3"
        >
          <span class="w-10 h-10 rounded-full bg-[#f2b36b] text-white flex items-center justify-center flex-shrink-0">
            <Fire class="w-5 h-5" />
          </span>
          <span class="text-sm text-[#1f2421] dark:text-white">
            Nuovo obiettivo: <strong class="tabular-nums">{{ newTarget }} kcal</strong>
            <span class="text-[#8a918c] tabular-nums"> (era {{ mealStore.preferences.kcalGoal }})</span>
          </span>
        </div>
      </div>

      <div class="px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-end gap-2 border-t border-black/5 dark:border-white/5">
        <button type="button" @click="closeMeasurement" class="ui-btn-ghost">Annulla</button>
        <button type="button" :disabled="!isValid" @click="save" class="ui-btn-primary">Salva</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  PhX as X,
  PhScales as Scales,
  PhTrendDown as TrendDown,
  PhTrendUp as TrendUp,
  PhEquals as Equals,
  PhFire as Fire,
} from '@phosphor-icons/vue'
import ShaderBackground from '~/components/ShaderBackground.vue'
import type { BodyMeasurement } from '~/types/meal'
import { useMealStore } from '~/stores/mealStore'
import { useProfileUi } from '~/composables/useProfileUi'
import { latestMeasurement, summarizeProfile } from '~/utils/body'
import { formatDateKey, parseDateKey } from '~/utils/date'
import MeasurementFields, { type MeasureValues } from '~/components/MeasurementFields.vue'

const mealStore = useMealStore()
const { closeMeasurement } = useProfileUi()

const last = latestMeasurement(mealStore.profile)
const weightKg = ref<number | null>(null)
const measures = ref<MeasureValues>({ waistCm: null, hipsCm: null, chestCm: null, armCm: null, thighCm: null })

const isValid = computed(() => typeof weightKg.value === 'number' && weightKg.value >= 30 && weightKg.value <= 300)

const weightDelta = computed(() =>
  isValid.value && last ? Math.round((Number(weightKg.value) - last.weightKg) * 10) / 10 : null
)

const buildMeasurement = (): BodyMeasurement => {
  const m: BodyMeasurement = { date: formatDateKey(new Date()), weightKg: Number(weightKg.value) }
  for (const [key, value] of Object.entries(measures.value)) {
    if (typeof value === 'number' && value > 0) m[key as keyof MeasureValues] = value
  }
  return m
}

const newTarget = computed(() => {
  if (!isValid.value || !mealStore.profile) return null
  const m = buildMeasurement()
  const others = mealStore.profile.measurements.filter((x) => x.date !== m.date)
  return summarizeProfile({ ...mealStore.profile, measurements: [...others, m] })?.targetKcal ?? null
})

const formatDay = (dateKey: string) =>
  parseDateKey(dateKey).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })

const save = () => {
  if (!isValid.value) return
  mealStore.addMeasurement(buildMeasurement())
  closeMeasurement()
}
</script>
