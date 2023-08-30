<template>
    <input type="text" v-model="value" />
</template>

<script setup>
import { computed } from 'vue'
let props = defineProps(['modelValue','modelModifiers'])
let emit = defineEmits(['update:modelValue'])
let value = computed({
    get() {
        return props.modelValue
    },
    set(val) {
        if(props.modelModifiers.li){
            val = val.charAt(0).toUpperCase() + val.slice(1)
        }
        emit('update:modelValue', val)
    }
})

</script>

<style lang="scss" scoped></style>