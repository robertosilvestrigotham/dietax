<template>
  <div class="ui-modal-backdrop" @click.self="closePlanScaling">
    <div class="ui-modal sm:max-w-lg">
      <!-- Hero -->
      <div class="relative isolate overflow-hidden px-5 pt-5 pb-5 bg-gradient-to-br from-[#e3f2d3] to-[#eef5c8] dark:from-[#1b3420] dark:to-[#1f2c14]">
        <ShaderBackground class="-z-10" />
        <div class="flex items-start justify-between gap-3">
          <span class="w-14 h-14 rounded-[20px] bg-white/75 dark:bg-white/10 backdrop-blur flex items-center justify-center shadow-[0_6px_20px_rgba(60,100,40,0.12)]">
            <MagicWand class="w-8 h-8 text-[#5f8a3a] dark:text-[#a7c49a]" />
          </span>
          <button type="button" @click="closePlanScaling" class="w-9 h-9 rounded-full flex items-center justify-center bg-white/60 dark:bg-white/10 text-[#1f2421] dark:text-white" aria-label="Chiudi">
            <X class="w-4 h-4" weight="bold" />
          </button>
        </div>
        <h3 class="mt-4 text-2xl font-bold tracking-tight text-[#1f2421] dark:text-white">Adatta il menù</h3>
        <p class="text-sm text-[#4a5a44] dark:text-[#b9cbb0]">
          Porzioni ricalcolate su <strong class="tabular-nums">{{ target }} kcal</strong> al giorno. Gli alimenti restano gli stessi.
        </p>
      </div>

      <div class="ui-modal-body px-5 py-5 space-y-3">
        <PlanScalingPreview :result="result" />

      </div>

      <div class="px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-end gap-2 border-t border-black/5 dark:border-white/5">
        <button type="button" @click="closePlanScaling" class="ui-btn-ghost">Lascia com'è</button>
        <button type="button" :disabled="!hasChanges" @click="apply" class="ui-btn-primary">
          <Check class="w-4 h-4" weight="bold" />
          Applica
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  PhMagicWand as MagicWand,
  PhX as X,
  PhCheck as Check,
} from '@phosphor-icons/vue'
import { useMealStore } from '~/stores/mealStore'
import { useProfileUi } from '~/composables/useProfileUi'
import { summarizeProfile } from '~/utils/body'
import { scalePlanToTarget } from '~/utils/planScaling'
import ShaderBackground from '~/components/ShaderBackground.vue'
import PlanScalingPreview from '~/components/PlanScalingPreview.vue'

const mealStore = useMealStore()
const { closePlanScaling } = useProfileUi()

const target = computed(
  () =>
    mealStore.preferences.kcalGoal ??
    (mealStore.profile ? summarizeProfile(mealStore.profile)?.targetKcal : undefined) ??
    2000
)

// Computed once when the sheet opens: the preview must not shift while reading it
const result = scalePlanToTarget(mealStore.plan, target.value)

const hasChanges = result.days.some((d) => d.changes.length > 0)

const apply = () => {
  mealStore.applyPlan(result.plan)
  closePlanScaling()
}
</script>
