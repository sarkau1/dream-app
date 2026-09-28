import { describe, expect, it } from 'vitest'
import { installPlatform } from './installApp'

describe('installPlatform', () => {
  it('recognises Android phones', () => {
    expect(
      installPlatform('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36'),
    ).toBe('android')
  })

  it('recognises iPhones', () => {
    expect(
      installPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'),
    ).toBe('ios')
  })

  it('treats everything else as a computer', () => {
    expect(
      installPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36'),
    ).toBe('desktop')
  })
})
