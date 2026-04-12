<script setup>
import { onMounted, ref } from 'vue'
import AppCard from '@/components/AppCard.vue'
import { useScheduleStore } from '@/stores/schedule'

const scheduleStore = useScheduleStore()

const form = ref({
  squad: '',
  title: '',
  period_start: '',
  period_end: '',
  needs: []
})

onMounted(async () => {
  await scheduleStore.fetchSchedules()
})

async function submit() {
  const payload = {
    squad: Number(form.value.squad),
    title: form.value.title,
    period_start: form.value.period_start,
    period_end: form.value.period_end,
    needs: form.value.needs
  }

  const result = await scheduleStore.createSchedule(payload)
  alert(result.message || (result.success ? 'График создан' : 'Ошибка'))
  if (result.success) {
    await scheduleStore.fetchSchedules()
  }
}

async function generateSchedule(id) {
  const result = await scheduleStore.generateSchedule(id)
  alert(result.message)
  await scheduleStore.fetchSchedules()
}

async function publishSchedule(id) {
  const result = await scheduleStore.publishSchedule(id)
  alert(result.message)
  await scheduleStore.fetchSchedules()
}
</script>

<template>
  <div class="page-stack">
    <AppCard>
      <template #header>Новый график</template>

      <div class="form-grid">
        <input v-model="form.squad" class="app-field" placeholder="ID отряда" />
        <input v-model="form.title" class="app-field" placeholder="Название графика" />
        <input v-model="form.period_start" type="date" class="app-field" />
        <input v-model="form.period_end" type="date" class="app-field" />

        <div class="note form-full">
          Для первой версии массив <code>needs</code> можно оставить пустым,
          а потребности добавлять отдельным шагом.
        </div>

        <button class="submit-btn" @click="submit">Создать график</button>
      </div>
    </AppCard>

    <AppCard>
      <template #header>Список графиков</template>

      <div v-if="scheduleStore.isLoading">Загрузка...</div>

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
            <tr v-for="item in scheduleStore.schedules" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.title }}</td>
              <td>{{ item.period_start }} — {{ item.period_end }}</td>
              <td>{{ item.status }}</td>
              <td class="actions-cell">
                <button class="ghost-btn" @click="generateSchedule(item.id)">Сгенерировать</button>
                <button class="ghost-btn primary-ghost" @click="publishSchedule(item.id)">Опубликовать</button>
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
.note {
  border-radius: 16px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}
.app-field {
  width: 100%;
  border-radius: 14px;
  border: var(--card-border);
  background: var(--header-footer-bg);
  color: var(--text-color);
  padding: 12px 14px;
}
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
.primary-ghost {
  background: rgba(255,255,255,0.06);
}
@media (max-width: 900px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>