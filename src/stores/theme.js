import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function initTheme() {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      isDark.value = true
      document.documentElement.classList.add('dark-theme')
    } else if (savedTheme === 'light') {
      isDark.value = false
      document.documentElement.classList.remove('dark-theme')
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = systemDark
      if (systemDark) {
        document.documentElement.classList.add('dark-theme')
      } else {
        document.documentElement.classList.remove('dark-theme')
      }
    }
  }

  function toggleTheme() {
    if (isDark.value) {
      document.documentElement.classList.remove('dark-theme')
      localStorage.setItem('theme', 'light')
      isDark.value = false
    } else {
      document.documentElement.classList.add('dark-theme')
      localStorage.setItem('theme', 'dark')
      isDark.value = true
    }
  }

  return { isDark, initTheme, toggleTheme }
})