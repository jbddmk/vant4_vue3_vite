<template>
    <ul>
        <li v-for="(it) in list">
            <slot :item="it"></slot>
        </li>
    </ul>
    <div>{{ x+'-'+y }}</div>
</template>

<script setup>
    import { ref,inject,onMounted,onUnmounted } from 'vue'
    let list = ref([])
    list.value = new Array(10).fill(null).map((it,i)=>{
        return {name:'test'+i}
    })
    let val = inject('tp')
    console.log(val.name,'接收到provide');

    //获取当前坐标
    const getSite =()=>{
        let x = ref(0)
        let y = ref(0)
        document.onmousemove=e=>{
            console.log(e,999)
            x.value = e.pageX
            y.value = e.pageY
            return false
        }

        return {x,y}
    }
    //let {x,y}= getSite()
    //事件监听
   const listenSite =()=>{
    let x= ref(0)
    let y= ref(0)
    function update(e){
        console.log(e,666)
        x.value = e.pageX
        y.value = e.pageY
    }
     onMounted(() => {window.addEventListener('mousemove',update)})
     onUnmounted(() => {window.removeEventListener('mousemove',update)})
    return {x,y}
   }

   let {x,y} = listenSite()


</script>

<style lang="scss" scoped></style>