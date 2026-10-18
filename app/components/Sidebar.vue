<template>
  <aside
    class="w-60 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0 select-none z-30 bg-[#dfe8db] dark:bg-[#0f1b13] transition-colors"
  >
    <!-- Brand -->
    <div class="px-5 pt-7 pb-6 flex items-center gap-2.5">
      <div class="w-9 h-9 rounded-full bg-[#d4f65a] text-[#16171a] flex items-center justify-center">
        <Leaf class="w-5 h-5" />
      </div>
      <span class="text-lg font-bold tracking-tight text-[#1f2421] dark:text-white">DietaX</span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 space-y-1 overflow-y-auto">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        @click="item.to === '/' && goToToday()"
        class="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-full text-sm font-semibold transition"
        :class="
          isActive(item.to)
            ? 'bg-[#d4f65a] text-[#16171a]'
            : 'text-[#4a524c] dark:text-[#c8c9cd] hover:bg-white/60 dark:hover:bg-white/5'
        "
      >
        <span class="flex items-center gap-3">
          <component :is="item.icon" class="w-5 h-5" :weight="isActive(item.to) ? 'fill' : 'duotone'" />
          {{ item.label }}
        </span>
        <span v-if="item.to === '/' && todayStats.completed > 0" class="text-xs tabular-nums opacity-80">
          {{ todayStats.completed }}/{{ todayStats.total }}
        </span>
      </NuxtLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  PhLeaf as Leaf,
  PhCalendarCheck as CalendarCheck,
  PhCalendarDots as CalendarDots,
  PhBasket as Basket,
  PhGearSix as GearSix,
  PhClockCounterClockwise as ClockCounterClockwise,
} from '@phosphor-icons/vue'
import { useCurrentDate } from '~/composables/useCurrentDate'
import { useMealStore } from '~/stores/mealStore'
import { formatDateKey } from '~/utils/date'

const route = useRoute()
const { goToToday } = useCurrentDate()

const navItems = [
  { to: '/', label: 'Oggi', icon: CalendarCheck },
  { to: '/pianificazione', label: 'Pianificazione', icon: CalendarDots },
  { to: '/spesa', label: 'Spesa', icon: Basket },
  { to: '/registro', label: 'Registro', icon: ClockCounterClockwise },
  { to: '/impostazioni', label: 'Opzioni', icon: GearSix },
]

const mealStore = useMealStore()

const todayKey = formatDateKey(new Date())

const todayStats = computed(() => {
  return mealStore.getDayCompletionStats(todayKey)
})

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>
