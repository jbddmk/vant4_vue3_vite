import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {resolve} from "path";
// import requireTransform from 'vite-plugin-require-transform';//支持commonjs之require语法
const pathResolve = path => resolve(process.cwd(), path)
// https://vitejs.dev/config/
export default defineConfig({
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
        open: '/',
        proxy: {
            '^/prod-api': {
                target: 'http://192.168.0.39:8088',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/prod-api/, '')
            }
        }
    },
})
