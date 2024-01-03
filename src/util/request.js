import axios from 'axios'
import qs from 'qs'
import { showToast } from 'vant'
axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'
const service = axios.create({
    baseURL: '/api',
    timeout: 900000
})
service.interceptors.request.use(config => {
    config.headers['Authorization'] = "Bearer eyJhbGciOiJIUzUxMiJ9.eyJ1aWQiOjE2NDYxMjU1NzY0MzYxODcxMzcsImV4cCI6MTcwNDI4MzM3MiwiaWF0IjoxNzA0Mjc2MTcyLCJ0b2tlbiI6ImViZmE2NDM0NjA0NWU3MjllNjZmZDY0OGY4NGY0NDdmIn0.Hn-hdAo_D2xRpzWF5xetuFGvT8fubrjW6Wp0_s1alhYucW3y-263t_s4XaMef4wigjzMTBC7fmLbPj_k27vQdg"
    if (config.method === 'get') {
        // if(config.params&&Object.keys(config.params).length>0){
        //     config.url = config.url+'?'+qs.stringify(config.params,{ arrayFormat: 'repeat' })
        //     console.log(config.url,666)
        // }
        if (config.method === 'get') {
            config.paramsSerializer = function(params) {
                return qs.stringify(params, { arrayFormat: 'repeat' })
            }
        }
    }
    return config
}, error => {
    console.log(error)
})

service.interceptors.response.use(res => {
        // 未设置状态码则默认成功状态
        const code = res.data.code || 200;
        const msg = res.data.msg
            // 二进制数据则直接返回
        if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
            return res.data
        }
        if (code === 401) {
            showToast(msg);
            return Promise.reject('无效的会话，或者会话已过期，请重新登录。')
        } else if (code === 500) {
            showToast(msg);
            return Promise.reject(new Error(msg))
        } else if (code !== 200) {
            showToast(msg);
            return Promise.reject('error')
        } else {
            return res.data
        }
    },
    error => {
        console.log('err' + error)
        let { message } = error;
        if (message == "Network Error") {
            message = "后端接口连接异常";
        } else if (message.includes("timeout")) {
            message = "系统接口请求超时";
        } else if (message.includes("Request failed with status code")) {
            message = "系统接口" + message.substr(message.length - 3) + "异常";
        }
        showToast(message);
        return Promise.reject(error)
    }
)
export default service