import { toHexPreview } from './hex';

describe('toHexPreview', () => {
  it('returns empty string for empty input', () => {
    expect(toHexPreview('')).toBe('');
  });

  it('converts ASCII characters to uppercase hex pairs', () => {
    expect(toHexPreview('Hi')).toBe('48 69');
  });

  it('encodes spaces', () => {
    expect(toHexPreview('A B')).toBe('41 20 42');
  });

  it('encodes digit characters', () => {
    expect(toHexPreview('42')).toBe('34 32');
  });

  it('encodes multi-byte UTF-8 characters', () => {
    // '©' is U+00A9 → 0xC2 0xA9 in UTF-8
    expect(toHexPreview('©')).toBe('C2 A9');
  });

  it('produces one hex pair per ASCII byte', () => {
    const text = 'Greetings from the red planet';
    const pairs = toHexPreview(text).split(' ');
    expect(pairs).toHaveLength(text.length);
    pairs.forEach((p) => expect(p).toMatch(/^[0-9A-F]{2}$/));
  });
});
