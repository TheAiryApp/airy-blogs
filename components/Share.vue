<script setup lang="ts">
import { defineClientComponent } from 'vitepress';

const Email = defineClientComponent(() => import('./Social/Email.vue'));
const LinkedIn = defineClientComponent(() => import('./Social/LinkedIn.vue'));
const Twitter = defineClientComponent(() => import('./Social/Twitter.vue'));
const Reddit = defineClientComponent(() => import('./Social/Reddit.vue'));
</script>

<template>
  <div class="share">
    <Email />
    <LinkedIn />
    <Twitter />
    <Reddit />
  </div>
</template>
