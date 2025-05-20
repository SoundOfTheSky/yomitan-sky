import { mkdirSync, rmSync } from 'node:fs'
import Path from 'node:path'

import { $, file } from 'bun'
import { Database } from 'bun:sqlite'

export type DeckOptions = {
  deckName: string
  deckDescription: string
  noteName: string
  fields: {
    name: string
    media: string[]
    sticky: boolean
    rtl: boolean
    ord: number
    font: string
    size: number
  }[]
  cards: {
    name: string
    front: string
    back: string
  }[]
  css: string
}
export class AnkiDeck {
  public db
  public media: string[] = []
  private lastNoteId = 1
  private lastCardId = 1
  private deckId = 1
  private modelId = 1
  private $createNote
  private $createCard
  private $getLastByGUID
  private $getByGUID

  public constructor(public options: DeckOptions) {
    const path = Path.join('assets', options.deckName)
    rmSync(path)
    mkdirSync(path)
    this.db = new Database(Path.join(path, 'collection.anki2'), {
      create: true,
      readwrite: true,
      strict: true,
    })
    this.initializeDatabase(options)
    this.$createNote = this.db.prepare(``)
    this.$getLastByGUID = this.db.prepare<
      Record<string, number>,
      {
        table: string
        guid: string
        col: string
      }
    >(`SELECT :col FROM :table WHERE guid >= :guid ORDER BY :col DESC LIMIT 1`)
    this.$getByGUID = this.db.prepare<
      Record<string, string | number>,
      {
        table: string
        guid: string
      }
    >(`SELECT * FROM :table WHERE guid = :guid`)
    this.$createNote = this.db.prepare<
      unknown,
      {
        id: number
        guid: string
        mid: number
        mod: number
        usn: -1
        tags: string
        flds: string
        sfld: string
        csum: number
        flags: 0
        data: ''
      }
    >(
      `INSERT OR REPLACE INTO notes VALUES(:id,:guid,:mid,:mod,:usn,:tags,:flds,:sfld,:csum,:flags,:data)`,
    )
    this.$createCard = this.db.prepare<
      unknown,
      {
        id: number
        nid: number
        did: number
        ord: 0
        mod: number
        usn: -1
        type: 0
        queue: 0
        due: 179
        ivl: 0
        factor: 0
        reps: 0
        lapses: 0
        left: 0
        odue: 0
        odid: 0
        flags: 0
        data: ''
      }
    >(
      'INSERT OR REPLACE INTO cards VALUES(:id,:nid,:did,:ord,:mod,:usn,:type,:queue,:due,:ivl,:factor,:reps,:lapses,:left,:odue,:odid,:flags,:data)',
    )
  }

  public async save() {
    const path = Path.join('assets', this.options.deckName)
    this.db.close()
    const mediaFile: Record<string, string> = {}
    for (let index = 0; index < this.media.length; index++)
      mediaFile[index.toString()] = this.media[index]!
    await file(Path.join(path, 'media')).write(JSON.stringify(mediaFile))
    await $`zip -r -9 ../../dist/${this.options.deckName}.apkg ./*`.cwd(path)
  }

  public addCard(flds: string[], tags?: string[]) {
    const fields = flds.join('\u001F')
    const guid = this.hex(fields)
    const now = Date.now()
    const module_ = now | 0
    this.$createNote.run({
      id: ++this.lastNoteId,
      guid: guid,
      mid: this.modelId,
      mod: module_,
      usn: -1,
      tags: tags
        ? ' ' + tags.map((tag) => tag.replaceAll(' ', '_')).join(' ') + ' '
        : '',
      flds: fields,
      sfld: flds[0]!,
      csum: Number.parseInt(this.hex(flds[0]!).slice(0, 8), 16),
      flags: 0,
      data: '',
    })
    this.$createCard.run({
      id: ++this.lastCardId,
      nid: this.modelId,
      did: this.deckId,
      ord: 0,
      mod: module_,
      usn: -1,
      type: 0,
      queue: 0,
      due: 179,
      ivl: 0,
      factor: 0,
      reps: 0,
      lapses: 0,
      left: 0,
      odue: 0,
      odid: 0,
      flags: 0,
      data: '',
    })
  }

  private hex(data: string) {
    const hasher = new Bun.CryptoHasher('sha1')
    hasher.update(data)
    return hasher.digest('hex')
  }

  private getId(table: string, guid: string, col = 'id'): number | undefined {
    const item = this.$getByGUID.get({
      table,
      guid,
    })
    if (item) return item[col] as number
    const item2 = this.$getLastByGUID.get({
      table,
      guid,
      col,
    })
    if (item2) return item2[col]! + 1
  }

