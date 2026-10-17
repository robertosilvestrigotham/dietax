<template>
  <div class="space-y-4 max-w-3xl mx-auto">
    <!-- Theme -->
    <section class="ui-card space-y-3">
      <h2 class="ui-title">Aspetto</h2>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="opt in themeOptions"
          :key="opt.value"
          type="button"
          @click="setTheme(opt.value)"
          class="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition"
          :class="
            theme === opt.value
              ? 'bg-[#8cc63f] text-white'
              : 'bg-[#f1f4ef] dark:bg-[#18221b] text-[#4a524c] dark:text-[#c9d1cb] hover:bg-[#e9eee6] dark:hover:bg-[#1d2820]'
          "
        >
          <component :is="opt.icon" class="w-6 h-6" />
          {{ opt.label }}
        </button>
      </div>
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
          class="ui-panel flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#1f2421] dark:text-white hover:bg-[#e9eee6] dark:hover:bg-[#1d2820] transition"
        >
          <Download class="w-5 h-5 text-[#5f8a3a] dark:text-[#a7c49a]" />
          Esporta
        </button>
        <label
          class="ui-panel flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#1f2421] dark:text-white hover:bg-[#e9eee6] dark:hover:bg-[#1d2820] transition cursor-pointer"
        >
          <Upload class="w-5 h-5 text-[#5f8a3a] dark:text-[#a7c49a]" />
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
            : 'bg-[#eaf3dc] dark:bg-[#1f3320] text-[#4c7a22] dark:text-[#a7c49a]'
        "
      >
        <AlertCircle v-if="feedbackIsError" class="w-4 h-4 flex-shrink-0" />
        <Check v-else class="w-4 h-4 flex-shrink-0" weight="bold" />
        <span>{{ feedbackMessage }}</span>
      </div>

      <p class="ui-muted leading-relaxed flex gap-2">
        <Info class="w-4 h-4 flex-shrink-0 text-[#a3bb97]" />
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
          :class="isItemInGlobalPantry(item.canonicalId) ? 'ui-chip-on' : 'ui-chip bg-[#f1f4ef] dark:bg-[#18221b]'"
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
        <button type="button" @click="confirmRestoreSeed" class="ui-chip bg-[#f1f4ef] dark:bg-[#18221b] flex-shrink-0">
          Ripristina
        </button>
      </div>
      <div class="flex items-center justify-between gap-3 py-2 border-t border-[#eef1ec] dark:border-[#232a25]">
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
    <p class="px-1 text-[11px] leading-relaxed text-[#8a918c] dark:text-[#6f7872]">
      DietaX è uno strumento di organizzazione dei pasti. Il piano è indicativo e non è una prescrizione medica o nutrizionale; non fornisce indicazioni su farmaci o insulina.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PhSun as Sun, PhMoon as Moon, PhDeviceMobile as DeviceMobile, PhDownloadSimple as Download, PhUploadSimple as Upload, PhCheck as Check, PhWarningCircle as AlertCircle, PhInfo as Info } from '@phosphor-icons/vue'
import { useMealStore } from '~/stores/mealStore'
import { useTheme } from '~/composables/useTheme'
import { formatDateKey } from '~/utils/date'
import type { AppExportData } from '~/types/meal'

const mealStore = useMealStore()
const { theme, setTheme } = useTheme()

const themeOptions = [
  { value: 'light' as const, label: 'Chiaro', icon: Sun },
  { value: 'dark' as const, label: 'Scuro', icon: Moon },
  { value: 'system' as const, label: 'Automatico', icon: DeviceMobile },
]

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
