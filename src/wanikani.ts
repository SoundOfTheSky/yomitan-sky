import { write } from 'bun'

import { removeWholeSentenceWithSubstring } from './utilities'

export type WKResponse<T> = {
  object: string
  url: string
  pages: {
    per_page: number
    next_url?: string
    previous_url?: string
  }
  total_count: number
  data_updated_at: string
  data: WKObject<T>[]
}
export type WKObject<T> = {
  id: number
  object: string
  url: string
  data_updated_at: string
  data: T
}
export type WKSubject = {
  auxiliary_meanings: {
    meaning: string
    type: 'whitelist' | 'blacklist'
  }[]
  created_at: string
  document_url: string
  hidden_at?: string
  lesson_position: number
  level: number
  meaning_mnemonic: string
  meanings: {
    meaning: string
    primary: boolean
    accepted_answer: boolean
  }[]
  slug: string
  spaced_repetition_system_id: number
}
export type WKRadical = WKSubject & {
  amalgamation_subject_ids: number[]
  characters?: string
  character_images: {
    url: string
    content_type: 'image/png' | 'image/svg+xml'
    metadata: unknown
    inline_styles?: boolean
    color?: string
    dimensions?: string
    style_name?: string
  }[]
}
export type WKKanji = WKSubject & {
  characters: string
  amalgamation_subject_ids: number[]
  component_subject_ids: number[]
  meaning_hint?: string
  reading_hint?: string
  reading_mnemonic: string
  readings: {
    reading: string
    primary: boolean
    accepted_answer: boolean
    type: 'kunyomi' | 'nanori' | 'onyomi'
  }[]
  visually_similar_subject_ids: number[]
}
export type WKKana = WKSubject & {
  characters: string
  context_sentences: {
    en: string
    ja: string
  }[]
  meaning_mnemonic: string
  parts_of_speech: string[]
  pronunciation_audios: {
    url: string
    content_type: 'audio/mpeg' | 'audio/ogg'
    metadata: {
      gender: string
      source_id: number
      pronunciation: string
      voice_actor_id: number
      voice_actor_name: string
      voice_description: string
    }
  }[]
}
export type WKVocab = WKKana & {
  characters: string
  component_subject_ids: number[]
  readings: {
    reading: string
    primary: boolean
    accepted_answer: boolean
  }[]
  reading_mnemonic: string
}
export type WKAnySubject = WKRadical | WKKanji | WKKana | WKVocab

export async function downloadWK() {
  const subjects: WKObject<WKAnySubject>[] = []
  let nextUrl: string | undefined = 'https://api.wanikani.com/v2/subjects'
  while (nextUrl) {
    console.log(nextUrl)
    const json = (await fetch(nextUrl, {
      headers: {
        Authorization: 'Bearer ' + process.env.WK,
      },
    }).then((x) => x.json())) as WKResponse<WKAnySubject>
    try {
      nextUrl = json.pages.next_url
      subjects.push(...json.data)
    } catch (error) {
      console.error(json)
      throw error
    }
  }
  await write('assets/WK.json', JSON.stringify(subjects, undefined, 2))
}
export const WK: WKObject<WKAnySubject>[] = []

const unnecessary = [
  'ou know the readings',
  'ord is made up',
  'his is a jukugo word',
  'mnemonic to help',
  'know the readings',
  'consists of a kanji with hiragana',
  'ends with an う',
  'on your own',
  "anji portion uses the kun'yomi reading",
  'ou should be able',
  'same as the one you learned',
]

export function cutUnnecessary(text: string) {
  for (let index = 0; index < unnecessary.length; index++)
    text = removeWholeSentenceWithSubstring(text, unnecessary[index]!)
  return text
}
