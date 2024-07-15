---
title: The Airy's Blog
subtext: Updates from the builder of Airy.
index: true
aside: false
---

<script setup>
import { data } from './index.data.ts'
</script>

<style scoped lang='scss'>
  .vp-doc > div {
    > h1 {
      font-size: 4rem;
      margin: 3rem 0;
    }

    > h2 {
      font-size: 2.5rem;
      padding-top: 3rem;
    }
  }

ul.articles {
    list-style: none;

    > li {

        > article {
            padding: 2rem 0;

            h1 {
              a {
                text-decoration: none;
              }
            }

        }
    }
    > li:not(:last-child) {
        border-bottom: 1px solid #7d7d7d;

        > article {
            padding-bottom: 3rem;
        }
    }
}  
</style>

<img src="./Logo.svg" width="128" />

# The Airy Blog

Welcome to the Airy blog! Here you'll find updates on the latest features, improvements, and news from the Airy team.

## Latest Posts

<ul class="articles">
  <li v-for="post in data" :key="post.id">
    <article>
      <h1><a :href="post.path">{{ post.title }}</a></h1>
      <p class="post-date">{{ post.date }}</p>
      <p>{{ post.excerpt }}</p>
      <a :href="post.path">Read more</a>
    </article>
  </li>
</ul>
