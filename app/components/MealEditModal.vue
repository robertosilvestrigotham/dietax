<template>
  <div v-if="isOpen" class="ui-modal-backdrop" @click.self="close">
    <div class="ui-modal sm:max-w-2xl">
      <!-- Header -->
      <div class="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-lg font-bold text-[#1f2421] dark:text-white truncate">
            {{ MEAL_SLOT_LABELS[formMeal.slot] }}
          </h3>
          <p class="ui-muted capitalize">{{ DAY_OF_WEEK_LABELS[dayOfWeek] }}</p>
        </div>
        <button type="button" @click="close" class="ui-icon-btn flex-shrink-0" aria-label="Chiudi">
          <X class="w-4 h-4" weight="bold" />
        </button>
      </div>

      <!-- Body -->
      <div class="ui-modal-body px-5 pb-5 space-y-3">
        <!-- Main fields -->
        <div class="ui-card space-y-3">
          <div>
            <label class="ui-label">Descrizione</label>
            <textarea
              v-model="formMeal.description"
              rows="2"
              class="ui-input resize-none"
              placeholder="Es. 90 g pasta integrale, 150 g ceci cotti"
            ></textarea>
          </div>
          <div>
            <label class="ui-label">Note di preparazione</label>
            <input
              type="text"
              v-model="formMeal.notes"
              placeholder="Es. Pasta pesata a secco"
              class="ui-input"
            />
          </div>
          <div>
            <label class="ui-label">Nome</label>
            <input type="text" v-model="formMeal.name" class="ui-input" />
          </div>
        </div>

        <!-- Out of home -->
        <div class="ui-card space-y-3">
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <span class="text-sm font-semibold text-[#1f2421] dark:text-white block">Fuori casa</span>
              <span class="ui-muted">Gli ingredienti non vanno nella spesa.</span>
            </div>
            <span class="relative inline-flex items-center flex-shrink-0">
              <input type="checkbox" v-model="formMeal.isOut" class="sr-only peer" />
              <span
                class="w-11 h-6 rounded-full bg-[#d6dfd1] dark:bg-[#34353a] peer-checked:bg-[#d4f65a] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
              ></span>
            </span>
          </label>
          <div v-if="formMeal.isOut" class="grid grid-cols-2 gap-2">
            <div>
              <label class="ui-label">CHO stimati (g)</label>
              <input type="number" v-model.number="formMeal.estimatedCho" placeholder="Es. 60" class="ui-input" />
            </div>
            <div>
              <label class="ui-label">Kcal stimate</label>
              <input
                type="number"
                v-model.number="formMeal.estimatedKcal"
                :placeholder="formMeal.estimatedCho ? String(Math.round(formMeal.estimatedCho * 8)) : 'Es. 600'"
                class="ui-input"
              />
            </div>
          </div>
        </div>

        <!-- Ingredients -->
        <div v-if="!formMeal.isOut" class="ui-card space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="ui-title">
              Ingredienti <span class="text-[#8a918c] font-medium tabular-nums">{{ formMeal.ingredients.length }}</span>
            </h4>
            <button type="button" @click="addIngredient" class="ui-chip bg-[#f1f4ef] dark:bg-[#2b2c30]">
              <Plus class="w-3.5 h-3.5" weight="bold" />
              Aggiungi
            </button>
          </div>

          <p v-if="formMeal.ingredients.length === 0" class="ui-muted text-center py-4">
            Nessun ingrediente.
          </p>

          <div
            v-for="(ing, idx) in formMeal.ingredients"
            :key="ing.id"
            class="ui-panel p-3 space-y-2"
          >
            <div class="flex items-center gap-2">
              <FoodSearchInput
                v-model="ing.name"
                placeholder="Cerca alimento"
                input-class="ui-input bg-white dark:bg-[#222326] font-medium"
                class="flex-1 min-w-0"
                @select="(food) => applyFood(ing, food)"
              />
              <button
                type="button"
                @click="removeIngredient(idx)"
                class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[#9aa19c] hover:text-rose-600 hover:bg-white dark:hover:bg-[#222326] transition"
                title="Elimina ingrediente"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>

            <div class="grid grid-cols-4 gap-1.5">
              <div>
                <label class="ui-label">Quantità</label>
                <input
                  type="number"
                  v-model.number="ing.quantity"
                  :disabled="ing.isToDefine"
                  placeholder="90"
                  class="ui-input bg-white dark:bg-[#222326] text-xs"
                />
              </div>
              <div>
                <label class="ui-label">Unità</label>
                <select v-model="ing.unit" class="ui-input bg-white dark:bg-[#222326] text-xs">
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="pz">pz</option>
                  <option value="qb">q.b.</option>
                </select>
              </div>
              <div>
                <label class="ui-label text-[#5f8a3a] dark:text-[#d4f65a]">CHO (g)</label>
                <input
                  type="number"
                  step="any"
                  v-model.number="ing.choGrams"
                  :placeholder="String(calculateIngredientCho({ ...ing, choGrams: undefined }))"
                  class="ui-input bg-white dark:bg-[#222326] text-xs font-semibold"
                />
              </div>
              <div>
                <label class="ui-label">Kcal</label>
                <input
                  type="number"
                  step="any"
                  v-model.number="ing.kcal"
                  :placeholder="String(calculateIngredientKcal({ ...ing, kcal: undefined }))"
                  class="ui-input bg-white dark:bg-[#222326] text-xs"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="ui-label">Categoria</label>
                <select v-model="ing.category" class="ui-input bg-white dark:bg-[#222326] text-xs">
                  <option v-for="cat in INGREDIENT_CATEGORY_ORDER" :key="cat" :value="cat">
                    {{ INGREDIENT_CATEGORY_LABELS[cat] }}
                  </option>
                </select>
              </div>
              <div>
                <label class="ui-label">Stato</label>
                <select v-model="ing.preparationState" class="ui-input bg-white dark:bg-[#222326] text-xs">
                  <option value="none">—</option>
                  <option value="raw">A secco / crudo</option>
                  <option value="cooked">Cotto e scolato</option>
                  <option value="canned">Al naturale</option>
                </select>
              </div>
            </div>

            <label class="inline-flex items-center gap-2 text-xs text-[#8a918c] dark:text-[#8e8f94] cursor-pointer">
              <input
                type="checkbox"
                v-model="ing.isToDefine"
                @change="handleToDefineChange(ing)"
                class="rounded border-[#c8d3c2] text-[#d4f65a] focus:ring-[#d4f65a]"
              />
              Quantità a piacere
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-end gap-2 border-t border-black/5 dark:border-white/5">
        <button type="button" @click="close" class="ui-btn-ghost">Annulla</button>
        <button type="button" @click="save" class="ui-btn-primary">Salva</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhX as X, PhPlus as Plus, PhTrash as Trash2 } from '@phosphor-icons/vue'
