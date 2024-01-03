/** 签章接口*/
import request from '@/util/request'

export const getSealsApi =(projectId)=>{
    return request({
        url: `/org/seal/account/${projectId}`,
        method: 'get',
    })
}
//获取集成信息
export const getPdfInfoByIdApi=(id,signType)=>{
    console.log(signType,1122)
    return request({
        url: `/sign/info/${id}`,
        method:"GET",
        params:{signType}
    })
}