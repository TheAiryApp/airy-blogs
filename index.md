---
title: The Airy's Blog
subtext: Updates from the builder of Airy.
index: true
aside: false
outline: false
---

<script setup>
import { data } from './index.data.ts'
import Author from './components/Author.vue' 
</script>

<style scoped lang='scss'>
  .vp-doc > div {
    > h1 {
      font-size: 3rem;
      line-height: 3.5rem;
      margin: 2rem 0;
      letter-spacing: 0.08rem;
    }

    section {
      margin: 2rem 0;
    }

    h2 {
      font-size: 2rem;
      line-height: 2.5rem;
      letter-spacing: 0.05rem;
      /* padding-top: 3rem; */
      border-top: none;
    }
  }

.header-anchor {
  visibility: hidden;
}

ul.articles {
    list-style: none;

    > li {
        > article {
            padding: 2rem 0;

            h1.post-title {
              letter-spacing: 0.04rem;
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

# The Airy's Blog

Welcome to the Airy blog! Here you'll find updates on the latest features, improvements, and news from the Airy team.

<section class="latest-posts">

## Latest Posts

<ul class="articles">
  <li v-for="post in data" :key="post.id">
    <article>
      <h1 class="post-title"><a :href="post.path">{{ post.title }}</a></h1>
      <p class="post-date">{{ post.date }}</p>
      <div class="post-authors">
          <Author v-for="author in post.authors" :avatar="author.avatar" :name="author.name"/>
      </div>
      <p>{{ post.excerpt }}</p>
      <a :href="post.path">Read more</a>
    </article>
  </li>
</ul>

</section>
