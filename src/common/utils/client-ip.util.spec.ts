import { Request } from 'express';
import { resolveClientIp } from './client-ip.util';

describe('resolveClientIp', () => {
  const request = (
    headers: Record<string, string | string[]> = {},
    ip: string | undefined = '10.0.0.1',
  ): Request =>
    ({
      headers,
      ip,
      socket: { remoteAddress: '10.0.0.2' },
    }) as unknown as Request;

  it('prefers Incap-Client-IP over X-Forwarded-For', () => {
    expect(
      resolveClientIp(
        request({
          'incap-client-ip': '185.42.130.93',
          'x-forwarded-for': '203.0.113.9',
        }),
      ),
    ).toBe('185.42.130.93');
  });

  it('takes the left-most X-Forwarded-For entry and strips its port', () => {
    expect(
      resolveClientIp(
        request({ 'x-forwarded-for': ' 203.0.113.9:16108 , 10.0.0.1' }),
      ),
    ).toBe('203.0.113.9');
  });

  it('strips brackets and port from an IPv6 address', () => {
    expect(
      resolveClientIp(request({ 'x-forwarded-for': '[2001:db8::1]:443' })),
    ).toBe('2001:db8::1');
  });

  it('keeps a bare IPv6 address intact', () => {
    expect(resolveClientIp(request({}, '2001:db8::1'))).toBe('2001:db8::1');
  });

  it('normalizes an IPv4-mapped IPv6 address', () => {
    expect(resolveClientIp(request({}, '::ffff:169.254.131.1'))).toBe(
      '169.254.131.1',
    );
  });

  it('uses the first value when a header is repeated', () => {
    expect(
      resolveClientIp(request({ 'incap-client-ip': ['1.2.3.4', '5.6.7.8'] })),
    ).toBe('1.2.3.4');
  });

  it('falls back to the socket address when req.ip is missing', () => {
    const withoutIp = {
      headers: {},
      socket: { remoteAddress: '10.0.0.2' },
    } as unknown as Request;

    expect(resolveClientIp(withoutIp)).toBe('10.0.0.2');
  });
});
