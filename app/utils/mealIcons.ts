import type { Component } from 'vue'
import { PhCoffee, PhOrangeSlice, PhBowlFood, PhCookie, PhCookingPot } from '@phosphor-icons/vue'
import type { MealSlot } from '~/types/meal'

export const MEAL_SLOT_ICONS: Record<MealSlot, Component> = {
  breakfast: PhCoffee,
  morningSnack: PhOrangeSlice,
  lunch: PhBowlFood,
  afternoonSnack: PhCookie,
  dinner: PhCookingPot,
}
