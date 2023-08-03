<template>
    <van-cell-group inset>
        <van-field label="设备编号" readonly label-align="left" input-align="right" placeholder="" v-model="form.devNumber"/>
        <van-field label="设备名称" readonly input-align="right" placeholder="" v-model="form.devName" />
        <van-field label="设备型号" readonly input-align="right" placeholder="" v-model="form.devTs" />
        <van-field label="设备牌照" readonly input-align="right" placeholder="" v-model="form.devPlate" />
        <van-field label="设备等级" readonly input-align="right" placeholder="" v-model="form.devLevel"/>
        <van-field label="设备类型" readonly input-align="right" placeholder="" v-model="form.devType"/>
        <van-field label="登记时间" readonly input-align="right" placeholder="" v-model="form.roachTime"/>
        <van-field label="报废时间" readonly input-align="right" placeholder="" v-model="form.exitTime"/>
        <van-field label="操作员" readonly input-align="right" placeholder=""   v-model="form.operator"/>
        <van-field label="使用地点" readonly input-align="right" placeholder="" v-model="form.usePlace"/>
        <van-field label="工区" readonly input-align="right" placeholder=""     v-model="form.workArea"/>
        <van-field label="功率(kw)" readonly input-align="right" placeholder="" v-model="form.power"/>
        <van-cell value="" title-class="img-con">
            <template #title>
                <span class="custom-title">照片</span>
            </template>
        </van-cell>
        <div class="img-box">
            <div class="img-it">
                <van-image
                        @click="previewImg(form.photo)"
                        width="10rem"
                        height="10rem"
                        fit="cover"
                        :src="baseURL+form.photo"
                />
            </div>
        </div>

        <div><span>操作员</span></div>
        <van-image
            @click="previewImg(form.operatorPhoto)"
            width="10rem"
            height="10rem"
            fit="contain"
            :src="baseURL+form.operatorPhoto"
        />
    </van-cell-group>
    <div class="footer"></div>
    <van-overlay :show="loading">
        <div class="wrapper" @click.stop>
            <van-loading  type="spinner" color="#1989fa" />
        </div>
    </van-overlay>

</template>

<script setup>
    import { ref,reactive,onMounted} from 'vue'
    import {useRoute,useRouter} from 'vue-router'
    import {detailApi} from "../../api";
    import { showImagePreview } from 'vant';
    const route = useRoute()
    const form = ref({
        devNumber:'',
        devName:'',
        devTs:'',
        devPlate:'',
        devLevel:'',
        devType:'',
        roachTime:'',
        exitTime:'',
        operator:'',
        usePlace:'',
        workArea:'',
        power:'',
        photo:'',
        operatorPhoto:'',
    })
    let baseURL = '/prod-api'
    let loading = ref(false)
    onMounted(()=>{
        let id = route.query.id
        loading.value = true
        detailApi(id).then(res=>{
            loading.value = false
            if(res.code==200){
                form.value = {...form.value,...res.data}
            }
        }).catch(err=>{
            loading.value= false
        })
    })

    const previewImg=(src)=>{
        src = baseURL+src
        showImagePreview({
            images:[src],
            closeable: true,
        });
    }

</script>

<style lang="less" scoped>
    .footer {
        margin: 10px 0;
    }
    .img-box {
        width: 100%;
        display: flex;
        flex-direction:row;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        .img-it {
            width: 10rem;
            height: 10rem;
            margin: 5px;
        }
    }
    .wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

</style>