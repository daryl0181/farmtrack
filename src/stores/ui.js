import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {

  const toast       = ref('')
  const activeModal = ref(null)
  let toastTimer    = null

  function showToast(msg) {
    toast.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast.value = ''), 2500)
  }

  function openModal(name) { activeModal.value = name }
  function closeModal()    { activeModal.value = null }

  return { toast, activeModal, showToast, openModal, closeModal }
})
