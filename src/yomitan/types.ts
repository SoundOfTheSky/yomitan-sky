/**
 * Metadata about the dictionary.
 */
export type DictionaryIndex = {
  /**
   * Title of the dictionary.
   */
  title: string
  /**
   * Revision of the dictionary. This value is displayed, and used to check for dictionary updates.
   */
  revision: string
  /**
   * Whether or not this dictionary contains sequencing information for related terms.
   */
  sequenced?: boolean
  /**
   * Format of data found in the JSON data files.
   */
  format?: 1 | 2 | 3
  /**
   * Alias for format.
   */
  version?: 1 | 2 | 3
  /**
   * Creator of the dictionary.
   */
  author?: string
  /**
   * Whether this dictionary contains links to its latest version.
   */
  isUpdatable?: true
  /**
   * URL for the index file of the latest revision of the dictionary, used to check for updates.
   */
  indexUrl?: string
  /**
   * URL for the download of the latest revision of the dictionary.
   */
  downloadUrl?: string
  /**
   * URL for the source of the dictionary, displayed in the dictionary details.
   */
  url?: string
  /**
   * Description of the dictionary data.
   */
  description?: string
  /**
   * Attribution information for the dictionary data.
   */
  attribution?: string
  /**
   * Language of the terms in the dictionary.
   */
  sourceLanguage?: string
  /**
   * Main language of the definitions in the dictionary.
   */
  targetLanguage?: string
  frequencyMode?: 'occurrence-based' | 'rank-based'
  /**
   * Tag information for terms and kanji. This object is obsolete and individual tag files should be used instead.
   */
  tagMeta?: Record<
    string,
    {
      /**
       * Category for the tag.
       */
      category?: string
      /**
       * Sorting order for the tag.
       */
      order?: number
      /**
       * Notes for the tag.
       */
      notes?: string
      /**
       * Score used to determine popularity. Negative values are more rare and positive values are more frequent. This score is also used to sort search results.
       */
      score?: number
    }
  >
}

export type Frequency =
  (string | number)
  | {
    value: number
    displayValue?: string
  }
/**
 * Information used in the kanji viewer - meanings, readings, statistics, and codepoints.
 * - [0] Kanji character
 * - [1] String of space-separated onyomi readings for the kanji character. An empty string is treated as no readings.
 * - [2] String of space-separated kunyomi readings for the kanji character. An empty string is treated as no readings.
 * - [3] String of space-separated tags for the kanji character. An empty string is treated as no tags.
 * - [4] Array of meanings for the kanji character.
 * - [5] Various stats for the kanji character.
 */
export type DictionaryKanjiBankV3 = [
  string,
  string,
  string,
  string,
  string[],
  Record<string, string>,
][]

/**
 * Custom metadata for kanji characters.
 * - [0] Name of metadata
 * - [1] Type of metadata
 * - [2] Data for character
 */
export type DictionaryKanjiMetaBankV3 = [string, 'freq', Frequency][]

/**
 * Defines tags for kanji and term dictionaries, like parts of speech or kanken level
 * - [0] Tag name
 * - [1] Category for the tag
 * - [2] Sorting order for the tag
 * - [3] Notes for the tag
 * - [4] Score used to determine popularity. Negative values are more rare and positive values are more frequent. This score is also used to sort search results.
 */
export type DictionaryTagBankV3 = [string, string, number, string, number][]

/**
 * Stores meta information about terms, such as frequency data and pitch accent data.
 * - [0] The text for the term
 * - [1] Type of data. \"freq\" corresponds to frequency information; \"pitch\" corresponds to pitch information. \"ipa\" corresponds to IPA transcription.
 * - [2] Data for term
 */
export type DictionaryTermMetaBankV3 =
  ([
    string,
    'freq',
    Frequency | {
    /**
     * Reading for the term.
     */
      reading: string
      /**
     * Frequency information for the term.
     */
      frequency: Frequency
    },
  ]
  | [
    string,
    'pitch',
    {
    /**
     * Reading for the term.
     */
      reading: string
      /**
     * List of different pitch accent information for the term and reading combination.
     */
      pitches: {
      /**
       * Mora position of the pitch accent downstep.
       * A value of 0 indicates that the word does not have a downstep (heiban).
       */
        position: number
        nasal?: number | number[]
        devoice?: number | number[]
        /**
       * List of tags for this pitch accent.
       */
        tags?: string[]
      }[]
    },
  ]
  | [
    string,
    'ipa',
    {
    /**
     * Reading for the term.
     */
      reading: string
      /**
     * List of different IPA transcription information for the term and reading combination.
     */
      transcriptions: {
      /**
       * IPA transcription for the term.
       */
        ipa: string
        /**
       * List of tags for this IPA transcription.
       */
        tags?: string[]
      }[]
    },
  ])[]

/**
 * Stores dictionary readings, definitions, etc.
 * - [0] The text for the term
 * - [1] Reading of the term, or an empty string if the reading is the same as the term
 * - [2] String of space-separated tags for the definition. An empty string is treated as no tags
 * - [3] String of space-separated rule identifiers for the definition which is used to validate deinflection.
 *  An empty string should be used for words which aren't inflected.
 * - [4] Score used to determine popularity.
 *  Negative values are more rare and positive values are more frequent.
 *  This score is also used to sort search results.
 * - [5] Array of definitions for the term.
 * - [6] Sequence number for the term.
 *  Terms with the same sequence number can be shown together when the \"resultOutputMode\" option is set to \"merge\".
 * - [7] String of space-separated tags for the term. An empty string is treated as no tags.
 */
