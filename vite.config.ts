import { defineConfig } from 'vite'
import { resolve } from 'path'
import { dependencies } from './package.json'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true
    }),
  ],
  build: {
    minify: false,
    target: 'esnext',
    lib: {
      entry: resolve('./src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [/^node:/, ...Object.keys(dependencies)],
    }
  },
})
