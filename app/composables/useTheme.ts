// Dark-only app: the `dark` class is also set on <html> server side (nuxt.config)
import { onMounted } from 'vue'
export function useTheme() {
  onMounted(() => {
    document.documentElement.classList.add('dark')
  })
}
