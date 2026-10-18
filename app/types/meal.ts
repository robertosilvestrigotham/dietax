export type MealSlot = 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner'

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export type IngredientCategory =
  | 'carb'
  | 'protein'
  | 'dairy'
  | 'veg'
  | 'legume'
  | 'fruit'
  | 'nuts'
  | 'supplement'
  | 'pantry'
  | 'other'

export type FoodPreparationState = 'raw' | 'cooked' | 'canned' | 'none'

export type FoodUnit = 'g' | 'ml' | 'pz' | 'qb'

export interface ExtraFoodItem {
  id: string
  name: string
  quantity?: number | null
  unit?: FoodUnit
  choGrams: number
  kcal?: number
  notes?: string
  createdAt?: string
}

export interface Ingredient {
  id: string
  canonicalId: string
  name: string
  quantity: number | null // null when quantity is to be defined / qb
  unit: FoodUnit
  category: IngredientCategory
  preparationState: FoodPreparationState
  isToDefine?: boolean
  notes?: string
  choPer100g?: number // Carbohydrates in grams per 100g (or 100ml, or per piece if unit is 'pz')
  choGrams?: number // Direct CHO value in grams
  kcal?: number // Direct kcal value; when missing it is estimated from the built-in food table
}

export interface MealAlternative {
  id: string
  label: string
  description?: string
  ingredients: Ingredient[]
  imageUrl?: string
}

export interface Meal {
  id: string
  slot: MealSlot
  name: string
  description: string
  isOut: boolean // pasto flessibile / fuori casa (non genera spesa)
  notes?: string
  ingredients: Ingredient[]
  alternatives?: MealAlternative[]
  selectedAlternativeId?: string
  imageUrl?: string
  estimatedCho?: number // Override CHO when ingredients are not specified or for out-of-home meals
  estimatedKcal?: number // Same, for calories
  dishId?: string // Set when the meal comes from the dish library (menu generator)
}

export type DayPlan = Record<MealSlot, Meal>

export type WeeklyPlan = Record<DayOfWeek, DayPlan>

export interface MealSnapshot {
  mealId: string
  name: string
  description: string
  ingredientsSummary: string
  isOut: boolean
  meal?: Meal // Full copy of the planned meal at confirmation time (freezes history)
}

/** A meal eaten instead of the planned one, for a single date only */
export interface MealReplacement {
  description: string
  choGrams: number
  kcal?: number
  replacedAt: string // ISO timestamp
}

export interface DayProgress {
  date: string // YYYY-MM-DD
  completedMeals: Record<MealSlot, boolean>
  completedAt: Record<MealSlot, string | null> // ISO timestamp or null
  notes: string
  mealSnapshots?: Partial<Record<MealSlot, MealSnapshot>>
  selectedAlternatives?: Partial<Record<MealSlot, string>>
  extraFoods?: Partial<Record<MealSlot, ExtraFoodItem[]>>
  replacements?: Partial<Record<MealSlot, MealReplacement>>
}

export type ItemShoppingStatus = 'to_buy' | 'bought' | 'in_pantry'

export interface ManualShoppingItem {
  id: string
  name: string
  quantity: number | null
  unit: FoodUnit
  category: IngredientCategory
  notes?: string
  status: ItemShoppingStatus
  createdAt: string
}

export interface AggregatedShoppingItem {
  key: string
  canonicalId: string
  name: string
  category: IngredientCategory
  unit: FoodUnit
  preparationState: FoodPreparationState
  totalQuantity: number | null
  occurrences: number
  isToDefine: boolean
  sourceMeals: {
    dayOfWeek: DayOfWeek
    slot: MealSlot
    mealName: string
    dateString?: string
  }[]
  status: ItemShoppingStatus
}

export interface WeekShoppingState {
  rangeKey: string // e.g. "2026-10-12_2026-10-18"
  itemStatuses: Record<string, ItemShoppingStatus> // key -> status
  manualItems: ManualShoppingItem[]
  pantryExcludedKeys: string[]
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface AppPreferences {
  theme: ThemePreference
  autoScrollToCurrentMeal: boolean
  kcalGoal: number | null // Daily calorie goal; null = use the planned calories of the day
  excludedFoods?: string[] // Food ids the menu generator must never use
}

// ─── Profile & body measurements ────────────────────────────────────────────
export type Sex = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type Lifestyle = 'sedentary' | 'standing' | 'physical' // daily movement, workouts excluded
export type WorkoutType = 'strength' | 'cardio'

export interface Workout {
  id: string
  day: DayOfWeek
  type: WorkoutType
  minutes: number
}
export type WeightGoal = 'lose' | 'maintain' | 'gain'

export interface BodyMeasurement {
  date: string // YYYY-MM-DD
  weightKg: number
  waistCm?: number
  hipsCm?: number
  chestCm?: number
  armCm?: number
  thighCm?: number
}

export interface UserProfile {
  sex: Sex
  birthYear: number
  heightCm: number
  activity?: ActivityLevel // legacy: generic level, used only when lifestyle is missing
  lifestyle?: Lifestyle
  workouts?: Workout[]
  goal: WeightGoal
  measurements: BodyMeasurement[] // oldest first; the last one is the current state
  autoKcalGoal: boolean // keep the calorie goal in sync with the computed target
}

export interface AppExportData {
  version: number
  exportedAt: string
  template: WeeklyPlan
  progress: Record<string, DayProgress>
  shoppingStates: Record<string, WeekShoppingState>
  pantryItems: string[] // canonicalIds marked as constantly in pantry
  preferences: AppPreferences
  profile?: UserProfile | null
  onboardingDismissed?: boolean
}

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Colazione',
  morningSnack: 'Spuntino',
  lunch: 'Pranzo',
  afternoonSnack: 'Merenda',
  dinner: 'Cena',
}

export const MEAL_SLOT_ORDER: MealSlot[] = [
  'breakfast',
  'morningSnack',
  'lunch',
  'afternoonSnack',
  'dinner',
]

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lunedì',
  tuesday: 'Martedì',
  wednesday: 'Mercoledì',
  thursday: 'Giovedì',
  friday: 'Venerdì',
  saturday: 'Sabato',
  sunday: 'Domenica',
}

export const DAY_OF_WEEK_SHORT: Record<DayOfWeek, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mer',
  thursday: 'Gio',
  friday: 'Ven',
  saturday: 'Sab',
  sunday: 'Dom',
}

export const DAYS_OF_WEEK_ORDER: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  carb: 'Carboidrati & Cereali',
  protein: 'Carne, Pesce & Uova',
  dairy: 'Latticini & Derivati',
  veg: 'Verdure & Ortaggi',
  legume: 'Legumi',
  fruit: 'Frutta Fresca',
  nuts: 'Frutta Secca & Semi',
  supplement: 'Integratori & Proteine',
  pantry: 'Condimenti & Dispensa',
  other: 'Altro',
}

export const INGREDIENT_CATEGORY_ORDER: IngredientCategory[] = [
  'carb',
  'protein',
  'dairy',
  'legume',
  'veg',
  'fruit',
  'nuts',
  'supplement',
  'pantry',
  'other',
]
