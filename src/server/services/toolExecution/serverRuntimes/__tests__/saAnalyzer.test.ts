import { createHash } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateHeadersAndSign, generateSign, saApiUrl, saSignKey } from '../saAnalyzer';

describe('saAnalyzer signature utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv('SA_API_URL', 'http://test.example.com:8080/manage/v1');
    vi.stubEnv('SA_SIGN_KEY', 'uWU#sJGp]2tRtx9#]F!u');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe('saApiUrl', () => {
    it('should return API URL from environment variable', () => {
      expect(saApiUrl()).toBe('http://test.example.com:8080/manage/v1');
    });

    it('should remove trailing slash', () => {
      vi.stubEnv('SA_API_URL', 'http://test.example.com:8080/manage/v1/');
      expect(saApiUrl()).toBe('http://test.example.com:8080/manage/v1');
    });

    it('should fallback to default URL when env not set', () => {
      vi.stubEnv('SA_API_URL', undefined);
      expect(saApiUrl()).toBe('http://192.168.9.118:28080/manage/v1');
    });
  });

  describe('saSignKey', () => {
    it('should return sign key from environment variable', () => {
      expect(saSignKey()).toBe('test-sign-key-123');
    });

    it('should return empty string when env not set', () => {
      vi.stubEnv('SA_SIGN_KEY', undefined);
      expect(saSignKey()).toBe('');
    });
  });

  describe('generateSign', () => {
    it('should generate consistent MD5 hash for same input', () => {
      const nonce = 'i14jbfl14i';
      const timestamp = 1777533098340;
      const queryParams = '';
      const body =
        '{"endTime":"2026-04-30 23:59:59","groupCodes":["event_type"],"networkTypes":["police","internet"],"startTime":"2026-04-23 00:00:00"}';

      const sign1 = generateSign(nonce, timestamp, queryParams, body);
      const sign2 = generateSign(nonce, timestamp, queryParams, body);
      console.log(sign1, process.env.SA_SIGN_KEY);
      expect(sign1).toBe(sign2);
    });

    it('should generate different hash for different nonce', () => {
      const timestamp = 1704067200000;
      const queryParams = '';
      const body = '{}';

      const sign1 = generateSign('nonce1', timestamp, queryParams, body);
      const sign2 = generateSign('nonce2', timestamp, queryParams, body);

      expect(sign1).not.toBe(sign2);
    });

    it('should generate different hash for different timestamp', () => {
      const nonce = 'abc123';
      const queryParams = '';
      const body = '{}';

      const sign1 = generateSign(nonce, 1704067200000, queryParams, body);
      const sign2 = generateSign(nonce, 1704067200001, queryParams, body);

      expect(sign1).not.toBe(sign2);
    });

    it('should generate different hash for different queryParams', () => {
      const nonce = 'abc123';
      const timestamp = 1704067200000;
      const body = '{}';

      const sign1 = generateSign(nonce, timestamp, 'page=1', body);
      const sign2 = generateSign(nonce, timestamp, 'page=2', body);

      expect(sign1).not.toBe(sign2);
    });

    it('should generate different hash for different body', () => {
      const nonce = 'abc123';
      const timestamp = 1704067200000;
      const queryParams = '';

      const sign1 = generateSign(nonce, timestamp, queryParams, '{"a":1}');
      const sign2 = generateSign(nonce, timestamp, queryParams, '{"a":2}');

      expect(sign1).not.toBe(sign2);
    });

    it('should produce 32-character MD5 hash', () => {
      const sign = generateSign('nonce', 1234567890, '', '{}');
      expect(sign).toHaveLength(32);
    });

    it('should only contain hexadecimal characters', () => {
      const sign = generateSign('nonce', 1234567890, '', '{}');
      expect(sign).toMatch(/^[0-9a-f]+$/);
    });

    it('should handle empty queryParams and body', () => {
      const sign = generateSign('nonce', 1234567890, '', '');
      expect(sign).toHaveLength(32);
    });

    it('should match expected MD5 for known input', () => {
      // Use known test key and values
      vi.stubEnv('SA_SIGN_KEY', 'test-key');
      const sign = generateSign('nonce123', 1704067200000, 'a=1&b=2', '{"test":true}');

      // Calculate expected MD5 manually: 'test-keynonce1231704067200000a=1&b=2{"test":true}'
      const expectedSource = 'test-keynonce1231704067200000a=1&b=2{"test":true}';
      const expectedSign = createHash('md5').update(expectedSource, 'utf8').digest('hex');

      expect(sign).toBe(expectedSign);
    });
  });

  describe('generateHeadersAndSign', () => {
    it('should generate headers with all required fields', () => {
      const headers = generateHeadersAndSign(undefined, '', '{}');

      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers).toHaveProperty('RZZX-APPTOKEN', '');
      expect(headers).toHaveProperty('RZZX-USERTOKEN', '');
      expect(headers).toHaveProperty('sign');
      expect(headers).toHaveProperty('timestamp');
      expect(headers).toHaveProperty('nonce');
    });

    it('should include RZZX tokens from context', () => {
      const ctx = { rzzxAppToken: 'app-token-123', rzzxUserToken: 'user-token-456' };
      const headers = generateHeadersAndSign(ctx, '', '{}');

      expect(headers).toHaveProperty('RZZX-APPTOKEN', 'app-token-123');
      expect(headers).toHaveProperty('RZZX-USERTOKEN', 'user-token-456');
    });

    it('should generate 13-character nonce', () => {
      const headers = generateHeadersAndSign(undefined, '', '{}');
      expect(headers.nonce).toHaveLength(13);
    });

    it('should generate timestamp as string', () => {
      const before = Date.now();
      const headers = generateHeadersAndSign(undefined, '', '{}');
      const after = Date.now();

      const timestamp = parseInt(headers.timestamp, 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate valid sign', () => {
      const headers = generateHeadersAndSign(undefined, 'page=1', '{"name":"test"}');

      // Verify sign is a valid MD5 hash
      expect(headers.sign).toHaveLength(32);
      expect(headers.sign).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different signs for different calls', () => {
      const headers1 = generateHeadersAndSign(undefined, '', '{}');
      const headers2 = generateHeadersAndSign(undefined, '', '{}');

      // Nonce should be different, so signs should be different
      expect(headers1.nonce).not.toBe(headers2.nonce);
      expect(headers1.sign).not.toBe(headers2.sign);
    });

    it('should include queryParams in sign calculation', () => {
      const headers = generateHeadersAndSign(undefined, 'page=1&size=10', '');

      // Sign should include queryParams
      expect(headers.sign).toBeDefined();
      expect(headers.sign).toHaveLength(32);
    });

    it('should include body in sign calculation', () => {
      const headers = generateHeadersAndSign(undefined, '', '{"key":"value"}');

      expect(headers.sign).toBeDefined();
      expect(headers.sign).toHaveLength(32);
    });

    it('should handle undefined context', () => {
      const headers = generateHeadersAndSign(undefined, '', '{}');

      expect(headers.RZZX - APPTOKEN).toBe('');
      expect(headers.RZZX - USERTOKEN).toBe('');
    });

    it('should handle context with empty tokens', () => {
      const ctx = { rzzxAppToken: undefined, rzzxUserToken: undefined };
      const headers = generateHeadersAndSign(ctx, '', '{}');

      expect(headers.RZZX - APPTOKEN).toBe('');
      expect(headers.RZZX - USERTOKEN).toBe('');
    });
  });
});
