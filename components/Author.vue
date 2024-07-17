<script setup lang="ts">
import { fileCache } from '../.vitepress/readFileCache';

const props = defineProps<{
    avatar: string,
    name: string
}>()
const imageUrl = (fileCache[props.avatar.slice(1)]) || props.avatar;

</script>

<template>
    <div class="author">
        <img v-if="avatar" :src="imageUrl" alt="avatar" loading="lazy"/>
        <div v-else class="avatar-placeholder">{{ props.name[0].toUpperCase() }}</div>
        <p>{{ name }}</p>
    </div>
</template>
