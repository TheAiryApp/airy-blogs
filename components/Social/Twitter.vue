<script setup lang="ts">
import Icon from "./Icon.vue";

const {
  url,
  description,
  btnText,
  modalWidth,
  modalHeight,
  hasIcon,
  isBlank,
  customIcon,
} = withDefaults(
  defineProps<{
    url: string;
    description: string;
    btnText: string;
    modalWidth: number;
    modalHeight: number;
    hasIcon: boolean;
    isBlank: boolean;
    customIcon: string;
  }>(),
  {
    url: location.href,
    description: window.document.title,
    btnText: "Twitter",
    modalWidth: 500,
    modalHeight: 500,
    hasIcon: true,
    isBlank: true,
    customIcon: "",
  }
);

const emit = defineEmits<{
  (e: "onShare", data: { name: string }): void;
}>();

const createWindow = (width = 500, height = 500, params = "") => {
  const left = screen.width / 2 - width / 2;
  const top = screen.height / 2 - height / 2;
  return `width=${width},height=${height},left=${left},top=${top},${params}`;
};

const openShareWindow = () => {
  emit("onShare", { name: "Twitter" });
  const configWindow = createWindow(modalWidth, modalHeight);
  const shareUrl = `https://twitter.com/share?url=${encodeURIComponent(
    url
  )}&text=${encodeURIComponent(description)}`;

  return isBlank
    ? window.open(shareUrl, "_blank")
    : window.open(shareUrl, "Share this", configWindow);
};
</script>

<template>
  <button
    :url="url"
    :description="description"
    :isBlank="isBlank"
    class="share-button share-button--twitter"
    type="button"
    @click="openShareWindow"
  >
    <img v-if="customIcon" v-bind:src="customIcon" alt="" />
    <icon iconName="Twitter" class="share-button__icon" v-if="hasIcon === true">
      <path
        d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.959-2.173-1.559-3.591-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z"
      />
    </icon>
    <!-- <span v-if="btnText" class="share-button__text">{{ btnText }}</span> -->
  </button>
</template>

<style lang="scss" scoped>
$main-color: hsla(203, 89%, 53%, 1);
$focus-color: hsla(203, 82%, 78%, 0.4);
$hover-color: hsla(203, 89%, 53%, 0.9);
$painted-color: hsla(202, 66%, 43%, 1);
</style>
