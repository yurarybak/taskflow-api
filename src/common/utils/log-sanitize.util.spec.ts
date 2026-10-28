import { sanitizeLogValue } from './log-sanitize.util';

describe('sanitizeLogValue', () => {
  it('strips CR and LF so a value cannot forge a new log line', () => {
    const crlf = String.fromCharCode(13, 10);

    expect(sanitizeLogValue(`GET /x${crlf}FAKE admin login`)).toBe(
      'GET /xFAKE admin login',
    );
  });

  it('strips NUL, other C0 controls and DEL', () => {
    const controls =
      String.fromCharCode(0) +
      String.fromCharCode(9) +
      String.fromCharCode(127);

    expect(sanitizeLogValue(`a${controls}b`)).toBe('ab');
  });

  // Some log viewers treat NEL and the Unicode separators as line breaks.
  it('strips C1 controls and the Unicode line/paragraph separators', () => {
    const breaks =
      String.fromCharCode(0x85) +
      String.fromCharCode(0x9b) +
      String.fromCharCode(0x2028) +
      String.fromCharCode(0x2029);

    expect(sanitizeLogValue(`a${breaks}b`)).toBe('ab');
  });

  it('keeps Cyrillic and other non-control characters', () => {
    expect(sanitizeLogValue('Задача №5 — «Реліз» ґ є ї')).toBe(
      'Задача №5 — «Реліз» ґ є ї',
    );
  });

  it('leaves normal text unchanged', () => {
    expect(sanitizeLogValue('/test?ids=1,5')).toBe('/test?ids=1,5');
  });
});
