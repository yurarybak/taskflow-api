import type { Request } from 'express';

// Header set by the Imperva (Incapsula) WAF with the original client address.
const INCAP_CLIENT_IP_HEADER = 'incap-client-ip';
const FORWARDED_FOR_HEADER = 'x-forwarded-for';
const IPV4_MAPPED_PREFIX = '::ffff:';

/**
 * Best-effort client address for logging: WAF header, then the left-most
 * X-Forwarded-For entry, then the socket address. These headers can be spoofed
 * when the API is reachable without the proxy, so never use the result for auth.
 */
export function resolveClientIp(req: Request): string {
  const incapIp = firstHeaderValue(req.headers[INCAP_CLIENT_IP_HEADER]);
  if (incapIp) {
    return normalizeIp(incapIp);
  }

  const forwardedFor = firstHeaderValue(req.headers[FORWARDED_FOR_HEADER]);
  const originalClient = forwardedFor?.split(',')[0]?.trim();
  if (originalClient) {
    return normalizeIp(originalClient);
  }

  return normalizeIp(req.ip ?? req.socket?.remoteAddress ?? '-');
}

function firstHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeIp(ip: string): string {
  const value = ip.trim();

  // "[2001:db8::1]:443" -> "2001:db8::1"
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(value);
  if (bracketed) {
    return bracketed[1];
  }

  // "203.0.113.9:16108" -> "203.0.113.9"
  const ipv4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(value);
  if (ipv4WithPort) {
    return ipv4WithPort[1];
  }

  // "::ffff:169.254.131.1" -> "169.254.131.1"
  if (value.toLowerCase().startsWith(IPV4_MAPPED_PREFIX)) {
    return value.slice(IPV4_MAPPED_PREFIX.length);
  }

  return value;
}
