import { createRouter,createWebHashHistory,createWebHistory } from "vue-router";

const constantRoutes = [
    {
        path:'/',
        name:'home',
        component:()=>import('@/views/home/index.vue')
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