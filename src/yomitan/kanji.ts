import { WK, WKKanji } from '../wanikani'

import YomitanDictionary from './yomitan-dictionary'

export function generateKanji(dictionary: YomitanDictionary) {
  console.log('Building kanji bank...')
  const WKMap = new Map<string, WKKanji>()
  for (const subject of WK) {
    if (subject.object !== 'kanji' || subject.data.hidden_at) continue
    const kanji = subject.data as WKKanji
    WKMap.set(kanji.characters, kanji)
  }
  for (const item of dictionary.kanji) {
    const wkItem = WKMap.get(item[0])
    if (wkItem) {
      item[1] = [
        ...new Set([
          ...wkItem.readings
            .filter((r) => r.type === 'onyomi')
            .sort((a, b) => (a.primary ? 0 : 1) - (b.primary ? 0 : 1))
            .map((x) => x.reading),
          ...item[1].split(' '),
        ]),
      ].join(' ')
      item[2] = [
        ...new Set([
          ...wkItem.readings
            .filter((r) => r.type === 'kunyomi')
            .sort((a, b) => (a.primary ? 0 : 1) - (b.primary ? 0 : 1))
            .map((x) => x.reading),
          ...item[2].split(' '),
        ]),
      ].join(' ')
      item[4] = [
        ...new Set(
          [
            ...wkItem.meanings
              .sort((a, b) => (a.primary ? 0 : 1) - (b.primary ? 0 : 1))
              .map((x) => x.meaning),
            ...item[4],
          ].map((x) => x.toLowerCase()),
        ),
        clearWKText(
          `WaniKani Meaning:\n${
            wkItem.meaning_mnemonic
          }${wkItem.meaning_hint ? '\n' + wkItem.meaning_hint : ''}`,
        ),
        clearWKText(
          `WaniKani Reading:\n${
            wkItem.reading_mnemonic
          }${wkItem.reading_hint ? '\n' + wkItem.reading_hint : ''}`,
        ),
      ]
      item[5].wk = wkItem.level.toString()
    }
  }
}

const clearWKText = (text: string) =>
  text
    .replaceAll('<radical>', '{')
    .replaceAll('</radical>', '}')
    .replaceAll('<kanji>', '[')
    .replaceAll('</kanji>', ']')
    .replaceAll('<vocabulary>', '{')
    .replaceAll('</vocabulary>', '}')
    .replaceAll('<reading>', '{')
    .replaceAll('</reading>', '}')
    .replaceAll('<meaning>', '{')
    .replaceAll('</meaning>', '}')
