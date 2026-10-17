<template>
  <nav class="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm h-16">
    <!-- Bar with a concave notch under the center button -->
    <div class="absolute inset-0 drop-shadow-[0_8px_24px_rgba(31,36,33,0.12)]">
      <div class="nav-notch h-full rounded-[28px] bg-white dark:bg-[#1b211d]"></div>
    </div>

    <div class="relative h-full grid grid-cols-5 items-center">
      <NuxtLink
        v-for="item in leftItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center justify-center h-full transition-colors"
        :class="isActive(item.to) ? 'text-[#5f9a22] dark:text-[#a0da6c]' : 'text-[#9aa19c] dark:text-[#6f7872] hover:text-[#1f2421] dark:hover:text-white'"
        :aria-label="item.label"
        :title="item.label"
      >
        <component :is="item.icon" class="w-6 h-6" :weight="isActive(item.to) ? 'fill' : 'duotone'" />
      </NuxtLink>

      <div class="flex justify-center">
        <NuxtLink
          to="/"
          @click="goToToday"
          class="-mt-16 w-16 h-16 rounded-full flex items-center justify-center text-white bg-[#8cc63f] shadow-[0_8px_20px_rgba(140,198,63,0.45)] transition-transform active:scale-95"
          :class="isActive('/') ? '' : 'opacity-90'"
          aria-label="Oggi"
          title="Oggi"
        >
          <CalendarCheck class="w-7 h-7" />
        </NuxtLink>
      </div>

      <NuxtLink
        v-for="item in rightItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center justify-center h-full transition-colors"
        :class="isActive(item.to) ? 'text-[#5f9a22] dark:text-[#a0da6c]' : 'text-[#9aa19c] dark:text-[#6f7872] hover:text-[#1f2421] dark:hover:text-white'"
        :aria-label="item.label"
        :title="item.label"
      >
        <component :is="item.icon" class="w-6 h-6" :weight="isActive(item.to) ? 'fill' : 'duotone'" />
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useCurrentDate } from '~/composables/useCurrentDate'
import { PhCalendarCheck as CalendarCheck, PhCalendarDots as CalendarDays, PhBasket as ShoppingBag, PhGearSix as Settings, PhClockCounterClockwise as History } from '@phosphor-icons/vue'

const route = useRoute()
const { goToToday } = useCurrentDate()

const leftItems = [
  { to: '/pianificazione', label: 'Pianificazione', icon: CalendarDays },
  { to: '/spesa', label: 'Spesa', icon: ShoppingBag },
]

const rightItems = [
  { to: '/impostazioni', label: 'Opzioni', icon: Settings },
  { to: '/registro', label: 'Registro', icon: History },
]

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<style scoped>
.nav-notch {
  -webkit-mask: radial-gradient(circle 41px at 50% 0, transparent 40px, #000 41px);
  mask: radial-gradient(circle 41px at 50% 0, transparent 40px, #000 41px);
}
</style>
