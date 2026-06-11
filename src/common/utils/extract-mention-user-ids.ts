export function extractMentionUserIds(content: string): string[] {
  const matches = content.matchAll(/@\[([a-f0-9-]{36})\]/gi);

  return [...new Set([...matches].map((match) => match[1]))];
}
