<template>
  <div class="custom-select" :class="{ open: isOpen, disabled: disabled }" ref="selectRef">
    <div class="select-trigger" @click="toggleDropdown" ref="triggerRef">
      <span class="selected-value">{{ selectedLabel || placeholder }}</span>
      <span class="arrow" :class="{ rotated: isOpen }">▼</span>
    </div>
    <Teleport to="body">
      <Transition name="dropdown">
        <ul v-show="isOpen" class="dropdown-list" :style="dropdownStyle">
          <li
            v-for="option in options"
            :key="option.value"
            @click="selectOption(option)"
            :class="{ selected: option.value === modelValue }"
          >
            {{ option.label }}
          </li>
        </ul>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  options: { type: Array, required: true },
  placeholder: { type: String, default: 'Выберите...' },
  disabled: Boolean
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectRef = ref(null)
const triggerRef = ref(null)
const dropdownStyle = ref({})

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected ? selected.label : null
})

async function updateDropdownPosition() {
  if (!triggerRef.value) return
  await nextTick()
  const rect = triggerRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom}px`,        // исправлено: без scrollY
    left: `${rect.left}px`,          // исправлено: без scrollX
    width: `${rect.width}px`,
    margin: 0,
    zIndex: 9999
  }
}

async function toggleDropdown() {
  if (props.disabled) return
  if (!isOpen.value) {
    await updateDropdownPosition()
    isOpen.value = true
  } else {
    isOpen.value = false
  }
}

function selectOption(option) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function closeDropdown(e) {
  if (!selectRef.value?.contains(e.target)) {
    isOpen.value = false
  }
}

function handleScrollResize() {
  if (isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
  window.addEventListener('scroll', handleScrollResize, true)
  window.addEventListener('resize', handleScrollResize)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
  window.removeEventListener('scroll', handleScrollResize, true)
  window.removeEventListener('resize', handleScrollResize)
})
</script>

<style scoped>
.custom-select {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 240px;
  font-size: 0.85rem;
}

.select-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.8rem;
  background: var(--input-bg);
  border: var(--input-border);
  border-radius: 50px;
  color: var(--text-color);
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-trigger:hover {
  opacity: 0.9;
}

.custom-select.disabled .select-trigger {
  opacity: 0.6;
  cursor: not-allowed;
}

.selected-value {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow {
  font-size: 0.6rem;
  transition: transform 0.2s;
  margin-left: 0.4rem;
  flex-shrink: 0;
}

.arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-list {
  background: var(--card-bg-solid);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  list-style: none;
  padding: 4px 0;
  margin: 4px 0 0;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: var(--card-shadow);
}

.dropdown-list li {
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--text-color);
  font-size: 0.85rem;
  white-space: nowrap;
}

.dropdown-list li:hover {
  background: rgba(102, 126, 234, 0.1);
}

.dropdown-list li.selected {
  background: rgba(102, 126, 234, 0.2);
  font-weight: 500;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 576px) {
  .custom-select {
    max-width: 100%;
  }
}
</style>