import type { DayOfWeek, Ingredient, Meal } from '~/types/meal'
import { calculateIngredientCho, calculateIngredientKcal } from '~/utils/nutrition'
import { defaultFoodQuantity, type FoodItem } from '~/data/foods'
import FoodSearchInput from '~/components/FoodSearchInput.vue'
import {
  MEAL_SLOT_LABELS,
  DAY_OF_WEEK_LABELS,
  INGREDIENT_CATEGORY_LABELS,
  INGREDIENT_CATEGORY_ORDER,
} from '~/types/meal'
import { useMealStore } from '~/stores/mealStore'

const props = defineProps<{
  isOpen: boolean
  meal: Meal | null
  dayOfWeek: DayOfWeek
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const mealStore = useMealStore()

const formMeal = ref<Meal>({
  id: '',
  slot: 'lunch',
  name: '',
  description: '',
  isOut: false,
  ingredients: [],
  imageUrl: '',
  estimatedCho: undefined,
})

watch(
  () => props.meal,
  (val) => {
    if (val) {
      formMeal.value = JSON.parse(JSON.stringify(val))
    }
  },
  { immediate: true }
)

const handleToDefineChange = (ing: Ingredient) => {
  if (ing.isToDefine) {
    ing.quantity = null
    ing.unit = 'qb'
  }
}

// Picking a food from the table fills id, category, unit and per-100g values;
// CHO/kcal fields are cleared so they are computed from quantity (empty field = computed value)
const applyFood = (ing: Ingredient, food: FoodItem) => {
  ing.canonicalId = food.id
  ing.category = food.category
  if (ing.unit !== food.unit && ing.unit !== 'qb') {
    ing.unit = food.unit
    ing.quantity = defaultFoodQuantity(food)
  }
  if (ing.quantity === null && ing.unit !== 'qb') ing.quantity = defaultFoodQuantity(food)
  // For pieces, choPer100g holds the CHO of one piece (see calculateIngredientCho)
  ing.choPer100g =
    food.unit === 'pz' ? Math.round(((food.choPer100g * (food.gramsPerPiece ?? 100)) / 100) * 10) / 10 : food.choPer100g
  delete ing.choGrams
  delete ing.kcal
}

const addIngredient = () => {
  const newIng: Ingredient = {
    id: `ing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    canonicalId: `custom-${Date.now()}`,
    name: '',
    quantity: 100,
    unit: 'g',
    category: 'carb',
    preparationState: 'none',
  }
  formMeal.value.ingredients.push(newIng)
}

const removeIngredient = (idx: number) => {
  formMeal.value.ingredients.splice(idx, 1)
}

const close = () => {
  emit('close')
}

const save = () => {
  for (const ing of formMeal.value.ingredients) {
    if (!ing.canonicalId || ing.canonicalId.startsWith('custom-')) {
      const slug = ing.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      ing.canonicalId = slug || `item-${Date.now()}`
    }
  }

  mealStore.updateMeal(props.dayOfWeek, formMeal.value.slot, formMeal.value)
  emit('saved')
  close()
}
</script>