export type DictionaryTermBankV3 = [
  string,
  string,
  string | null,
  string, number,
  Definition[],
  number,
  string,
][]
export type Definition = string | DefinitionText | DefinitionContent | DefinitionImage | [string, string[]]
export type DefinitionText = {
  type: 'text'
  text: string
}
export type DefinitionContent = {
  type: 'structured-content'
  content: StructuredContent
}
export type DefinitionImage = {
  type: 'image'
} & Omit<StructuredContentImg, 'tag' | 'data'>
export type StructuredContentBr = { tag: 'br', data?: StructuredContentData }
export type StructuredContentTable = {
  tag: 'ruby' | 'rt' | 'rp' | 'table' | 'thead' | 'tbody' | 'tfoot' | 'tr'
  content?: StructuredContent
  data?: StructuredContentData
  /** Defines the language of an element in the format defined by RFC 5646. */
  lang?: string
}
export type StructuredContentTableCell = {
  tag: 'td' | 'th'
  content?: StructuredContent
  data?: StructuredContentData
  colSpan?: number
  rowSpan?: number
  style?: StructuredContentStyle
  /** Defines the language of an element in the format defined by RFC 5646. */
  lang?: string
}
export type StructuredContentText = {
  tag: 'span' | 'div' | 'ol' | 'ul' | 'li' | 'details' | 'summary'
  content?: StructuredContent
  data?: StructuredContentData
  style?: StructuredContentStyle
  /** Hover text for the element */
  title?: string
  /** Whether or not the details element is open by default. */
  open?: boolean
  /** Defines the language of an element in the format defined by RFC 5646. */
  lang?: string
}
export type StructuredContentImg = {
  tag: 'img'
  data?: StructuredContentData
  /** Path to the image file in the archive. */
  path: string
  /** Preferred width of the image */
  width?: number
  /** Preferred height of the image */
  height?: number
  /** Hover text for the image */
  title?: string
  /** Alt text for the image */
  alt?: string
  /** Description of the image. */
  description?: string
  /** Whether or not the image should appear pixelated at sizes larger than the image's native resolution. */
  pixelated?: boolean
  /** Controls how the image is rendered. The value of this field supersedes the pixelated field. */
  imageRendering?: 'auto' | 'pixelated' | 'crisp-edges'
  /** Controls the appearance of the image. The \"monochrome\" value will mask the opaque parts of the image using the current text color. */
  appearance?: 'auto' | 'monochrome'
  /** Whether or not a background color is displayed behind the image. */
  background?: boolean
  /** Whether or not the image is collapsed by default */
  collapsed?: boolean
  /** Whether or not the image can be collapsed */
  collapsible?: boolean
  /** The vertical alignment of the image. */
  verticalAlign?: 'baseline' | 'sub' | 'super' | 'text-top' | 'text-bottom' | 'middle' | 'top' | 'bottom'
  /** Shorthand for border width, style, and color. */
  border?: string
  /** Roundness of the corners of the image's outer border edge. */
  borderRadius?: string
  /** The units for the width and height. */
  sizeUnits?: 'px' | 'em'
}
export type StructuredContentLink = {
  tag: 'a'
  content?: StructuredContent
  /** The URL for the link. URLs starting with a ? are treated as internal links to other dictionary content. */
  href: string
  /** Defines the language of an element in the format defined by RFC 5646. */
  lang?: string
}
export type StructuredContent =
  string
  | StructuredContentBr
  | StructuredContentTable
  | StructuredContentTableCell
  | StructuredContentText
  | StructuredContentImg
  | StructuredContentLink
  | StructuredContent[]
export type StructuredContentData = {
  type: string
  [key: string]: string
}
export type StructuredContentStyle = {
  fontStyle?: 'normal' | 'italic'
  fontWeight?: 'normal' | 'bold'
  fontSize?: string
  color?: string
  background?: string
  backgroundColor?: string
  textDecorationLine?:
    | ('none' | 'underline' | 'overline' | 'line-through')
    | ('underline' | 'overline' | 'line-through')[]
  textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy'
  textDecorationColor?: string
  borderColor?: string
  borderStyle?: string
  borderRadius?: string
  borderWidth?: string
  clipPath?: string
  verticalAlign?:
    | 'baseline'
    | 'sub'
    | 'super'
    | 'text-top'
    | 'text-bottom'
    | 'middle'
    | 'top'
    | 'bottom'
  textAlign?:
    | 'start'
    | 'end'
    | 'left'
    | 'right'
    | 'center'
    | 'justify'
    | 'justify-all'
    | 'match-parent'
  textEmphasis?: string
  textShadow?: string
  margin?: string
  marginTop?: number | string
  marginLeft?: number | string
  marginRight?: number | string
  marginBottom?: number | string
  padding?: string
  paddingTop?: string
  paddingLeft?: string
  paddingRight?: string
  paddingBottom?: string
  wordBreak?: 'normal' | 'break-all' | 'keep-all'
  whiteSpace?: string
  cursor?: string
  listStyleType?: string
}
