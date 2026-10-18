<template>
  <div class="space-y-4 max-w-3xl mx-auto">
    <!-- Profile -->
    <section class="ui-card space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="ui-title">Profilo</h2>
        <button v-if="mealStore.profile" type="button" @click="openOnboarding" class="ui-chip bg-[#f1f4ef] dark:bg-[#2b2c30]">
          Modifica
        </button>
      </div>

      <template v-if="mealStore.profile && profileSummary">
        <div class="grid grid-cols-3 gap-2">
          <div v-for="tile in profileTiles" :key="tile.label" class="ui-panel p-3">
            <component :is="tile.icon" class="w-5 h-5" :class="tile.iconClass" />
            <div class="mt-1.5 text-lg font-bold tabular-nums text-[#1f2421] dark:text-white leading-tight">{{ tile.value }}</div>
            <div class="text-[11px] text-[#8a918c] dark:text-[#8e8f94] truncate">{{ tile.label }}</div>
          </div>
        </div>

        <div class="ui-panel p-3">
          <BmiScale :bmi="profileSummary.bmi" />
        </div>

        <div v-if="mealStore.profile.measurements.length >= 2" class="pt-1">
          <WeightTrend :measurements="mealStore.profile.measurements" />
        </div>
        <p class="ui-muted">
          {{ mealStore.profile.sex === 'male' ? 'Uomo' : 'Donna' }}, {{ profileSummary.age }} anni,
          {{ mealStore.profile.heightCm }} cm · {{ movementLabel }} ·
          {{ WEIGHT_GOALS[mealStore.profile.goal].label }}
          <template v-if="profileSummary.waistToHeight"> · vita/altezza {{ profileSummary.waistToHeight }}</template>
        </p>

        <!-- Measurement history (latest first) -->
        <ul class="divide-y divide-[#eef1ec] dark:divide-[#34353a]">
          <li
            v-for="(m, i) in measurementHistory"
            :key="m.date"
            class="py-2 flex items-center justify-between gap-3 text-xs tabular-nums"
          >
            <span class="text-[#8a918c] dark:text-[#8e8f94] w-20 flex-shrink-0">{{ formatDay(m.date) }}</span>
            <span class="flex-1 text-[#4a524c] dark:text-[#c8c9cd] truncate">
              <template v-if="m.waistCm">vita {{ m.waistCm }}</template>
              <template v-if="m.hipsCm"> · fianchi {{ m.hipsCm }}</template>
            </span>
            <span class="font-semibold text-[#1f2421] dark:text-white">{{ m.weightKg }} kg</span>
            <span
              v-if="measurementHistory[i + 1]"
              class="w-12 text-right"
              :class="m.weightKg <= measurementHistory[i + 1]!.weightKg ? 'text-[#5f8a3a] dark:text-[#d4f65a]' : 'text-[#c07a2c]'"
            >
              {{ formatDelta(m.weightKg - measurementHistory[i + 1]!.weightKg) }}
            </span>
            <span v-else class="w-12"></span>
          </li>
        </ul>

        <div class="flex flex-wrap gap-2">
          <button type="button" @click="openMeasurement" class="ui-btn-primary py-2 text-xs">
            <Scales class="w-4 h-4" />
            Aggiorna misure
          </button>
          <button type="button" @click="downloadMeasurementReminder" class="ui-chip bg-[#f1f4ef] dark:bg-[#2b2c30]">
            <CalendarPlus class="w-4 h-4" />
            Promemoria nel calendario
          </button>
        </div>
      </template>

      <template v-else>
        <p class="ui-muted">Sesso, età, altezza, peso e misure per calcolare il tuo obiettivo calorie.</p>
        <button type="button" @click="openOnboarding" class="ui-btn-primary py-2 text-xs">
          <UserCircle class="w-4 h-4" />
          Configura profilo
        </button>
      </template>
    </section>

    <!-- Goals -->
    <section class="ui-card space-y-3">
      <div>
        <h2 class="ui-title">Obiettivo calorie</h2>
        <p v-if="mealStore.profile?.autoKcalGoal" class="ui-muted mt-0.5">
          Calcolato dal profilo: si aggiorna quando cambi peso o misure. Se lo modifichi diventa manuale.
        </p>
        <p v-else class="ui-muted mt-0.5">
          Lascia vuoto per usare le calorie del piano (oggi {{ todayPlannedKcal }} kcal).
        </p>
      </div>
      <div class="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="50"
          inputmode="numeric"
          :value="mealStore.preferences.kcalGoal ?? ''"
          @change="onKcalGoalChange"
          :placeholder="String(todayPlannedKcal)"
          class="ui-input max-w-[10rem] font-semibold"
        />
        <span class="text-sm text-[#8a918c] dark:text-[#8e8f94]">kcal al giorno</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" @click="openPlanScaling" class="ui-btn-primary py-2 text-xs">
          <MagicWand class="w-4 h-4" />
          Adatta il menù all'obiettivo
        </button>
        <button type="button" @click="openMenuGenerator" class="ui-chip bg-[#f1f4ef] dark:bg-[#2b2c30]">
          <ChefHat class="w-4 h-4" />
          Genera un nuovo menù
        </button>
        <button
          v-if="mealStore.planBackup"
          type="button"
          @click="mealStore.restorePlanBackup()"
          class="ui-chip bg-[#f1f4ef] dark:bg-[#2b2c30]"
        >
          <ArrowCounterClockwise class="w-4 h-4" />
          Ripristina menù precedente
        </button>
      </div>
      <button
        v-if="mealStore.profile && profileSummary && !mealStore.profile.autoKcalGoal"
        type="button"
        @click="useProfileGoal"
        class="ui-chip bg-[#f1f4ef] dark:bg-[#2b2c30]"
      >
        Usa l'obiettivo del profilo ({{ profileSummary.targetKcal }} kcal)
      </button>
    </section>

    <!-- Backup -->
    <section class="ui-card space-y-3">
      <div>
        <h2 class="ui-title">Backup</h2>
        <p class="ui-muted mt-0.5">Piano, storico e spesa in un file JSON.</p>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          @click="handleExportJSON"
          class="ui-panel flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#1f2421] dark:text-white hover:bg-[#e9eee6] dark:hover:bg-[#2b2c30] transition"
        >
          <Download class="w-5 h-5 text-[#5f8a3a] dark:text-[#d4f65a]" />
          Esporta
        </button>
        <label
          class="ui-panel flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#1f2421] dark:text-white hover:bg-[#e9eee6] dark:hover:bg-[#2b2c30] transition cursor-pointer"
        >
          <Upload class="w-5 h-5 text-[#5f8a3a] dark:text-[#d4f65a]" />
          Importa
          <input type="file" accept=".json,application/json" @change="handleImportJSON" class="sr-only" />
        </label>
      </div>

      <div
        v-if="feedbackMessage"
        class="px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2"
        :class="
          feedbackIsError
            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
            : 'bg-[#eaf3dc] dark:bg-[#2f3520] text-[#4c7a22] dark:text-[#d4f65a]'
        "
      >
        <AlertCircle v-if="feedbackIsError" class="w-4 h-4 flex-shrink-0" />
        <Check v-else class="w-4 h-4 flex-shrink-0" weight="bold" />
        <span>{{ feedbackMessage }}</span>
      </div>

      <p class="ui-muted leading-relaxed flex gap-2">
        <Info class="w-4 h-4 flex-shrink-0 text-[#9fb83f]" />
        <span>I dati restano solo su questo dispositivo. Per passarli da Mac a iPhone esporta qui e importa sull'altro.</span>
      </p>
    </section>

    <!-- Pantry -->
    <section class="ui-card space-y-3">
      <div>
        <h2 class="ui-title">Sempre in dispensa</h2>
        <p class="ui-muted mt-0.5">Vengono segnati in automatico nella spesa.</p>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="item in commonPantryCandidates"
          :key="item.canonicalId"
          type="button"
          @click="mealStore.toggleGlobalPantry(item.canonicalId)"
          :class="isItemInGlobalPantry(item.canonicalId) ? 'ui-chip-on' : 'ui-chip bg-[#f1f4ef] dark:bg-[#2b2c30]'"
        >
          <Check v-if="isItemInGlobalPantry(item.canonicalId)" class="w-3.5 h-3.5" weight="bold" />
          {{ item.label }}
        </button>
      </div>
    </section>

    <!-- Reset -->
    <section class="ui-card space-y-1">
      <h2 class="ui-title mb-2">Ripristino</h2>
      <div class="flex items-center justify-between gap-3 py-2">
        <div class="min-w-0">
          <div class="text-sm font-medium text-[#1f2421] dark:text-white">Menù iniziale</div>
          <div class="ui-muted">Reimposta il piano settimanale. Lo storico resta.</div>
        </div>
        <button type="button" @click="confirmRestoreSeed" class="ui-chip bg-[#f1f4ef] dark:bg-[#2b2c30] flex-shrink-0">
          Ripristina
        </button>
      </div>
      <div class="flex items-center justify-between gap-3 py-2 border-t border-[#eef1ec] dark:border-[#34353a]">
        <div class="min-w-0">
          <div class="text-sm font-medium text-[#1f2421] dark:text-white">Storico</div>
          <div class="ui-muted">Cancella pasti confermati e note.</div>
        </div>
        <button
          type="button"
          @click="confirmResetProgress"
          class="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition flex-shrink-0"
        >
          Azzera
        </button>
      </div>
    </section>

    <!-- Disclaimer -->
    <p class="px-1 text-[11px] leading-relaxed text-[#8a918c] dark:text-[#6b6c71]">
      DietaX è uno strumento di organizzazione dei pasti. Il piano è indicativo e non è una prescrizione medica o nutrizionale; non fornisce indicazioni su farmaci o insulina.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PhChefHat as ChefHat, PhMagicWand as MagicWand, PhArrowCounterClockwise as ArrowCounterClockwise, PhFire as Fire, PhHeartbeat as Heartbeat, PhScales as Scales, PhCalendarPlus as CalendarPlus, PhUserCircle as UserCircle, PhDownloadSimple as Download, PhUploadSimple as Upload, PhCheck as Check, PhWarningCircle as AlertCircle, PhInfo as Info } from '@phosphor-icons/vue'
