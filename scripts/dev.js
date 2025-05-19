//打包开发环境
import { parseArgs } from 'node:util'
import esbuild from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { log } from 'node:console'


const {
    values: { format },
    positionals,
} = parseArgs({
    allowPositionals: true,
    options: {
        format: {
            type: 'string',
            short: 'f',
            default: 'esm',
        },
    },
})
const target = positionals.length ? positionals[0] : 'vue'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
const outfile = resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`)



const require = createRequire(import.meta.url)
const pkg = require(`../packages/${target}/package.json`)

esbuild.context({
    entryPoints: [entry],//入口文件
    outfile, //输出文件地址
    format,//打包格式 cjs esm iife
    platform: format == 'cjs' ? 'node' : 'browser', //打包平台
    sourcemap: true,//开启sourcemap 方便调试
    bundle: true,//把所有依赖打包到一个文件中
    globalName: pkg.buildOptions.name //format 为iife时的全局变量名
}).then((ctx) => ctx.watch())

