import { describe, expect, it } from 'vitest'
import { appendDictation, dictationErrorMessage, mergeTranscripts } from './dictation'

describe('appendDictation', () => {
  it('starts an empty dream with a capital', () => {
    expect(appendDictation('', ' i was flying ')).toBe('I was flying')
  })

  it('continues a sentence with a space and no capital', () => {
    expect(appendDictation('I was flying', 'over the sea')).toBe('I was flying over the sea')
  })

  it('capitalises after the end of a sentence', () => {
    expect(appendDictation('I was flying.', 'then I fell')).toBe('I was flying. Then I fell')
  })

  it('does not double up spaces or newlines', () => {
    expect(appendDictation('First part\n', 'second')).toBe('First part\nsecond')
  })

  it('handles Lithuanian letters', () => {
    expect(appendDictation('', 'šuo bėgo per mišką')).toBe('Šuo bėgo per mišką')
  })

  it('ignores silence and respects the length limit', () => {
    expect(appendDictation('Hi', '   ')).toBe('Hi')
    expect(appendDictation('Hi', 'there friend', 8)).toBe('Hi there')
  })
})

describe('dictationErrorMessage', () => {
  it('stays quiet when the user stopped it', () => {
    expect(dictationErrorMessage('aborted', 'English')).toBeNull()
  })

  it('names the language it could not handle', () => {
    expect(dictationErrorMessage('language-not-supported', 'Lietuvių')).toContain('Lietuvių')
  })
})

describe('mergeTranscripts', () => {
  it('joins separate phrases (desktop Chrome)', () => {
    expect(mergeTranscripts(['i love music', ' and dancing'])).toBe('i love music and dancing')
  })

  it('keeps one copy of a phrase sent again (Chrome on Android)', () => {
    expect(mergeTranscripts(['i love music', 'i love music', 'i love music'])).toBe('i love music')
  })

  it('replaces a phrase with its longer version as it grows', () => {
    expect(mergeTranscripts(['i love', 'i love music'])).toBe('i love music')
  })

  it('replaces everything when a piece repeats the whole session so far', () => {
    expect(mergeTranscripts(['i love music', 'and dancing', 'I love music and dancing a lot'])).toBe(
      'I love music and dancing a lot',
    )
  })

  it('still allows the same word in different phrases', () => {
    expect(mergeTranscripts(['the sea was calm', 'then the sea rose'])).toBe(
      'the sea was calm then the sea rose',
    )
  })

  it('ignores empty pieces', () => {
    expect(mergeTranscripts(['', '  ', 'hello'])).toBe('hello')
  })
})
