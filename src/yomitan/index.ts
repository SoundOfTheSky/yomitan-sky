import { file } from 'bun'

import { downloadWK, WK, WKAnySubject, WKObject } from '../wanikani'

import { generateKanji } from './kanji'
import { generateTerms } from './term'
import YomitanDictionary from './yomitan-dictionary'

const dictionary = new YomitanDictionary({
  author: 'SoundOfTheSky',
  description: '',
  downloadUrl: 'https://raw.githubusercontent.com/SoundOfTheSky/yomitan-sky/refs/heads/main/dist/Sky.zip',
  format: 3,
  indexUrl: 'https://raw.githubusercontent.com/SoundOfTheSky/yomitan-sky/refs/heads/main/dist/Sky.json',
  isUpdatable: true,
  revision: '1.3.0-' + new Date().toISOString().split('T')[0],
  sequenced: true,
  sourceLanguage: 'ja',
  targetLanguage: 'en',
  title: 'Sky',
  attribution: 'This dictionary simply combines following sources:',
  url: 'https://github.com/SoundOfTheSky/yomitan-sky',
})

// === Download assets and merge ===
const download = process.env.DOWNLOAD === 'true'
if (download) {
  await downloadWK()
  dictionary.index.attribution += `\n\n=== WaniKani ===\nLink: https://www.wanikani.com\n© Tofugu LLC`
}
WK.push(...await file('assets/WK.json').json() as WKObject<WKAnySubject>[])
await dictionary.merge('jitendex', 'https://github.com/stephenmk/stephenmk.github.io/releases/latest/download/jitendex-yomitan.zip', download)
await dictionary.merge('kanjidic', 'https://github.com/yomidevs/jmdict-yomitan/releases/latest/download/KANJIDIC_english.zip', download)

// === Process ===
dictionary.tag.push([
  'wk',
  'misc',
  0,
  'WaniKani level',
  0,
])
generateTerms(dictionary)
generateKanji(dictionary)

await dictionary.save()
