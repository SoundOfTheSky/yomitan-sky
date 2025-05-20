import { mkdirSync, rmSync } from 'node:fs'
import { cp, readdir, rename, rm, stat } from 'node:fs/promises'
import Path from 'node:path'

import { chunk } from '@softsky/utils'
import { $, file } from 'bun'

import { getDefaultHeaders } from '../utilities'

import {
  DictionaryIndex,
  DictionaryKanjiBankV3,
  DictionaryKanjiMetaBankV3,
  DictionaryTagBankV3,
  DictionaryTermBankV3,
  DictionaryTermMetaBankV3,
} from './types'

type Bank = 'term' | 'tag' | 'kanji' | 'kanji_meta' | 'term_meta'
const BANKS: Bank[] = ['term', 'tag', 'kanji', 'kanji_meta', 'term_meta']

export default class YomitanDictionary {
  public term: DictionaryTermBankV3 = []
  public tag: DictionaryTagBankV3 = []
  public kanji: DictionaryKanjiBankV3 = []
  public kanji_meta: DictionaryKanjiMetaBankV3 = []
  public term_meta: DictionaryTermMetaBankV3 = []

  public constructor(public index: DictionaryIndex) {
    const path = Path.join('dist', index.title)
    rmSync(path, {
      force: true,
      recursive: true,
    })
    rmSync(path + '.zip', {
      force: true,
    })
    mkdirSync(path, {
      recursive: true,
    })
  }

  public async save() {
    const path = Path.join('dist', this.index.title)
    const indexPath = Path.join(path, 'index.json')
    await file(indexPath).write(JSON.stringify(this.index))
    for (const bank of BANKS) await this.saveBank(bank)
    await $`zip -r -9 ../${this.index.title}.zip ./*`.cwd(path)
    await rename(indexPath, path + '.json')
    await rm(path, {
      force: true,
      recursive: true,
    })
  }

  public async merge(name: string, url: string) {
    const path = Path.join('assets', name)
    const indexPath = Path.join(path, 'index.json')
    if (!(await file(indexPath).exists())) {
      console.log(`Downloading ${name}...`)
      await file(`${path}.zip`).write(
        await fetch(url, {
          headers: getDefaultHeaders(),
        }),
      )
      await $`unzip ${path}.zip -d ${path}`
      await rm(path + '.zip', {
        force: true,
      })
    }
    console.log(`Merging ${name}...`)
    for (const bank of BANKS) await this.mergeBanks(name, bank)
    for (const fileName of await readdir(path)) {
      const path2 = Path.join(path, fileName)
      if (await stat(path2).then((x) => x.isDirectory()))
        await cp(path2, Path.join('dist', this.index.title, fileName), {
          recursive: true,
        })
    }
    const index = (await file(indexPath).json()) as DictionaryIndex
    this.index.attribution ??= ''
    this.index.attribution += `\n\n=== ${name} ===\nLink: ${url}\n`
    if (index.attribution) this.index.attribution += index.attribution
  }

  private async mergeBanks(name: string, bankName: Bank) {
    const bank = this[bankName]
    for (let index = 1; ; index++)
      try {
        bank.push(
          ...((await file(
            `assets/${name}/${bankName}_bank_${index}.json`,
          ).json()) as never[]),
        )
      } catch (error) {
        if (
          error instanceof Error &&
          (error as NodeJS.ErrnoException).code === 'ENOENT'
        )
          break
        else throw error
      }
  }

  private async saveBank(bankName: Bank) {
    const parts = chunk(this[bankName] as unknown[], 2000)
    for (let index = 0; index < parts.length; index++)
      await file(
        Path.join(
          'dist',
          this.index.title,
          `${bankName}_bank_${index + 1}.json`,
        ),
      ).write(JSON.stringify(parts[index]))
  }
}
