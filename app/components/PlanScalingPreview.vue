<template>
  <div class="space-y-3">
  <!-- Week average before → after -->
  <div class="ui-card grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
    <div>
      <div class="ui-muted">Ora</div>
      <div class="text-2xl font-bold tabular-nums text-[#8a918c]">{{ average.before }}</div>
    </div>
    <ArrowRight class="w-5 h-5 text-[#9fb83f]" weight="bold" />
    <div>
      <div class="ui-muted">Dopo</div>
      <div class="text-2xl font-bold tabular-nums text-[#1f2421] dark:text-white">{{ average.after }}</div>
    </div>
    <div class="col-span-3 ui-muted">kcal medie al giorno · CHO {{ average.beforeCho }} → {{ average.afterCho }} g</div>
  </div>

  <!-- Per day -->
  <div v-for="day in result.days" :key="day.dayOfWeek" class="ui-card p-4">
    <button
      type="button"
      class="w-full flex items-center gap-3 text-left"
      :disabled="day.changes.length === 0"
      @click="toggle(day.dayOfWeek)"
    >
      <span class="w-10 text-xs font-semibold uppercase text-[#8a918c] dark:text-[#8e8f94]">{{ DAY_OF_WEEK_SHORT[day.dayOfWeek] }}</span>
      <span class="flex-1 min-w-0 text-sm tabular-nums">
        <span class="text-[#8a918c]">{{ day.beforeKcal }}</span>
        <span class="mx-1 text-[#c3c8c4]">→</span>
        <span class="font-semibold text-[#1f2421] dark:text-white">{{ day.afterKcal }} kcal</span>
      </span>
      <span v-if="day.changes.length === 0" class="text-xs text-[#8a918c]">Già in linea</span>
      <template v-else>
        <span class="text-xs tabular-nums text-[#8a918c]">{{ day.changes.length }} porzioni</span>
        <CaretDown class="w-4 h-4 text-[#9aa19c] transition-transform" :class="open.has(day.dayOfWeek) ? 'rotate-180' : ''" />
      </template>
    </button>

    <p v-if="day.clamped" class="mt-2 flex items-start gap-1.5 text-[11px] text-[#9a5d1c] dark:text-[#f2b36b]">
      <Warning class="w-3.5 h-3.5 flex-shrink-0 mt-px" />
      Porzioni al limite (±40%): il giorno resta a {{ day.afterKcal }} kcal.
    </p>

    <ul v-if="open.has(day.dayOfWeek)" class="mt-2 space-y-1">
      <li
        v-for="(change, i) in day.changes"
        :key="i"
        class="ui-panel px-3 py-2 flex items-center justify-between gap-2 text-xs"
      >
        <span class="min-w-0 truncate">
          <span class="text-[#8a918c]">{{ MEAL_SLOT_LABELS[change.slot] }} · </span>
          <span class="text-[#1f2421] dark:text-white">{{ change.name }}</span>
        </span>
        <span class="tabular-nums flex-shrink-0">
          <span class="text-[#8a918c] line-through">{{ change.from }}</span>
          <span class="ml-1.5 font-semibold" :class="change.to < change.from ? 'text-[#5f8a3a] dark:text-[#d4f65a]' : 'text-[#9a5d1c] dark:text-[#f2b36b]'">
            {{ change.to }} {{ change.unit }}
          </span>
        </span>
      </li>
    </ul>
  </div>

  <p class="px-1 text-[11px] leading-relaxed text-[#8a918c] dark:text-[#6b6c71]">
    Verdure, ingredienti q.b., frutta a pezzi e pasti fuori casa non cambiano. I pasti già confermati restano com'erano.
    Puoi annullare da Opzioni.
  </p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import {
  PhArrowRight as ArrowRight,
  PhCaretDown as CaretDown,
  PhWarning as Warning,
} from '@phosphor-icons/vue'
import type { DayOfWeek } from '~/types/meal'
import { DAY_OF_WEEK_SHORT, MEAL_SLOT_LABELS } from '~/types/meal'
import type { PlanScalingResult } from '~/utils/planScaling'

const props = defineProps<{ result: PlanScalingResult }>()

const avg = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) / values.length)
const average = computed(() => ({
  before: avg(props.result.days.map((d) => d.beforeKcal)),
  after: avg(props.result.days.map((d) => d.afterKcal)),
  beforeCho: avg(props.result.days.map((d) => d.beforeCho)),
  afterCho: avg(props.result.days.map((d) => d.afterCho)),
}))

const open = reactive(new Set<DayOfWeek>())
const toggle = (day: DayOfWeek) => (open.has(day) ? open.delete(day) : open.add(day))
</script>
