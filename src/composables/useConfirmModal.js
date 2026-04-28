// composables/useConfirmModal.js
import { createApp, ref } from 'vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

let modalInstance = null

export function useConfirmModal() {
  if (!modalInstance) {
    const div = document.createElement('div')
    document.body.appendChild(div)
    const app = createApp(ConfirmModal)
    modalInstance = app.mount(div)
  }

  const confirm = (options) => {
    return modalInstance.open(options)
  }

  return { confirm }
}