<template>
  <article class="sf-course-card" :class="'sf-course-card--'+appearance">
    <div class="sf-course-card__poster">
      <img :src="image" :alt="imageAlt" :style="imageStyle" data-source-asset="true">
      <slot name="badge"/>
      <div class="sf-course-card__caption"><h3>{{ title }}</h3><p><span>{{ duration }}</span><span v-if="level">{{ level }}</span></p></div>
    </div>
    <slot/>
  </article>
</template>
<script>
export default {name:'SfCourseCard',props:{title:{type:String,required:true},image:{type:String,required:true},imageAlt:{type:String,default:''},duration:String,level:String,appearance:{type:String,default:'hero',validator:value=>['hero','compact','history'].includes(value)},imageStyle:Object}}
</script>
