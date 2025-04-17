import { extractDomain } from '../../background/util.js';

describe('extractDomain', () => {
  // Test URLs with schemes
  test('extracts domain from http URL', () => {
    expect(extractDomain('http://example.com')).toBe('example.com');
  });

  test('extracts domain from https URL', () => {
    expect(extractDomain('https://example.com')).toBe('example.com');
  });

  test('extracts domain from ftp URL', () => {
    expect(extractDomain('ftp://example.com')).toBe('example.com');
  });

  test('extracts domain from URLs with custom schemes', () => {
    expect(extractDomain('custom-scheme://example.com')).toBe('example.com');
  });

  // Test URLs with www prefix
  test('removes www prefix from domain', () => {
    expect(extractDomain('https://www.example.com')).toBe('example.com');
  });

  test('handles domains with www in the middle', () => {
    expect(extractDomain('https://test.www.example.com')).toBe('test.www.example.com');
  });

  // Test URLs without schemes
  test('handles URLs without scheme by adding http://', () => {
    expect(extractDomain('example.com')).toBe('example.com');
  });

  // Test casing
  test('converts domain to lowercase', () => {
    expect(extractDomain('https://ExAmPlE.CoM')).toBe('example.com');
    expect(extractDomain('ExAmPlE.CoM')).toBe('example.com');
  });

  // Test URLs with paths, query params, etc.
  test('ignores paths in URLs', () => {
    expect(extractDomain('https://example.com/path/to/page')).toBe('example.com');
  });

  test('ignores query parameters in URLs', () => {
    expect(extractDomain('https://example.com?param=value')).toBe('example.com');
  });

  test('ignores hash fragments in URLs', () => {
    expect(extractDomain('https://example.com#section')).toBe('example.com');
  });

  // Test URLs with ports
  test('ignores ports in URLs', () => {
    expect(extractDomain('https://example.com:8080')).toBe('example.com');
  });

  // Test URLs with auth
  test('ignores auth information in URLs', () => {
    expect(extractDomain('https://user:pass@example.com')).toBe('example.com');
  });

  // Test subdomains
  test('preserves subdomains (except www)', () => {
    expect(extractDomain('https://sub.example.com')).toBe('sub.example.com');
    expect(extractDomain('https://sub.sub2.example.com')).toBe('sub.sub2.example.com');
  });

  // Test error cases
  test('returns empty string for invalid URLs', () => {
    expect(extractDomain('not-a-url')).toBe('');
    expect(extractDomain('://invalid-scheme')).toBe('');
    expect(extractDomain('')).toBe('');
    expect(extractDomain(null)).toBe('');
    expect(extractDomain(undefined)).toBe('');
  });

  // Test error handling - spy on console.error
  test('logs error for invalid URLs', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    extractDomain('not-a-url');
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toBe('Invalid URL:');
    consoleSpy.mockRestore();
  });
});