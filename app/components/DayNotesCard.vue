<template>
  <!-- Past days: read-only, hidden when there is no note -->
  <div v-if="!isPastDay || notesModel" class="ui-card space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <NotePencil class="w-5 h-5 text-[#8fb57a] dark:text-[#a7c49a]" />
        <label :for="`notes-${dateKey}`" class="ui-title">Nota del giorno</label>
      </div>
      <span
        v-if="notesSavedFeedback"
        class="text-xs text-[#5f8a3a] dark:text-[#a7c49a] font-semibold flex items-center gap-1"
      >
        <Check class="w-3.5 h-3.5" weight="bold" />
        Salvato
      </span>
    </div>
    <p v-if="isPastDay" class="text-sm text-[#1f2421] dark:text-[#eef1ef] whitespace-pre-line">{{ notesModel }}</p>
    <textarea
      v-else
      :id="`notes-${dateKey}`"
      v-model="notesModel"
      @blur="saveNotes"
      rows="3"
      placeholder="Attività, sensazioni, variazioni…"
      class="ui-input resize-none"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { PhNotePencil as NotePencil, PhCheck as Check } from '@phosphor-icons/vue'
import { useMealStore } from '~/stores/mealStore'
import { formatDateKey } from '~/utils/date'

const props = defineProps<{
  dateKey: string
}>()

const mealStore = useMealStore()
const notesModel = ref('')
const notesSavedFeedback = ref(false)
const isPastDay = computed(() => props.dateKey < formatDateKey(new Date()))

const syncNotes = () => {
  const prog = mealStore.getDayProgressForDate(props.dateKey)
  notesModel.value = prog.notes || ''
}

watch(() => props.dateKey, syncNotes, { immediate: true })

const saveNotes = () => {
  mealStore.setDayNotes(props.dateKey, notesModel.value)
  notesSavedFeedback.value = true
  setTimeout(() => {
    notesSavedFeedback.value = false
  }, 1800)
}
</script>
