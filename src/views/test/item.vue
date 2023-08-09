<template>
  <div class="-container">{{ title }}</div>
</template>

<script setup>
    import {ref,defineExpose,defineProps} from 'vue'
    defineProps(['title'])

    let name = ref('child')
    let a = 'hello'
    defineExpose({
        name,
        a
    })
</script>

<style lang="less" scoped></style>