  /** Big stuff */
  private initializeDatabase(options: {
    deckName: string
    deckDescription: string
    noteName: string
    fields: {
      name: string
      media: string[]
      sticky: boolean
      rtl: boolean
      ord: number
      font: string
      size: number
    }[]
    cards: {
      name: string
      front: string
      back: string
    }[]
    css: string
  }) {
    const now = Date.now()
    const module_ = (now / 1000) | 0
    this.modelId = now
    this.deckId = now + 1
    this.db.exec(`-- Cards are what you review. 
-- There can be multiple cards for each note, as determined by the Template.
CREATE TABLE cards (
    id              integer primary key,
      -- the epoch milliseconds of when the card was created
    nid             integer not null,--    
      -- notes.id
    did             integer not null,
      -- deck id (available in col table)
    ord             integer not null,
      -- ordinal : identifies which of the card templates or cloze deletions it corresponds to 
      --   for card templates, valid values are from 0 to num templates - 1
      --   for cloze deletions, valid values are from 0 to max cloze index - 1 (they're 0 indexed despite the first being called)
    mod             integer not null,
      -- modification time as epoch seconds
    usn             integer not null,
      -- update sequence number : used to figure out diffs when syncing. 
      --   value of -1 indicates changes that need to be pushed to server. 
      --   usn < server usn indicates changes that need to be pulled from server.
    type            integer not null,
      -- 0=new, 1=learning, 2=review, 3=relearning
    queue           integer not null,
      -- -3=user buried(In scheduler 2),
      -- -2=sched buried (In scheduler 2), 
      -- -2=buried(In scheduler 1),
      -- -1=suspended,
      -- 0=new, 1=learning, 2=review (as for type)
      -- 3=in learning, next rev in at least a day after the previous review
      -- 4=preview
    due             integer not null,
     -- Due is used differently for different card types: 
     --   new: the order in which cards are to be studied; starts from 1.
     --   learning/relearning: epoch timestamp in seconds
     --   review: days since the collection's creation time
    ivl             integer not null,
      -- interval (used in SRS algorithm). Negative = seconds, positive = days
      -- v2 scheduler used seconds for (re)learning cards and days for review cards
      -- v3 scheduler uses seconds only for intraday (re)learning cards and days for interday (re)learning cards and review cards
    factor          integer not null,
      -- The ease factor of the card in permille (parts per thousand). If the ease factor is 2500, the card’s interval will be multiplied by 2.5 the next time you press Good.
    reps            integer not null,
      -- number of reviews
    lapses          integer not null,
      -- the number of times the card went from a "was answered correctly" 
      --   to "was answered incorrectly" state
    left            integer not null,
      -- of the form a*1000+b, with:
      -- a the number of reps left today
      -- b the number of reps left till graduation
      -- for example: '2004' means 2 reps left today and 4 reps till graduation
    odue            integer not null,
      -- original due: In filtered decks, it's the original due date that the card had before moving to filtered.
                    -- If the card lapsed in scheduler1, then it's the value before the lapse. (This is used when switching to scheduler 2. At this time, cards in learning becomes due again, with their previous due date)
                    -- In any other case it's 0.
    odid            integer not null,
      -- original did: only used when the card is currently in filtered deck
    flags           integer not null,
      -- an integer. This integer mod 8 represents a "flag", which can be see in browser and while reviewing a note. Red 1, Orange 2, Green 3, Blue 4, no flag: 0. This integer divided by 8 represents currently nothing
    data            text not null
      -- currently unused
);`)
    this.db
      .exec(`-- col contains a single row that holds various information about the collection
CREATE TABLE col (
    id              integer primary key,
      -- arbitrary number since there is only one row
    crt             integer not null,
      -- timestamp of the creation date in second. It's correct up to the day. For V1 scheduler, the hour corresponds to starting a new day. By default, new day is 4.
    mod             integer not null,
      -- last modified in milliseconds
    scm             integer not null,
      -- schema mod time: time when "schema" was modified. 
      --   If server scm is different from the client scm a full-sync is required
    ver             integer not null,
      -- version
    dty             integer not null,
      -- dirty: unused, set to 0
    usn             integer not null,
      -- update sequence number: used for finding diffs when syncing. 
      --   See usn in cards table for more details.
    ls              integer not null,
      -- "last sync time"
    conf            text not null,
      -- json object containing configuration options that are synced. Described below in "configuration JSONObjects"
    models          text not null,
      -- json object of json object(s) representing the models (aka Note types) 
      -- keys of this object are strings containing integers: "creation time in epoch milliseconds" of the models
      -- values of this object are other json objects of the form described below in "Models JSONObjects"
    decks           text not null,
      -- json object of json object(s) representing the deck(s)
      -- keys of this object are strings containing integers: "deck creation time in epoch milliseconds" for most decks, "1" for the default deck
      -- values of this object are other json objects of the form described below in "Decks JSONObjects"
    dconf           text not null,
      -- json object of json object(s) representing the options group(s) for decks
      -- keys of this object are strings containing integers: "options group creation time in epoch milliseconds" for most groups, "1" for the default option group
      -- values of this object are other json objects of the form described below in "DConf JSONObjects"
    tags            text not null
      -- a cache of tags used in the collection (This list is displayed in the browser. Potentially at other place)
);`)
    this.db
      .exec(`-- Contains deleted cards, notes, and decks that need to be synced. 
-- usn should be set to -1, 
-- oid is the original id.
-- type: 0 for a card, 1 for a note and 2 for a deck
CREATE TABLE graves (
    usn             integer not null,
    oid             integer not null,
    type            integer not null
);`)
    this.db
      .exec(`-- Notes contain the raw information that is formatted into a number of cards
-- according to the models
CREATE TABLE notes (
    id              integer primary key,
      -- epoch milliseconds of when the note was created
    guid            text not null,
      -- globally unique id, almost certainly used for syncing
    mid             integer not null,
      -- model id
    mod             integer not null,
      -- modification timestamp, epoch seconds
    usn             integer not null,
      -- update sequence number: for finding diffs when syncing.
      --   See the description in the cards table for more info
    tags            text not null,
      -- space-separated string of tags. 
      --   includes space at the beginning and end, for LIKE "% tag %" queries
    flds            text not null,
      -- the values of the fields in this note. separated by 0x1f (31) character.
    sfld            integer not null,
      -- sort field: used for quick sorting and duplicate check. The sort field is an integer so that when users are sorting on a field that contains only numbers, they are sorted in numeric instead of lexical order. Text is stored in this integer field.
    csum            integer not null,
      -- field checksum used for duplicate check.
      --   integer representation of first 8 digits of sha1 hash of the first field
    flags           integer not null,
      -- unused
    data            text not null
      -- unused
);`)
    this.db
      .exec(`-- revlog is a review history; it has a row for every review you've ever done!
CREATE TABLE revlog (
    id              integer primary key,
       -- epoch-milliseconds timestamp of when you did the review
    cid             integer not null,
       -- cards.id
    usn             integer not null,
        -- update sequence number: for finding diffs when syncing. 
        --   See the description in the cards table for more info
    ease            integer not null,
       -- which button you pushed to score your recall. 
       -- review:  1(wrong), 2(hard), 3(ok), 4(easy)
       -- learn/relearn:   1(wrong), 2(ok), 3(easy)
    ivl             integer not null,
       -- interval (i.e. as in the card table)
    lastIvl         integer not null,
       -- last interval (i.e. the last value of ivl. Note that this value is not necessarily equal to the actual interval between this review and the preceding review)
    factor          integer not null,
      -- factor
    time            integer not null,
       -- how many milliseconds your review took, up to 60000 (60s)
    type            integer not null
       --  0=learn, 1=review, 2=relearn, 3=filtered, 4=manual
);`)
    this.db.exec(`CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_notes_csum on notes (csum);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_revlog_usn on revlog (usn);`)
    this.db
      .prepare<
        unknown,
        [
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          string,
          string,
          string,
          string,
        ]
      >(`INSERT INTO "col" VALUES(?,?,?,?,?,?,?,?,?,?,?,'{}')`)
      .run(
        1,
        (now / 1000) | 0,
        now,
        now,
        11,
        0,
        0,
        0,
        JSON.stringify({
          nextPos: 1,
          estTimes: true,
          activeDecks: [1],
          sortType: 'noteFld',
          timeLim: 0,
          sortBackwards: false,
          addToCur: true,
          curDeck: 1,
          newBury: true,
          newSpread: 0,
          dueCounts: true,
          curModel: now.toString(),
          collapseTime: 1200,
        }),
        JSON.stringify({
          [this.modelId]: {
            veArs: [],
            name: options.noteName,
            tags: ['Tag'],
            did: this.deckId,
            usn: -1,
            req: [[0, 'all', [0]]],
            flds: options.fields,
            sortf: 0,
            latexPre:
              '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
            tmpls: options.cards.map((card, index) => ({
              name: card.name,
              qfmt: card.front,
              did: null,
              bafmt: '',
              afmt: card.back,
              ord: index,
              bqfmt: '',
            })),
            latexPost: String.raw`\end{document}`,
            type: 0,
            id: this.modelId,
            css: options.css,
            mod: module_,
          },
        }),
        JSON.stringify({
          [this.deckId]: {
            desc: options.deckDescription,
            name: options.deckName,
            extendRev: 50,
            usn: -1,
            collapsed: false,
            newToday: [0, 0],
            timeToday: [0, 0],
            dyn: 0,
            extendNew: 10,
            conf: 1,
            revToday: [0, 0],
            lrnToday: [0, 0],
            id: this.deckId,
            mod: module_,
          },
        }),
        JSON.stringify({
          1: {
            name: 'Default',
            replayq: true,
            lapse: {
              leechFails: 8,
              minInt: 1,
              delays: [10],
              leechAction: 0,
              mult: 0,
            },
            rev: {
              perDay: 100,
              fuzz: 0.05,
              ivlFct: 1,
              maxIvl: 36_500,
              ease4: 1.3,
              bury: true,
              minSpace: 1,
            },
            timer: 0,
            maxTaken: 60,
            usn: 0,
            new: {
              perDay: 20,
              delays: [1, 10],
              separate: true,
              ints: [1, 4, 7],
              initialFactor: 2500,
              bury: true,
              order: 1,
            },
            mod: 0,
            id: 1,
            autoplay: true,
          },
        }),
      )
  }
}
