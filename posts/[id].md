<script setup>
import { useData } from 'vitepress'
import Author from '../components/Author.vue'
import dayjs from 'dayjs'

const { title, params } = useData()
title.value = params.value.title

// const authors = params.value.authors?.map(author => author.name).join(', ')
const authors = params.value.authors ?? []
const date = dayjs(params.value.date).format("MMMM D, YYYY")
</script>

<img v-if="$params.cover" :src="$params.cover" className="img-cover"/>

# {{ $params.title }}

<p class="post-date">{{ date }}</p>

<div class="post-authors">
    <Author v-for="author in authors" :avatar="author.avatar" :name="author.name" />
</div>

<!-- @content -->
