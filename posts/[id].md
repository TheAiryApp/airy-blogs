<script setup>
import { useData } from 'vitepress'
import dayjs from 'dayjs'

const { title, params } = useData()
title.value = params.value.title

const authors = params.value.authors?.map(author => author.name).join(', ')
const date = dayjs(params.value.date).format("MMMM D, YYYY")
</script>

<img v-if="$params.cover" :src="$params.cover" className="img-cover"/>

# {{ $params.title }}

<p class="post-date">{{ date }}</p>

{{ authors }}

<!-- @content -->