import { useMealStore } from '~/stores/mealStore'
import { formatDateKey, getDayOfWeekFromDate, parseDateKey } from '~/utils/date'
import { calculateDayKcal } from '~/utils/nutrition'
import BmiScale from '~/components/BmiScale.vue'
import WeightTrend from '~/components/WeightTrend.vue'
import { useProfileUi } from '~/composables/useProfileUi'
import { ACTIVITY_LEVELS, LIFESTYLES, WEIGHT_GOALS, summarizeProfile } from '~/utils/body'
import type { AppExportData } from '~/types/meal'

const mealStore = useMealStore()

const todayPlannedKcal = computed(
  () => calculateDayKcal({ dayPlan: mealStore.getDayPlan(getDayOfWeekFromDate(new Date())) }).totalKcal
)

const { openOnboarding, openMeasurement, openPlanScaling, openMenuGenerator, downloadMeasurementReminder } = useProfileUi()

const profileSummary = computed(() => (mealStore.profile ? summarizeProfile(mealStore.profile) : null))
const profileTiles = computed(() => {
  const summary = profileSummary.value
  if (!summary) return []
  return [
    { label: 'kg', value: summary.weightKg, icon: Scales, iconClass: 'text-[#9fb83f]' },
    { label: `BMI · ${summary.bmiLabel}`, value: summary.bmi, icon: Heartbeat, iconClass: 'text-[#7d7e84]' },
    { label: 'kcal fabbisogno', value: summary.tdee, icon: Fire, iconClass: 'text-[#ececee]' },
  ]
})

