<template>
  <div class="-container">{{ title }}</div>
</template>

<script setup>
    import {ref} from 'vue'
    let props = defineProps(['title'])

    console.log(props.title,999);

    let name = ref('child')
    let a = 'hello'
    defineExpose({
        name,
        a
    })
</script>

<style lang="less" scoped></style>