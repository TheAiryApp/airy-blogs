<script setup lang="ts">
import { computed, ref } from "vue";
import Icon from "./Icon.vue";

const {
  url,
  btnText,
  modalWidth,
  modalHeight,
  hasIcon,
  hasCounter,
  digitsCounter,
  keyCounter,
  isBlank,
  customIcon,
} = withDefaults(
  defineProps<{
    url: string;
    btnText: string;
    modalWidth: number;
    modalHeight: number;
    hasIcon: boolean;
    hasCounter: boolean;
    digitsCounter: number;
    keyCounter: string;
    isBlank: boolean;
    customIcon: string;
  }>(),
  {
    url: location.href,
    btnText: "LinkedIn",
    modalWidth: 500,
    modalHeight: 500,
    hasIcon: true,
    hasCounter: false,
    digitsCounter: 0,
    keyCounter: "",
    isBlank: true,
    customIcon: "",
  }
);

const counter = ref(0);
const shortCounter = computed(() => getShortNumber(counter.value, digitsCounter));

const emit = defineEmits<{
  (e: "onShare", data: { name: string }): void;
  (e: "onShareCounter", data: { name: string; counter: number }): void;
}>();

const createWindow = (width = 500, height = 500, params = "") => {
  const left = screen.width / 2 - width / 2;
  const top = screen.height / 2 - height / 2;
  return `width=${width},height=${height},left=${left},top=${top},${params}`;
};

const getShortNumber = (number, digits = 0) => {
  const units = ["k", "m", "g", "t", "p", "e", "z", "y"];

  for (let index = units.length - 1; index >= 0; index--) {
    const decimal = Math.pow(1000, index + 1);

    if (number <= -decimal || number >= decimal) {
      return `${Number(number / decimal).toFixed(digits)}${units[index]}`;
    }
  }

  return number;
};

const openShareWindow = () => {
  if (hasCounter) {
    emit("onShareCounter", {
      name: "LinkedIn",
      counter: counter.value,
    });
  } else {
    emit("onShare", { name: "LinkedIn" });
  }
  const configWindow = createWindow(modalWidth, modalHeight);
  const shareUrl = `https://www.linkedin.com/shareArticle?url=${encodeURIComponent(
    url
  )}`;

  return isBlank
    ? window.open(shareUrl, "_blank")
    : window.open(shareUrl, "Share this", configWindow);
};

const getShareCounter = () => {
  const callback = keyCounter || `LinkedIn_${crypto.randomUUID()}`;
  const script = document.createElement("script");
  script.src = `https://www.linkedin.com/countserv/count/share?url=${encodeURIComponent(
    url
  )}&callback=${callback}`;
  document.body.appendChild(script);

  window[callback] = (count) => {
    if (!count) return;
    counter.value = count.count;
  };
};
</script>

<template>
  <button
    :isBlank="isBlank"
    :url="url"
    class="share-button share-button--linkedIn"
    type="button"
    @click="openShareWindow"
  >
    <img v-if="customIcon" v-bind:src="customIcon" alt="" />
    <icon
      v-if="hasIcon === true"
      class="share-button__icon"
      iconName="LinkedIn"
    >
      <path
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </icon>
    <!-- <span v-if="btnText" class="share-button__text">{{ btnText }}</span> -->
    <span v-if="hasCounter && counter > 0" class="share-button__counter">{{
      shortCounter
    }}</span>
  </button>
</template>

<style lang="scss" scoped>
$main-color: hsla(194, 77%, 56%, 1);
$focus-color: hsla(194, 77%, 81%, 0.4);
$hover-color: hsla(194, 77%, 56%, 0.9);
$painted-color: hsla(193, 54%, 46%, 1);
</style>