// "Seduto · 3 allenamenti/sett." (or the legacy generic activity level)
const movementLabel = computed(() => {
  const p = mealStore.profile
  if (!p) return ''
  if (!p.lifestyle) return ACTIVITY_LEVELS[p.activity ?? 'sedentary'].label
  const n = p.workouts?.length ?? 0
  return `${LIFESTYLES[p.lifestyle].label} · ${n} ${n === 1 ? 'allenamento' : 'allenamenti'}/sett.`
})

const measurementHistory = computed(() => [...(mealStore.profile?.measurements ?? [])].reverse())

const formatDay = (dateKey: string) =>
  parseDateKey(dateKey).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' })
const formatDelta = (kg: number) => {
  const rounded = Math.round(kg * 10) / 10
  return `${rounded > 0 ? '+' : ''}${rounded}`
}

const useProfileGoal = () => {
  if (!mealStore.profile) return
  mealStore.saveProfile({ ...mealStore.profile, autoKcalGoal: true })
}

const onKcalGoalChange = (e: Event) => {
  const value = Number((e.target as HTMLInputElement).value)
  mealStore.setKcalGoal(Number.isFinite(value) && value > 0 ? value : null)
}

const feedbackMessage = ref('')
const feedbackIsError = ref(false)

const showFeedback = (msg: string, isError = false) => {
  feedbackMessage.value = msg
  feedbackIsError.value = isError
  setTimeout(() => {
    feedbackMessage.value = ''
  }, 4000)
}

