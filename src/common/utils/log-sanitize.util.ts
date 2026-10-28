// Removes control and Unicode line-separator characters from request-derived
// values to prevent log injection and forged log lines.
export function sanitizeLogValue(value: string): string {
  let result = '';
  for (const char of value) {
    if (!isUnsafeInLog(char.codePointAt(0) ?? 0)) {
      result += char;
    }
  }
  return result;
}

// U+0085 (NEL, in C1) and U+2028/U+2029 are read as line breaks by some log
// viewers, just like CR/LF.
function isUnsafeInLog(code: number): boolean {
  return (
    code <= 0x1f ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0x2028 ||
    code === 0x2029
  );
}
