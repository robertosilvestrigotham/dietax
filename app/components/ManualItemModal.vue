<template>
  <div v-if="isOpen" class="ui-modal-backdrop" @click.self="close">
    <div class="ui-modal sm:max-w-md">
      <div class="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
        <h3 class="text-lg font-bold text-[#1f2421] dark:text-white">Aggiungi alla spesa</h3>
        <button type="button" @click="close" class="ui-icon-btn" aria-label="Chiudi">
          <X class="w-4 h-4" weight="bold" />
        </button>
      </div>

      <div class="px-5 pb-5">
        <div class="ui-card space-y-3">
          <div>
            <label class="ui-label">Prodotto</label>
            <input type="text" v-model="name" placeholder="Es. Olio extravergine" class="ui-input" autofocus />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="ui-label">Quantità</label>
              <input type="number" v-model.number="quantity" placeholder="1" class="ui-input" />
            </div>
            <div>
              <label class="ui-label">Unità</label>
              <select v-model="unit" class="ui-input">
                <option value="pz">pz</option>
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="qb">q.b.</option>
              </select>
            </div>
          </div>
          <div>
            <label class="ui-label">Categoria</label>
            <select v-model="category" class="ui-input">
              <option v-for="cat in INGREDIENT_CATEGORY_ORDER" :key="cat" :value="cat">
                {{ INGREDIENT_CATEGORY_LABELS[cat] }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-end gap-2 border-t border-black/5 dark:border-white/5">
        <button type="button" @click="close" class="ui-btn-ghost">Annulla</button>
        <button type="button" @click="submit" :disabled="!name.trim()" class="ui-btn-primary">Aggiungi</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PhX as X } from '@phosphor-icons/vue'
import type { FoodUnit, IngredientCategory } from '~/types/meal'
import {
  INGREDIENT_CATEGORY_LABELS,
  INGREDIENT_CATEGORY_ORDER,
} from '~/types/meal'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (
    e: 'add',
    item: {
      name: string
      quantity: number | null
      unit: FoodUnit
      category: IngredientCategory
    }
  ): void
}>()

const name = ref('')
const quantity = ref<number | null>(1)
const unit = ref<FoodUnit>('pz')
const category = ref<IngredientCategory>('other')

const close = () => {
  emit('close')
}

const submit = () => {
  if (!name.value.trim()) return

  emit('add', {
    name: name.value.trim(),
    quantity: quantity.value,
    unit: unit.value,
    category: category.value,
  })

  name.value = ''
  quantity.value = 1
  unit.value = 'pz'
  category.value = 'other'
  close()
}
</script>
