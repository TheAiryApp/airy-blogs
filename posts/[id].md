<script setup>
import { useData } from 'vitepress'
import { fileCache } from '../.vitepress/readFileCache'
import Author from '../components/Author.vue'
import dayjs from 'dayjs'

const { title, params } = useData()
title.value = params.value.title

// const authors = params.value.authors?.map(author => author.name).join(', ')
const authors = params.value.authors ?? []
const date = dayjs(params.value.date).format("MMMM D, YYYY")
const coverImage = params.value.cover && fileCache[params.value.cover.slice(1)];
</script>

<div class="post-header">
<img v-if="$params.cover" :src="coverImage" className="img-cover"/>

<h1>{{ $params.title }}</h1>

<p class="post-date">{{ date }}</p>

<div class="post-authors">
    <Author v-for="author in authors" :avatar="author.avatar" :name="author.name" />
</div>
</div>

<!-- @content -->
