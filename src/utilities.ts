const punctuation = new Set(['.', ':', '!', '?', ';'])
export function removeWholeSentenceWithSubstring(
  text: string,
  substring: string,
  // removed = new Set<string>(),
) {
  while (true) {
    let left = text.indexOf(substring) - 1
    if (left === -2) return text
    let right = left + substring.length
    while (left !== -1 && !punctuation.has(text[left]!)) left--
    while (right !== text.length && !punctuation.has(text[right]!)) right++
    // removed.add(text.slice(left + 1, right + 1))
    text = (text.slice(0, left + 1) + text.slice(right + 1)).trim()
  }
}

export function cleanupHTML(
  text: string,
  whitelist: string[] = [
    'radical',
    'kanji',
    'vocabulary',
    'meaning',
    'reading',
  ],
) {
  text = text
    .replaceAll('<br>', '\n') // br to \n
    .split('\n')
    .map((element) => element.trim()) // trim every line
    .join('\n')
    .replaceAll(/\n{2,}/gs, '\n') // no more than one new line
    .replaceAll(/<(\S+)(>|\s[^>]*>)\s*<\/\1>/g, '') // empty tags
    .trim() // final trim
  return [...text.matchAll(/<.+?>/g)]
    .map(
      (element) =>
        [element[0].slice(1, -1).split(' ')[0], element.index] as const,
    )
    .filter(([t]) => whitelist.every((w) => t !== w && t !== `/${w}`))
    .reverse()
    .reduce(
      (accumulator, [, index]) =>
        accumulator.slice(0, index) +
        accumulator.slice(accumulator.indexOf('>', index) + 1),
      text,
    )
}

export const getDefaultHeaders = () => {
  const headers = new Headers()
  for (const [
    key,
    value,
  ] of `User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:138.0) Gecko/20100101 Firefox/138.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br, zstd
DNT: 1
Sec-GPC: 1
Connection: keep-alive
Upgrade-Insecure-Requests: 1
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: cross-site
Priority: u=0, i`
    .split('\n')
    .map((x) => x.split(': ')) as [string, string][])
    headers.set(key, value)
  return headers
}
