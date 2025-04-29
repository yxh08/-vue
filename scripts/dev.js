//打包开发环境
import { parseArgs } from 'node:util'
import esbuild from 'esbuild'


console.log('开始打包')
console.log(process.argv)

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
console.log(format, positionals)

const entry  = 

esbuild({
    entry:

})

