<!-- Gyökér layout — Navbar + RouterView + mobil bottom nav. -->

<script setup>
import { RouterView, useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import MobileBottomNav from '@/components/mobile/MobileBottomNav.vue'

const route = useRoute()
</script>

<template>
  <div class="min-h-screen bg-bg text-text flex flex-col">
    <Navbar />

    <main
      :class="[
        'grow w-full relative flex flex-col pb-20 md:pb-0',
        route.meta?.fullWidth ? '' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8',
      ]"
    >
      <RouterView />
    </main>

    <MobileBottomNav />
  </div>
</template>
