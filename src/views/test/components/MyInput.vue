<template>
    <div>
        <input :value="modelValue" @input="$emit('update:modelValue',$event.target.value)" />
        <input :value="title" @input="$emit('update:title',$event.target.value)"/>
    </div>
</template>

<script setup>
  let props = defineProps(['modelValue','title'])
  let emit = defineEmits(['update:modelValue','update:title'])
  
</script>

<style lang="scss" scoped></style>