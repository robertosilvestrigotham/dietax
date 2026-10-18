<template>
  <div class="space-y-3">
    <!-- Week grid: sessions per day -->
    <div class="grid grid-cols-7 gap-1">
      <div v-for="day in DAYS_OF_WEEK_ORDER" :key="day" class="flex flex-col items-center gap-1 min-w-0">
        <span
          class="text-[10px] font-semibold uppercase"
          :class="selectedDay === day ? 'text-[#5f8a3a] dark:text-[#d4f65a]' : 'text-[#8a918c] dark:text-[#8e8f94]'"
        >
          {{ DAY_OF_WEEK_SHORT[day].slice(0, 3) }}
        </span>

        <button
          v-for="w in byDay(day)"
          :key="w.id"
          type="button"
          @click="remove(w.id)"
          class="w-full rounded-xl py-1.5 flex flex-col items-center transition active:scale-95"
          :class="w.type === 'strength' ? 'bg-[#7d7e84] text-white' : 'bg-[#ececee] text-[#16171a]'"
          :title="`${WORKOUT_TYPES[w.type].label} ${w.minutes} min — tocca per togliere`"
          :aria-label="`Togli ${WORKOUT_TYPES[w.type].label} ${w.minutes} minuti`"
        >
          <component :is="TYPE_ICONS[w.type]" class="w-4 h-4" weight="fill" />
          <span class="text-[10px] font-semibold tabular-nums leading-tight">{{ w.minutes }}'</span>
        </button>

        <button
          type="button"
          @click="selectedDay = selectedDay === day ? null : day"
          class="w-full aspect-square max-h-10 rounded-xl flex items-center justify-center transition"
          :class="
            selectedDay === day
              ? 'bg-[#d4f65a] text-[#16171a]'
              : 'border-2 border-dashed border-[#d6dfd1] dark:border-[#34353a] text-[#9aa19c] hover:border-[#d4f65a] hover:text-[#d4f65a]'
          "
          :aria-label="`Aggiungi allenamento ${DAY_OF_WEEK_LABELS[day]}`"
        >
          <Plus class="w-4 h-4" weight="bold" />
        </button>
      </div>
    </div>

    <!-- Add a session to the selected day -->
    <Transition name="pop">
      <div v-if="selectedDay" class="ui-panel p-3 space-y-3">
        <div class="text-xs font-semibold text-[#1f2421] dark:text-white capitalize">
          Nuovo allenamento · {{ DAY_OF_WEEK_LABELS[selectedDay] }}
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="(info, type) in WORKOUT_TYPES"
            :key="type"
            type="button"
            @click="draftType = type"
            class="py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition"
            :class="draftType === type ? (type === 'strength' ? 'bg-[#7d7e84] text-white' : 'bg-[#ececee] text-[#16171a]') : 'bg-white dark:bg-[#222326] text-[#4a524c] dark:text-[#c8c9cd]'"
          >
            <component :is="TYPE_ICONS[type]" class="w-5 h-5" />
            {{ info.label }}
          </button>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            v-for="m in DURATIONS"
            :key="m"
            type="button"
            @click="draftMinutes = m"
            class="flex-1 py-2 rounded-xl text-xs font-semibold tabular-nums transition"
            :class="draftMinutes === m ? 'bg-[#d4f65a] text-[#16171a]' : 'bg-white dark:bg-[#222326] text-[#4a524c] dark:text-[#c8c9cd]'"
          >
            {{ m }}'
          </button>
          <input
            v-model.number="draftMinutes"
            type="number"
            min="5"
            max="300"
            inputmode="numeric"
            class="w-16 ui-input bg-white dark:bg-[#222326] text-xs text-center px-1 py-2"
            aria-label="Minuti"
          />
        </div>
        <button type="button" :disabled="!draftMinutes || draftMinutes < 5" @click="add" class="ui-btn-primary w-full py-2 text-xs">
          Aggiungi · ~{{ draftKcal }} kcal
        </button>
      </div>
    </Transition>

    <!-- Week summary -->
    <div class="flex items-center justify-between text-xs">
      <span class="text-[#8a918c] dark:text-[#8e8f94]">
        <template v-if="modelValue.length">
          {{ modelValue.length }} {{ modelValue.length === 1 ? 'allenamento' : 'allenamenti' }} · {{ totalHours }}
        </template>
        <template v-else>Nessun allenamento: tocca + sotto un giorno</template>
      </span>
      <span v-if="modelValue.length" class="font-semibold tabular-nums text-[#1f2421] dark:text-white">
        ~{{ weeklyKcal }} kcal/settimana
      </span>
    </div>
    <div class="flex gap-3 text-[11px] text-[#8a918c]">
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#7d7e84]"></span>Forza</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#ececee]"></span>Cardio</span>
      <span class="ml-auto">Tocca un allenamento per toglierlo</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { PhBarbell, PhPersonSimpleRun, PhPlus as Plus } from '@phosphor-icons/vue'
import type { DayOfWeek, Workout, WorkoutType } from '~/types/meal'
import { DAYS_OF_WEEK_ORDER, DAY_OF_WEEK_LABELS, DAY_OF_WEEK_SHORT } from '~/types/meal'
import { WORKOUT_TYPES, workoutKcal, weeklyWorkoutKcal } from '~/utils/body'

const props = defineProps<{
  modelValue: Workout[]
  weightKg: number
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: Workout[]): void }>()

const TYPE_ICONS: Record<WorkoutType, Component> = { strength: PhBarbell, cardio: PhPersonSimpleRun }
const DURATIONS = [30, 45, 60, 90]

const selectedDay = ref<DayOfWeek | null>(null)
const draftType = ref<WorkoutType>('strength')
const draftMinutes = ref<number>(60)

const byDay = (day: DayOfWeek) => props.modelValue.filter((w) => w.day === day)

const draftKcal = computed(() => workoutKcal(draftType.value, draftMinutes.value || 0, props.weightKg))
const weeklyKcal = computed(() => weeklyWorkoutKcal(props.modelValue, props.weightKg))
const totalHours = computed(() => {
  const minutes = props.modelValue.reduce((sum, w) => sum + w.minutes, 0)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h} h${m ? ` ${m}'` : ''}` : `${m}'`
})

const add = () => {
  if (!selectedDay.value || !draftMinutes.value) return
  const workout: Workout = {
    id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    day: selectedDay.value,
    type: draftType.value,
    minutes: Math.round(draftMinutes.value),
  }
  emit('update:modelValue', [...props.modelValue, workout])
  selectedDay.value = null
}

const remove = (id: string) => {
  emit(
    'update:modelValue',
    props.modelValue.filter((w) => w.id !== id)
  )
}
</script>

<style scoped>
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
