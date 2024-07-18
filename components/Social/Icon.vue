<script setup lang='ts'>
import { computed } from 'vue';

const {iconName, viewBoxWidth, viewBoxHeight, width, height} = withDefaults(defineProps<{
  iconName: string,
  viewBoxWidth: number,
  viewBoxHeight: number,
  width: number,
  height: number
}>(), {
    width: 20,
    height: 20,
    viewBoxWidth: 24,
    viewBoxHeight: 24,
})

const titleId = computed(() => `${iconName.toLowerCase()}-svg-title`)
</script>


<template>
  <svg
    :aria-labelledby="titleId"
    :height="height"
    :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
    :width="width"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title :id="titleId" lang="en">{{ iconName }} icon</title>
    <slot></slot>
  </svg>
</template>
