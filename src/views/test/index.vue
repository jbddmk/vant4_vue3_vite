<template>
    <div ref="ref1">test</div>
    <!-- <item :ref="child" title="you are so cutest"></item>
    <Title ref="title1"></Title>
    <MyInput v-model="value" v-model:title="titleVal"/>
    <InputItem v-model.li="test"/> -->
    <MySlot #default="{item}">
        <h3>{{item.name}}</h3>
    </MySlot>
</template>

<script setup>
import { nextTick, ref, reactive, onMounted,watch,provide } from 'vue'
import { useRoute } from 'vue-router'
import item from './item.vue';
import Title from './title.vue';
import MyInput from './components/MyInput.vue';
import InputItem from './components/InputItem.vue';
import MySlot from './components/MySlot.vue';

provide('tp',{name:'is provide'})

let value = ref('')
let titleVal = ref('')
watch([value,titleVal],async (val,val2)=>{
    console.log(val,val2);
},{immediate:true})

let test = ref('')
watch(test,(val)=>{
    console.log(val,'双向绑定成功test');
})

</script>


<style scoped></style>