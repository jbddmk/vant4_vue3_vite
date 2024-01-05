import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from "path";
// import requireTransform from 'vite-plugin-require-transform';//支持commonjs之require语法
const pathResolve = path => resolve(process.cwd(), path)
// https://vitejs.dev/config/
export default defineConfig({
    base:'/signH5',
    plugins: [
        vue(),
        // requireTransform({
        //     fileRegex: /.js$|.vue$|.ts$/
        // }),
    ],
    resolve: {
        alias: {
            "@": pathResolve('src')
        },
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    build: {
        outDir: 'outDist'
    },
    server: {
        https: false,
        host: true, // host: "0.0.0.0"
        port: 8088,
        open: false,
        /** 跨域设置允许 */
        cors: true,
        /** 端口被占用时，是否直接退出 */
        strictPort: false,
        /** 接口代理 */
        proxy: {
            "/api": {
                target: "http://192.168.0.101:8802",
                /** 是否允许跨域 */
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, "")
            },
            "/remotefile": {
                target: "http://192.168.0.101",
                /** 是否允许跨域 */
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/remotefile/, "")
            }
        }
    },
})
