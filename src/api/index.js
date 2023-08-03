import request from '@/util/request'

export const detailApi = (id)=>{
    return request({
        url:'/mechanics/mechanics/'+id,
        method:'get'
    })
}