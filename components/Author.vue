<script setup lang="ts">
const props = defineProps<{
    avatar: string,
    name: string
}>()

</script>

<template>
    <div class="author">
        <img v-if="avatar" :src="props.avatar" alt="avatar" loading="lazy"/>
        <div v-else class="avatar-placeholder">{{ props.name[0].toUpperCase() }}</div>
        <p>{{ name }}</p>
    </div>
</template>
