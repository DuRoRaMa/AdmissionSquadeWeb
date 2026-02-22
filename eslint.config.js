// eslint.config.js
import js from '@eslint/js'
import vuePlugin from 'eslint-plugin-vue'
import vuePrettier from '@vue/eslint-config-prettier'
import globals from 'globals'

export default [
  // Базовые правила JS
  js.configs.recommended,

  // Правила для Vue 3 (используем плоский конфиг)
  ...vuePlugin.configs['flat/recommended'],

  // Правила Prettier
  vuePrettier,

  // Ваши пользовательские настройки
  {
    files: ['**/*.{js,jsx,vue,cjs,mjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Отключаем требование имен из нескольких слов для компонентов
      'vue/multi-word-component-names': 'off',

      // Можно добавить другие правила
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
]
