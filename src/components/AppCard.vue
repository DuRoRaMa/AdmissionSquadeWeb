<template>
  <div class="card shadow">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer text-muted">
      <slot name="footer" />
    </div>
  </div>
</template>