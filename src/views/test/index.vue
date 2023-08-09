<template>
    <div ref="ref1">test</div>
    <item :ref="child" title="you are so cutest"></item>
</template>

<script setup>
import { nextTick, ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import item from './item.vue';

let name = ref('')
let id = ref(1)
const route = useRoute()
let state = ref({ count: 0 })
let { count } = state.value
// state.value.count = count + 1
count++
const reload = async () => {
    id.value++
    // await nextTick()
}
// reload()
// nextTick(()=>{
//     name.value = 'this is test'
//     id.value = route.query.id
// })
const ref1 = ref(null)
const child = ref('child')
nextTick(() => {
    console.log(child.value.name, 1111);
    console.log(child.value.a, 222)
})



</script>


<style scoped></style>