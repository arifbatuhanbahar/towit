import { describe, expect, it, vi, beforeEach } from 'vitest';
import { storedUser, searchPlaces } from './api';

function makeToken(payload: Record<string, unknown>) {
  return `x.${btoa(JSON.stringify(payload))}.y`;
}

describe('storedUser', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns decoded user when token is valid', () => {
    localStorage.setItem(
      'towit_access',
      makeToken({
        sub: 'user_1',
        role: 'customer',
        email: 'user@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    );

    expect(storedUser()).toEqual({
      id: 'user_1',
      role: 'customer',
      email: 'user@example.com',
    });
  });

  it('returns null when token is expired', () => {
    localStorage.setItem(
      'towit_access',
      makeToken({
        sub: 'user_1',
        role: 'operator',
        email: 'old@example.com',
        exp: Math.floor(Date.now() / 1000) - 60,
      })
    );

    expect(storedUser()).toBeNull();
  });
});

describe('searchPlaces', () => {
  it('returns empty array for empty query without calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await searchPlaces('   ');

    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
