<script setup>
defineProps({
  index: { type: Number, default: 0 },
})
</script>

<template>
  <div class="skel-card" :style="`--skel-delay: ${index * 45}ms`">
    <div class="skel-img" />
    <div class="skel-body">
      <div class="skel-line skel-t1" />
      <div class="skel-line skel-t2" />
      <div class="skel-line skel-t3" />
      <div class="skel-line skel-t4" />
      <div class="skel-chips">
        <div class="skel-chip" />
        <div class="skel-chip skel-chip-sm" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skel-card {
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1.5px solid var(--color-stroke);
  overflow: hidden;
  background: var(--color-bg);
  animation: skelIn 250ms var(--ease-ui-out) var(--skel-delay, 0ms) both;
}

@keyframes skelIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.skel-line,
.skel-img,
.skel-chip {
  background: linear-gradient(
    90deg,
    var(--color-surface)       0%,
    var(--color-surface-hover) 40%,
    var(--color-surface)       80%
  );
  background-size: 400% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: 6px;
}

.skel-img {
  aspect-ratio: 3 / 2;
  border-radius: 0;
  animation-delay: var(--skel-delay, 0ms);
}

.skel-body {
  padding: 14px 15px 15px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.skel-line { height: 13px; }
.skel-t1   { width: 82%;  animation-delay: calc(var(--skel-delay, 0ms) + 60ms); }
.skel-t2   { width: 100%; animation-delay: calc(var(--skel-delay, 0ms) + 100ms); }
.skel-t3   { width: 65%;  animation-delay: calc(var(--skel-delay, 0ms) + 140ms); }
.skel-t4   { width: 88%;  animation-delay: calc(var(--skel-delay, 0ms) + 175ms); }

.skel-chips { display: flex; gap: 6px; margin-top: auto; padding-top: 8px; }
.skel-chip    { height: 24px; width: 72px; border-radius: 8px; animation-delay: calc(var(--skel-delay, 0ms) + 210ms); }
.skel-chip-sm { width: 54px; animation-delay: calc(var(--skel-delay, 0ms) + 240ms); }

@keyframes shimmer {
  0%   { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>
