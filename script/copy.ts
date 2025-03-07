import { constants, copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const src = resolve(process.argv[2])
const target = resolve(process.argv.at(-1)!)

try {
  await copyFile(src, target, constants.COPYFILE_EXCL)
} catch (err) {
  console.error('Failed to copy the file')
  console.error(err)
}