const commonPantryCandidates = [
  { canonicalId: 'mandorle', label: 'Mandorle' },
  { canonicalId: 'proteine-whey', label: 'Proteine Whey' },
  { canonicalId: 'pasta-integrale-secca', label: 'Pasta integrale' },
  { canonicalId: 'pasta-secca', label: 'Pasta classica' },
  { canonicalId: 'riso-basmati-secco', label: 'Riso basmati' },
  { canonicalId: 'riso-secco', label: 'Riso' },
  { canonicalId: 'avena-secca', label: 'Fiocchi di avena' },
  { canonicalId: 'fette-biscottate', label: 'Fette biscottate' },
  { canonicalId: 'tonno-naturale', label: 'Tonno in scatola' },
]

const isItemInGlobalPantry = (canonicalId: string) => {
  return mealStore.globalPantry.includes(canonicalId)
}

const handleExportJSON = () => {
  const data = mealStore.exportData()
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `dietax-backup-${formatDateKey(new Date())}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  showFeedback('Backup esportato con successo!')
}

const handleImportJSON = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target?.result as string) as AppExportData
      const result = mealStore.importData(parsed)
      if (result.success) {
        showFeedback('Backup importato con successo!')
      } else {
        showFeedback(result.error || 'Errore importazione file', true)
      }
    } catch {
      showFeedback('Il file selezionato non è un JSON valido', true)
    } finally {
      target.value = ''
    }
  }
  reader.readAsText(file)
}

const confirmRestoreSeed = () => {
  if (
    confirm(
      'Vuoi davvero ripristinare il menù al piano originale seed? Le tue personalizzazioni del menù settimanale andranno perse.'
    )
  ) {
    mealStore.resetToSeedMenu()
    showFeedback('Menù iniziale ripristinato con successo!')
  }
}

const confirmResetProgress = () => {
  if (
    confirm(
      'Vuoi davvero azzerare lo storico di tutti i pasti completati e delle note giornaliere? L\'operazione non è reversibile.'
    )
  ) {
    mealStore.resetAllProgress()
    showFeedback('Storico dei pasti azzerato.')
  }
}
</script>
