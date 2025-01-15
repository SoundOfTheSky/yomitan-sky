
import { WK, WKKana, WKKanji, WKVocab } from '../wanikani'
import {
  DefinitionContent,
  StructuredContent,
  StructuredContentText
} from './types'
import YomitanDictionary from './yomitan-dictionary'

export function generateTerms(dictionary: YomitanDictionary) {
  console.log('Building term bank...')
  const WKMap = new Map<string, WKVocab | WKKana>()
  const WKKanjiById = new Map<number, WKKanji>()
  for (const subject of WK) {
    if(subject.object === 'kanji' && !subject.data.hidden_at)
      WKKanjiById.set(subject.id, subject.data as WKKanji)
    if (
      (subject.object !== 'vocabulary' &&
        subject.object !== 'kana_vocabulary') ||
      subject.data.hidden_at
    )
      continue
    const vocab = subject.data as WKVocab | WKKana
    WKMap.set(vocab.characters, vocab)
  }

  for (const item of dictionary.term) {
    const wkItem = WKMap.get(item[0]) ?? WKMap.get(item[1])
    if (wkItem) {
      if (!Array.isArray((item[5][0] as DefinitionContent).content)) continue
      const content = (
        (item[5][0] as DefinitionContent).content as StructuredContentText[]
      )[0]!.content as StructuredContentText[]
      content.unshift({
        tag: 'span',
        content: `WK ${wkItem.level}`,
        title: 'WaniKani level',
        style: {
          fontWeight: 'bold',
          fontSize: '0.8em',
          color: '#FFF',
          backgroundColor: '#565656',
          verticalAlign: 'text-bottom',
          borderRadius: '0.3em',
          marginRight: '0.25em',
          padding: '0.2em 0.3em',
          wordBreak: 'keep-all',
          cursor: 'help'
        }
      })
      const isVocab = 'component_subject_ids' in wkItem
      const text = (wkItem as WKVocab).meaning_mnemonic;
      if(isVocab && (text.toLowerCase().includes('the same')||text.toLowerCase().includes('same meaning'))) {
        for(const id of (wkItem as WKVocab).component_subject_ids) {
          const WKKanji = WKKanjiById.get(id)
          if(!WKKanji) continue
          content.push(WKToStructure('#0AF', `WaniKani Meaning Mnemonic for kanji ${WKKanji.characters}`, WKKanji.meaning_mnemonic))
        }
      } else content.push(WKToStructure('#0AF', 'WaniKani Meaning Mnemonic', (wkItem as WKVocab).meaning_mnemonic))
      if ('reading_mnemonic' in (wkItem as WKVocab)) {
        let text = (wkItem as WKVocab).reading_mnemonic;
        const index = text.indexOf('\n\n');
        if(index!==-1) text = text.slice(index+2);
        if(isVocab && (text.toLowerCase().includes('the same')||text.toLowerCase().includes('same reading'))) {
          for(const id of (wkItem as WKVocab).component_subject_ids) {
            const WKKanji = WKKanjiById.get(id)
            if(!WKKanji) continue
            content.push(WKToStructure('#F0A', `WaniKani Reading Mnemonic for kanji ${WKKanji.characters}`, WKKanji.reading_mnemonic))
          }
        } else content.push(WKToStructure('#F0A', 'WaniKani Reading Mnemonic', text))
      }
    }
  }
}

function createBlock(borderColor: string, content: StructuredContent): StructuredContentText {
  return {
    tag: 'div',
    style: {
      marginLeft: '0.5em',
    },
    content: {
      tag: 'div',
      content: {
        tag: 'div',
        style: {
          borderStyle: 'none none none solid',
          padding: '0.5rem',
          borderRadius: '0.4rem',
          borderWidth: 'calc(3em / var(--font-size-no-units, 14))',
          marginTop: '0.5rem',
          marginBottom: '0.5rem',
          borderColor,
          backgroundColor: `color-mix(in srgb, ${borderColor} 5%, transparent)`,
        },
        content,
      },
    },
  }
}

function WKToStructure(borderColor: string, title: string, text: string) {
  const content: StructuredContentText[] = [
    {
      tag: 'span',
      content: '',
    },
  ]
  let mode = 0
  let tag = ''
  for (let index = 0; index < text.length; index++) {
    const char = text[index]!
    if (mode === 0 && char === '<') {
      mode = 1
      tag = ''
    } else if (mode === 1) {
      if (char === '>') {
        if (['radical', 'kanji', 'vocabulary'].includes(tag))
          content.push({
            tag: 'span',
            content: '',
            style: {
              backgroundColor: '#0AF',
              color: '#FFF',
              padding: '0px 2px',
              borderRadius: '2px'
            }
          })
        else if (tag === 'meaning')
          content.push({
            tag: 'span',
            content: '',
            style: {
              backgroundColor: '#0AF',
              color: '#FFF',
              padding: '0px 2px',
              borderRadius: '2px'
            },
          })
        else if (tag === 'reading')
          content.push({
            tag: 'span',
            content: '',
            style: {
              backgroundColor: '#F0A',
              color: '#FFF',
              padding: '0px 2px',
              borderRadius: '2px'
            },
          })
        mode = 2
      } else tag += char
    } else if (mode === 2 && char === '<') mode = 3
    else if (mode === 3) {
      if (char === '>') {
        mode = 0
        content.push({
          tag: 'span',
          content: '',
        })
      }
    } else content.at(-1)!.content! += char
  }
  return createBlock(borderColor, [
    {
      tag: 'div',
      content: title,
      style: {
        fontStyle: 'italic',
        fontSize: '0.8em',
        color: '#777',
      }
    },
    {
      tag: 'div',
      style: {
        marginLeft: '0.5rem'
      },
      content
    }
  ])
}
