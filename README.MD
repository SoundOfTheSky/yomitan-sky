# Yomitan sky's dictionary
It's a compilation of multiple yomitan dictionaries into one with embedded WaniKani mnemonics both for kanji and vocabulary.

## Installation
1. Remove those dictionaries if you have them, because they are already embedded:
   - Jitendex https://jitendex.org/
   - KANJIDIC from https://github.com/yomidevs/jmdict-yomitan
2. Download: https://raw.githubusercontent.com/SoundOfTheSky/yomitan-sky/refs/heads/main/sky.zip
3. Import in Yomitan
   1. Dictionaries
   2. Configure installed and enabled dictionaries…
   3. Import
4. Update in yomitan (every few months)
   1. Check for Updates
   2. Yellow marker next to "Sky"

## Dictionaries used
These are dictionaries that are embedded. Before installing you must delete them.

- Jitendex https://jitendex.org/
- KANJIDIC from https://github.com/yomidevs/jmdict-yomitan

## Build/Contribute
1. Create `.env` file
2. Add `WK=YOUR_WK_TOKEN`
3. Add `DOWNLOAD=true` to download all data from scratch
4. `bun i` or `npm i` to install dependencies
5. Run `bun start`