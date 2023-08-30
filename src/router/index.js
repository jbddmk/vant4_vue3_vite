import { createRouter,createWebHashHistory,createWebHistory } from "vue-router";

const constantRoutes = [
    {
        path:'/',
        name:'home',
        component:()=>import('@/views/home/index.vue')
    },
    {
        path:'/test',
        name:'test',
        component:()=>import('@/views/test/index.vue'),
        meta:{title:'测试'}
    },
    {
        path:'/pdf',
        name:'pdf',
        component:()=>import('@/views/pdf/index.vue'),
        meta:{title:'测试'}
    }
]

const getRouter = ()=>createRouter({
    history:createWebHashHistory(),
    routes:constantRoutes
})
const router = getRouter()

const clearRouter=()=>{
    let newRouter = getRouter()
    router.matcher = newRouter.matcher
}

export default router