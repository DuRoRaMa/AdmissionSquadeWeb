<script setup>
import { onMounted, ref } from 'vue'
import AppCard from '@/components/AppCard.vue'
import { useAvailabilityStore } from '@/stores/availability'

const availabilityStore = useAvailabilityStore()

const form = ref({
  squad: '',
  title: '',
  period_start: '',
  period_end: '',
  response_deadline: '',
  daysJson: `[
  {
    "date": "2026-08-01",
    "shifts": [
      { "shift_kind": "primary", "title": "Основная смена", "starts_at": "09:00:00", "ends_at": "15:00:00" }
    ]
  },
  {
    "date": "2026-08-02",
    "shifts": [
      { "shift_kind": "primary", "title": "Основная смена", "starts_at": "09:00:00", "ends_at": "15:00:00" },
      { "shift_kind": "extra", "title": "Дополнительная смена", "starts_at": "15:00:00", "ends_at": "20:00:00" }
    ]
  }
]`
})

onMounted(async () => {
  await availabilityStore.fetchForms()
})

async function submit() {
  let days = []
  try {
    days = JSON.parse(form.value.daysJson)
  } catch {
    alert('JSON дней заполнен некорректно')
    return
  }

  const payload = {
    squad: Number(form.value.squad),
    title: form.value.title,
    period_start: form.value.period_start,
    period_end: form.value.period_end,
    response_deadline: form.value.response_deadline || null,
    days
  }

  const result = await availabilityStore.createForm(payload)
  alert(result.message || (result.success ? 'Форма создана' : 'Ошибка'))
  if (result.success) {
    await availabilityStore.fetchForms()
  }
}

async function openForm(id) {
  const result = await availabilityStore.openForm(id)
  alert(result.message)
  await availabilityStore.fetchForms()
}

async function closeForm(id) {
  const result = await availabilityStore.closeForm(id)
  alert(result.message)
  await availabilityStore.fetchForms()
}
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>Новая форма доступности</template>

      <div class="form-grid">
        <input v-model="form.squad" class="app-field" placeholder="ID отряда" />
        <input v-model="form.title" class="app-field" placeholder="Название формы" />
        <input v-model="form.period_start" type="date" class="app-field" />
        <input v-model="form.period_end" type="date" class="app-field" />
        <input v-model="form.response_deadline" type="datetime-local" class="app-field form-full" />

        <textarea
          v-model="form.daysJson"
          rows="14"
          class="app-field app-textarea form-full"
          placeholder="JSON дней и смен"
        ></textarea>

        <button class="submit-btn" @click="submit">Создать форму</button>
      </div>
    </AppCard>

    <AppCard>
      <template #header>Список форм</template>

      <div v-if="availabilityStore.isLoading">Загрузка...</div>

      <div v-else class="table-wrap">
        <table class="app-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Период</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in availabilityStore.forms" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.title }}</td>
              <td>{{ item.period_start }} — {{ item.period_end }}</td>
              <td>{{ item.status }}</td>
              <td class="actions-cell">
                <button class="ghost-btn" @click="openForm(item.id)">Открыть</button>
                <button class="ghost-btn" @click="closeForm(item.id)">Закрыть</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.page-stack { display: flex; flex-direction: column; gap: 24px; }
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.form-full { grid-column: 1 / -1; }
.app-field {
  width: 100%;
  border-radius: 14px;
  border: var(--card-border);
  background: var(--header-footer-bg);
  color: var(--text-color);
  padding: 12px 14px;
}
.app-textarea { resize: vertical; font-family: ui-monospace, monospace; }
.submit-btn {
  width: fit-content;
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  background: var(--accent-gradient);
  color: white;
  font-weight: 600;
}
.table-wrap { overflow-x: auto; }
.app-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--text-color);
}
.app-table th, .app-table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  text-align: left;
}
.actions-cell { display: flex; gap: 10px; justify-content: flex-end; }
.ghost-btn {
  border: var(--card-border);
  border-radius: 12px;
  padding: 8px 12px;
  background: transparent;
  color: var(--text-color);
}
@media (max-width: 900px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>