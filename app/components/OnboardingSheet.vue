<template>
  <div class="ui-modal-backdrop">
    <div class="ui-modal sm:max-w-lg">
      <!-- Hero: animated background, step icon and title -->
      <div class="relative isolate overflow-hidden px-5 pt-5 pb-6 bg-gradient-to-br from-[#e3f2d3] to-[#eef5c8] dark:from-[#1b3420] dark:to-[#1f2c14]">
        <ShaderBackground class="-z-10" />
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
          <button
            v-if="step > 0"
            type="button"
            @click="step--"
            class="w-8 h-8 -ml-1 rounded-full flex items-center justify-center bg-white/60 dark:bg-white/10 text-[#1f2421] dark:text-white hover:bg-white/80 transition"
            aria-label="Indietro"
          >
            <ArrowLeft class="w-4 h-4" weight="bold" />
          </button>
          <div class="flex gap-1.5">
            <span
              v-for="i in STEPS"
              :key="i"
              class="h-1.5 rounded-full transition-all duration-300"
              :class="i - 1 === step ? 'w-6 bg-[#1f2421] dark:bg-white' : i - 1 < step ? 'w-1.5 bg-[#1f2421]/50 dark:bg-white/60' : 'w-1.5 bg-[#1f2421]/15 dark:bg-white/20'"
            ></span>
          </div>
          </div>
          <button type="button" @click="skip" class="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/10 text-[#1f2421] dark:text-white hover:bg-white/80 transition">
            {{ isEditing ? 'Chiudi' : 'Più tardi' }}
          </button>
        </div>

        <Transition name="hero" mode="out-in">
          <div :key="step" class="mt-6 flex items-end gap-4">
            <span class="w-16 h-16 rounded-[22px] bg-white/75 dark:bg-white/10 backdrop-blur flex items-center justify-center flex-shrink-0 shadow-[0_6px_20px_rgba(60,100,40,0.12)]">
              <component :is="HERO[step]!.icon" class="w-9 h-9 text-[#5f8a3a] dark:text-[#a7c49a]" />
            </span>
            <div class="min-w-0 pb-0.5">
              <h2 class="text-2xl font-bold tracking-tight text-[#1f2421] dark:text-white leading-tight">{{ HERO[step]!.title }}</h2>
              <p class="text-sm text-[#4a5a44] dark:text-[#b9cbb0] mt-0.5">{{ HERO[step]!.subtitle }}</p>
            </div>
          </div>
        </Transition>
      </div>

      <div class="ui-modal-body px-5 py-5">
        <Transition name="step" mode="out-in">
          <!-- 1. Who -->
          <section v-if="step === 0" key="0" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="opt in SEX_OPTIONS"
                :key="opt.value"
                type="button"
                @click="form.sex = opt.value"
                class="ui-card p-4 flex flex-col items-center gap-2 transition active:scale-[0.98]"
                :class="form.sex === opt.value ? 'ring-2 ring-[#8cc63f] bg-[#f4faec] dark:bg-[#1f2c1f]' : ''"
              >
                <span
                  class="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
                  :class="form.sex === opt.value ? 'bg-[#8cc63f] text-white' : 'bg-[#f1f4ef] dark:bg-[#18221b] text-[#8a918c]'"
                >
                  <component :is="opt.icon" class="w-7 h-7" />
                </span>
                <span class="text-sm font-semibold text-[#1f2421] dark:text-white">{{ opt.label }}</span>
              </button>
            </div>
            <label class="ui-card p-4 flex items-center gap-3">
              <span class="w-10 h-10 rounded-full bg-[#f1f4ef] dark:bg-[#18221b] text-[#8fb57a] flex items-center justify-center flex-shrink-0">
                <Cake class="w-5 h-5" />
              </span>
              <span class="flex-1 min-w-0">
                <span class="block text-xs text-[#8a918c] dark:text-[#8e9790]">Anno di nascita</span>
                <input
                  v-model.number="form.birthYear"
                  type="number"
                  inputmode="numeric"
                  placeholder="1985"
                  class="w-full bg-transparent border-0 p-0 text-xl font-bold text-[#1f2421] dark:text-white placeholder:text-[#c3c8c4] focus:ring-0 focus:outline-none tabular-nums"
                />
              </span>
              <span v-if="isValidYear(form.birthYear)" class="text-sm font-semibold text-[#5f8a3a] dark:text-[#a7c49a] tabular-nums">
                {{ currentYear - Number(form.birthYear) }} anni
              </span>
            </label>
          </section>

          <!-- 2. Body -->
          <section v-else-if="step === 1" key="1" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <label v-for="field in BODY_FIELDS" :key="field.key" class="ui-card p-4 flex flex-col items-center text-center">
                <span class="w-12 h-12 rounded-full bg-[#f1f4ef] dark:bg-[#18221b] text-[#8fb57a] flex items-center justify-center">
                  <component :is="field.icon" class="w-6 h-6" />
                </span>
                <span class="mt-2 text-xs text-[#8a918c] dark:text-[#8e9790]">{{ field.label }}</span>
                <span class="flex items-baseline justify-center gap-1">
                  <input
                    v-model.number="form[field.key]"
                    type="number"
                    inputmode="decimal"
                    :step="field.step"
                    :placeholder="field.placeholder"
                    class="w-24 bg-transparent border-0 p-0 text-center text-3xl font-bold text-[#1f2421] dark:text-white placeholder:text-[#d6dbd7] dark:placeholder:text-[#3a433c] focus:ring-0 focus:outline-none tabular-nums"
                  />
                  <span class="text-sm text-[#8a918c]">{{ field.unit }}</span>
                </span>
              </label>
            </div>
            <div v-if="liveBmi" class="ui-card p-4">
              <BmiScale :bmi="liveBmi" />
            </div>
          </section>

          <!-- 3. Measurements -->
          <section v-else-if="step === 2" key="2" class="ui-card">
            <MeasurementFields v-model="form.measures" />
          </section>

          <!-- 4. Daily life + weekly workouts -->
          <section v-else-if="step === 3" key="3" class="space-y-3">
            <div class="ui-card p-3 space-y-2">
              <span class="ui-label px-1">Giornata tipo, senza allenamenti</span>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="(info, key) in LIFESTYLES"
                  :key="key"
                  type="button"
                  @click="form.lifestyle = key"
                  class="p-3 rounded-2xl flex flex-col items-center gap-1.5 text-center transition active:scale-[0.98]"
                  :class="form.lifestyle === key ? 'bg-[#8cc63f] text-white' : 'bg-[#f1f4ef] dark:bg-[#18221b] text-[#1f2421] dark:text-white'"
                >
                  <component
                    :is="LIFESTYLE_ICONS[key]"
                    class="w-7 h-7"
                    :class="form.lifestyle === key ? '' : 'text-[#8fb57a]'"
                  />
                  <span class="text-xs font-semibold">{{ info.label }}</span>
                </button>
              </div>
              <p class="ui-muted px-1">{{ LIFESTYLES[form.lifestyle].hint }}</p>
            </div>

            <div class="ui-card space-y-2">
              <div>
                <span class="text-sm font-semibold text-[#1f2421] dark:text-white">Allenamenti della settimana</span>
                <p class="ui-muted">Aggiungi le sessioni nei giorni in cui ti alleni.</p>
              </div>
              <WorkoutWeekEditor v-model="form.workouts" :weight-kg="Number(form.weightKg) || 70" />
            </div>
          </section>

          <!-- 5. Goal -->
          <section v-else-if="step === 4" key="4" class="space-y-3">
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="(info, key) in WEIGHT_GOALS"
                :key="key"
                type="button"
                @click="form.goal = key"
                class="ui-card p-3 flex flex-col items-center gap-1.5 transition active:scale-[0.98]"
                :class="form.goal === key ? 'ring-2 ring-[#8cc63f] bg-[#f4faec] dark:bg-[#1f2c1f]' : ''"
              >
                <span
                  class="w-11 h-11 rounded-full flex items-center justify-center"
                  :class="form.goal === key ? 'bg-[#8cc63f] text-white' : 'bg-[#f1f4ef] dark:bg-[#18221b] text-[#8a918c]'"
                >
                  <component :is="GOAL_ICONS[key]" class="w-6 h-6" />
                </span>
                <span class="text-xs font-semibold text-center text-[#1f2421] dark:text-white leading-tight">{{ info.label }}</span>
              </button>
            </div>
            <p class="ui-muted text-center">{{ WEIGHT_GOALS[form.goal].hint }}</p>
          </section>

          <!-- 5. Result -->
          <section v-else-if="step === RESULT_STEP && summary" key="5" class="space-y-3">
            <div class="ui-card flex items-center gap-4">
              <!-- Target vs maintenance -->
              <AppleActivityRings :values="resultRings" :size="104" class="flex-shrink-0">
                <Fire class="w-7 h-7 text-[#f2b36b]" />
              </AppleActivityRings>
              <div class="min-w-0">
                <span class="ui-muted">Obiettivo giornaliero</span>
                <div class="text-4xl font-bold tracking-tight tabular-nums text-[#1f2421] dark:text-white leading-none my-1">
                  {{ summary.targetKcal }}<span class="text-base font-semibold text-[#8a918c] ml-1">kcal</span>
                </div>
                <span class="inline-flex items-center gap-1 text-xs font-semibold text-[#5f8a3a] dark:text-[#a7c49a]">
                  <component :is="GOAL_ICONS[form.goal]" class="w-3.5 h-3.5" />
                  {{ WEIGHT_GOALS[form.goal].label }}
                </span>
              </div>
            </div>

            <!-- Where the daily need comes from -->
            <div class="ui-card space-y-3">
              <div class="flex items-baseline justify-between">
                <span class="text-sm font-semibold text-[#1f2421] dark:text-white">Fabbisogno giornaliero</span>
                <span class="text-lg font-bold tabular-nums text-[#1f2421] dark:text-white">{{ summary.tdee }} kcal</span>
              </div>
              <div class="flex gap-0.5 h-2.5 rounded-full overflow-hidden">
                <div
                  v-for="part in needParts"
                  :key="part.label"
                  class="h-full"
                  :class="part.bar"
                  :style="{ width: `${(part.kcal / summary.tdee) * 100}%` }"
                ></div>
              </div>
              <ul class="space-y-1.5">
                <li v-for="part in needParts" :key="part.label" class="flex items-center gap-2.5 text-xs">
                  <span class="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0" :class="part.bar">
                    <component :is="part.icon" class="w-4 h-4" weight="fill" />
                  </span>
                  <span class="flex-1 text-[#4a524c] dark:text-[#c9d1cb]">{{ part.label }}</span>
                  <span class="font-semibold tabular-nums text-[#1f2421] dark:text-white">{{ part.kcal }}</span>
                </li>
              </ul>
            </div>

            <div class="ui-card p-4 space-y-1">
              <span class="ui-muted">Indice di massa corporea</span>
              <BmiScale :bmi="summary.bmi" />
            </div>

            <div class="ui-card space-y-3">
              <!-- Plan vs target -->
              <div class="space-y-1.5">
                <div class="flex justify-between text-xs">
                  <span class="text-[#8a918c]">Il tuo piano</span>
                  <span class="font-semibold tabular-nums text-[#1f2421] dark:text-white">{{ planAverageKcal }} kcal</span>
                </div>
                <div class="relative h-2 rounded-full bg-[#f1f4ef] dark:bg-[#18221b]">
                  <div class="absolute inset-y-0 left-0 rounded-full bg-[#ab9cf0]" :style="{ width: `${planBarWidth}%` }"></div>
                  <div class="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-[#1f2421] dark:bg-white" :style="{ left: `${targetBarPosition}%` }"></div>
                </div>
                <p class="text-xs text-[#8a918c]">{{ planDeltaLabel }}</p>
              </div>

              <label class="flex items-center justify-between gap-3 cursor-pointer pt-1">
                <span class="text-sm font-medium text-[#1f2421] dark:text-white">Usa come obiettivo calorie</span>
                <span class="relative inline-flex items-center flex-shrink-0">
                  <input v-model="form.autoKcalGoal" type="checkbox" class="sr-only peer" />
                  <span
                    class="w-11 h-6 rounded-full bg-[#d6dfd1] dark:bg-[#2c342e] peer-checked:bg-[#8cc63f] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
                  ></span>
                </span>
              </label>
              <button type="button" @click="downloadMeasurementReminder" class="w-full ui-panel px-3 py-2.5 flex items-center gap-3 text-left hover:bg-[#e9eee6] dark:hover:bg-[#1d2820] transition">
                <CalendarPlus class="w-5 h-5 text-[#8fb57a] flex-shrink-0" />
                <span class="flex-1 text-xs font-medium text-[#1f2421] dark:text-white">Promemoria ogni 2 settimane nel calendario</span>
              </button>
            </div>

            <p class="px-1 text-[11px] leading-relaxed text-[#8a918c] dark:text-[#6f7872]">
              Stima con la formula di Mifflin-St Jeor. Non sostituisce il parere di un medico o di un nutrizionista.
            </p>
          </section>

          <!-- 7. Menu adapted to the goal -->
          <section v-else-if="step === MENU_STEP" key="6" class="space-y-3">
            <!-- Short, honest progress: the computation itself is instant -->
            <div v-if="isPreparing" class="ui-card py-8 flex flex-col items-center gap-5">
              <span class="relative w-16 h-16">
                <span class="absolute inset-0 rounded-full border-4 border-[#e4eed7] dark:border-[#24332a]"></span>
                <span class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#8cc63f] animate-spin"></span>
                <MagicWand class="absolute inset-0 m-auto w-7 h-7 text-[#5f8a3a] dark:text-[#a7c49a]" />
              </span>
              <ul class="space-y-2 w-full max-w-[16rem]">
                <li
                  v-for="(label, i) in PREP_STEPS"
                  :key="label"
                  class="flex items-center gap-2.5 text-sm transition-opacity duration-300"
                  :class="i <= prepIndex ? 'opacity-100' : 'opacity-30'"
                >
                  <span
                    class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                    :class="i < prepIndex ? 'bg-[#8cc63f] text-white' : 'bg-[#f1f4ef] dark:bg-[#18221b]'"
                  >
                    <CheckIcon v-if="i < prepIndex" class="w-3 h-3" weight="bold" />
                  </span>
                  <span class="text-[#1f2421] dark:text-white">{{ label }}</span>
                </li>
              </ul>
            </div>

            <template v-else-if="menuResult">
              <div v-if="!menuHasChanges" class="ui-card p-5 flex items-center gap-3">
                <span class="w-11 h-11 rounded-full bg-[#8cc63f] text-white flex items-center justify-center flex-shrink-0">
                  <CheckIcon class="w-6 h-6" weight="bold" />
                </span>
                <span class="text-sm text-[#1f2421] dark:text-white">
                  Il tuo menù è già in linea con l'obiettivo di <strong class="tabular-nums">{{ menuTarget }} kcal</strong>. Non serve cambiare nulla.
                </span>
              </div>
              <PlanScalingPreview v-else :result="menuResult" />
            </template>
          </section>
        </Transition>
      </div>

      <!-- Footer -->
      <div class="px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/5">
        <button v-if="step > 0" type="button" @click="step--" class="ui-btn-ghost">
          <ArrowLeft class="w-4 h-4" />
          Indietro
        </button>
        <span v-else></span>
        <button v-if="step < STEPS - 1" type="button" :disabled="!canContinue" @click="step++" class="ui-btn-primary">
          {{ step === 2 && !hasMeasures ? 'Salta' : step === RESULT_STEP ? 'Vedi il menù' : 'Avanti' }}
          <ArrowRight class="w-4 h-4" weight="bold" />
        </button>
        <div v-else class="flex items-center gap-1">
          <button v-if="menuHasChanges" type="button" :disabled="isPreparing" @click="finish(false)" class="ui-btn-ghost text-xs px-3">
            Tieni il mio
          </button>
          <button type="button" :disabled="isPreparing" @click="finish(menuHasChanges)" class="ui-btn-primary">
            <Sparkle class="w-4 h-4" weight="fill" />
            {{ menuHasChanges ? 'Applica e inizia' : 'Iniziamo' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch, type Component } from 'vue'
import {
  PhCalendarPlus as CalendarPlus,
  PhHandWaving,
  PhRuler,
  PhScales,
  PhPersonArmsSpread,
  PhTarget,
  PhGenderFemale,
  PhGenderMale,
  PhCake as Cake,
  PhBarbell,
  PhDesk,
  PhStorefront,
  PhHardHat,
  PhPersonSimpleWalk,
  PhTrendDown,
  PhEquals,
  PhTrendUp,
  PhFire as Fire,
  PhBed as Bed,
  PhSparkle as Sparkle,
  PhArrowLeft as ArrowLeft,
  PhMagicWand as MagicWand,
  PhCheck as CheckIcon,
  PhArrowRight as ArrowRight,
} from '@phosphor-icons/vue'
import type { BodyMeasurement, Lifestyle, Sex, UserProfile, WeightGoal, Workout } from '~/types/meal'
import { DAYS_OF_WEEK_ORDER } from '~/types/meal'
import { useMealStore } from '~/stores/mealStore'
import { useProfileUi } from '~/composables/useProfileUi'
import { LIFESTYLES, WEIGHT_GOALS, calculateBmi, latestMeasurement, summarizeProfile } from '~/utils/body'
import WorkoutWeekEditor from '~/components/WorkoutWeekEditor.vue'
import PlanScalingPreview from '~/components/PlanScalingPreview.vue'
import { scalePlanToTarget, type PlanScalingResult } from '~/utils/planScaling'
import { calculateDayKcal } from '~/utils/nutrition'
import ShaderBackground from '~/components/ShaderBackground.vue'
import BmiScale from '~/components/BmiScale.vue'
import AppleActivityRings from '~/components/AppleActivityRings.vue'
import { formatDateKey } from '~/utils/date'
import MeasurementFields, { type MeasureValues } from '~/components/MeasurementFields.vue'

const STEPS = 7
const RESULT_STEP = 5
const MENU_STEP = 6
const PREP_STEPS = ['Fabbisogno calcolato', 'Porzioni adattate', 'Carboidrati ricalcolati']
const SEX_OPTIONS: { value: Sex; label: string; icon: Component }[] = [
  { value: 'female', label: 'Donna', icon: PhGenderFemale },
  { value: 'male', label: 'Uomo', icon: PhGenderMale },
]

const HERO: { icon: Component; title: string; subtitle: string }[] = [
  { icon: PhHandWaving, title: 'Ciao!', subtitle: 'Due dati per stimare il tuo fabbisogno.' },
  { icon: PhRuler, title: 'Altezza e peso', subtitle: 'Il punto di partenza.' },
  { icon: PhPersonArmsSpread, title: 'Misure', subtitle: 'Facoltative: la mattina, a digiuno.' },
  { icon: PhBarbell, title: 'Movimento', subtitle: 'La tua giornata e i tuoi allenamenti.' },
  { icon: PhTarget, title: 'Obiettivo', subtitle: 'Dove vuoi arrivare.' },
  { icon: Sparkle, title: 'Il tuo obiettivo', subtitle: 'Calcolato su di te, modificabile quando vuoi.' },
  { icon: MagicWand, title: 'Il tuo menù', subtitle: 'Stessi piatti, porzioni sul tuo obiettivo.' },
]

const BODY_FIELDS = [
  { key: 'heightCm' as const, label: 'Altezza', unit: 'cm', step: '1', placeholder: '175', icon: PhRuler },
  { key: 'weightKg' as const, label: 'Peso', unit: 'kg', step: '0.1', placeholder: '72', icon: PhScales },
]

const LIFESTYLE_ICONS: Record<Lifestyle, Component> = {
  sedentary: PhDesk,
  standing: PhStorefront,
  physical: PhHardHat,
}
const GOAL_ICONS: Record<WeightGoal, Component> = { lose: PhTrendDown, maintain: PhEquals, gain: PhTrendUp }

const mealStore = useMealStore()
const { closeOnboarding, downloadMeasurementReminder } = useProfileUi()

const existing = mealStore.profile
const last = latestMeasurement(existing)
const isEditing = Boolean(existing)

const step = ref(0)
const form = reactive({
  sex: (existing?.sex ?? 'female') as Sex,
  birthYear: existing?.birthYear ?? (null as number | null),
  heightCm: existing?.heightCm ?? (null as number | null),
  weightKg: last?.weightKg ?? (null as number | null),
  measures: {
    waistCm: last?.waistCm ?? null,
    hipsCm: last?.hipsCm ?? null,
    chestCm: last?.chestCm ?? null,
    armCm: last?.armCm ?? null,
    thighCm: last?.thighCm ?? null,
  } as MeasureValues,
  lifestyle: (existing?.lifestyle ?? 'sedentary') as Lifestyle,
  workouts: (existing?.workouts ?? []) as Workout[],
  goal: (existing?.goal ?? 'maintain') as WeightGoal,
  autoKcalGoal: existing?.autoKcalGoal ?? true,
})

const currentYear = new Date().getFullYear()
const isValidYear = (y: number | null) => !!y && y >= currentYear - 100 && y <= currentYear - 14
const isPositive = (n: number | null, min: number, max: number) => !!n && n >= min && n <= max

const canContinue = computed(() => {
  if (step.value === 0) return isValidYear(form.birthYear)
  if (step.value === 1) return isPositive(form.heightCm, 120, 230) && isPositive(form.weightKg, 30, 300)
  return true
})

const hasMeasures = computed(() => Object.values(form.measures).some((v) => typeof v === 'number' && v > 0))

const buildMeasurement = (): BodyMeasurement => {
  const m: BodyMeasurement = { date: formatDateKey(new Date()), weightKg: Number(form.weightKg) }
  for (const [key, value] of Object.entries(form.measures)) {
    if (typeof value === 'number' && value > 0) m[key as keyof MeasureValues] = value
  }
  return m
}

const buildProfile = (): UserProfile => {
  const today = buildMeasurement()
  // Keep history; today's values replace an entry with the same date
  const history = (existing?.measurements ?? []).filter((m) => m.date !== today.date)
  return {
    sex: form.sex,
    birthYear: Number(form.birthYear),
    heightCm: Number(form.heightCm),
    lifestyle: form.lifestyle,
    workouts: form.workouts,
    goal: form.goal,
    measurements: [...history, today],
    autoKcalGoal: form.autoKcalGoal,
  }
}

const summary = computed(() => (step.value >= RESULT_STEP ? summarizeProfile(buildProfile()) : null))

const planAverageKcal = computed(() => {
  const total = DAYS_OF_WEEK_ORDER.reduce(
    (sum, day) => sum + calculateDayKcal({ dayPlan: mealStore.getDayPlan(day) }).totalKcal,
    0
  )
  return Math.round(total / DAYS_OF_WEEK_ORDER.length)
})

// Daily need split: rest, everyday movement, workouts
const needParts = computed(() => {
  if (!summary.value) return []
  const { bmr, dailyLifeKcal, workoutKcalPerDay } = summary.value
  return [
    { label: 'A riposo', kcal: bmr, icon: Bed, bar: 'bg-[#ab9cf0]' },
    { label: 'Movimento quotidiano', kcal: dailyLifeKcal - bmr, icon: PhPersonSimpleWalk, bar: 'bg-[#8fb57a]' },
    { label: 'Allenamenti (media al giorno)', kcal: workoutKcalPerDay, icon: PhBarbell, bar: 'bg-[#f2b36b]' },
  ].filter((part) => part.kcal > 0)
})

const liveBmi = computed(() =>
  isPositive(form.heightCm, 120, 230) && isPositive(form.weightKg, 30, 300)
    ? calculateBmi(Number(form.weightKg), Number(form.heightCm))
    : null
)

// Result rings: target vs maintenance (orange) and plan vs target (lavender)
const resultRings = computed(() => {
  if (!summary.value) return []
  return [
    { key: 'target', pct: Math.min(100, (summary.value.targetKcal / summary.value.tdee) * 100), color: '#f2b36b' },
    { key: 'plan', pct: Math.min(100, (planAverageKcal.value / summary.value.targetKcal) * 100), color: '#ab9cf0' },
  ]
})

// Plan bar scaled on the larger of plan and target (+15% headroom)
const barScale = computed(() => Math.max(planAverageKcal.value, summary.value?.targetKcal ?? 0) * 1.15 || 1)
const planBarWidth = computed(() => (planAverageKcal.value / barScale.value) * 100)
const targetBarPosition = computed(() => ((summary.value?.targetKcal ?? 0) / barScale.value) * 100)

const planDeltaLabel = computed(() => {
  if (!summary.value) return ''
  const delta = planAverageKcal.value - summary.value.targetKcal
  if (Math.abs(delta) < 100) return 'In linea con l’obiettivo (la tacca).'
  return delta > 0
    ? `${delta} kcal al giorno sopra l’obiettivo (la tacca).`
    : `${-delta} kcal al giorno sotto l’obiettivo (la tacca).`
})

// ─── Menu step ──────────────────────────────────────────────────────────────
const menuTarget = computed(() => summary.value?.targetKcal ?? 0)
const menuResult = ref<PlanScalingResult | null>(null)
const menuHasChanges = computed(() => Boolean(menuResult.value?.days.some((d) => d.changes.length > 0)))
const isPreparing = ref(false)
const prepIndex = ref(0)
let prepTimer: ReturnType<typeof setInterval> | undefined

watch(step, (value) => {
  clearInterval(prepTimer)
  if (value !== MENU_STEP || !menuTarget.value) return
  // The scaling is instant; the short staged reveal just makes the step readable
  menuResult.value = scalePlanToTarget(mealStore.plan, menuTarget.value)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  isPreparing.value = true
  prepIndex.value = 0
  prepTimer = setInterval(
    () => {
      prepIndex.value++
      if (prepIndex.value > PREP_STEPS.length) {
        clearInterval(prepTimer)
        isPreparing.value = false
      }
    },
    reduceMotion ? 80 : 420
  )
})

onBeforeUnmount(() => clearInterval(prepTimer))

const finish = (applyMenu: boolean) => {
  mealStore.saveProfile(buildProfile())
  if (applyMenu && menuResult.value) mealStore.applyPlan(menuResult.value.plan)
  closeOnboarding()
}

const skip = () => {
  if (!isEditing) mealStore.dismissOnboarding()
  closeOnboarding()
}
</script>

<style scoped>
.hero-enter-active,
.hero-leave-active,
.step-enter-active,
.step-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.hero-enter-from,
.step-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.hero-leave-to,
.step-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
