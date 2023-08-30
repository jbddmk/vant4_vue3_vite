<template>
   this is title
   <Item1></Item1>
</template>

<script>
import { ref } from 'vue'
import Item1 from './components/item1.vue'
    export default {
        components:{ Item: Item1, Item1 },
        setup(){
            let a = '1111222'
            return {
                a
            }
        }
    }

</script>

<style lang="scss" scoped>

</style>