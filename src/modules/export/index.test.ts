import { describe, it, expect } from 'vitest';
import { sanitizeFilename, generateExportFilename } from './index';

describe('export utils', () => {
  describe('sanitizeFilename', () => {
    it('returns empty string for empty input', () => {
      expect(sanitizeFilename('')).toBe('');
      expect(sanitizeFilename(null as unknown as string)).toBe('');
      expect(sanitizeFilename(undefined as unknown as string)).toBe('');
    });

    it('replaces spaces with hyphens', () => {
      expect(sanitizeFilename('hello world')).toBe('hello-world');
      // Multiple spaces collapse to single hyphens (regex \s+ behavior)
      expect(sanitizeFilename('  multiple   spaces  ')).toBe(
        '-multiple-spaces-',
      );
    });

    it('removes illegal file characters', () => {
      expect(sanitizeFilename('file<name>')).toBe('filename');
      expect(sanitizeFilename('path/to/file')).toBe('pathtofile');
      expect(sanitizeFilename('file:name')).toBe('filename');
      expect(sanitizeFilename('file*name')).toBe('filename');
      expect(sanitizeFilename('file?name')).toBe('filename');
      expect(sanitizeFilename('file|name')).toBe('filename');
      expect(sanitizeFilename('file"name')).toBe('filename');
      expect(sanitizeFilename('file\\name')).toBe('filename');
    });

    it('handles Chinese characters', () => {
      expect(sanitizeFilename('新品推荐')).toBe('新品推荐');
      expect(sanitizeFilename('新产品 上市')).toBe('新产品-上市');
    });

    it('truncates to 100 characters', () => {
      const long = 'a'.repeat(150);
      expect(sanitizeFilename(long).length).toBe(100);
    });
  });

  describe('generateExportFilename', () => {
    it('generates correct format with template name', () => {
      const result = generateExportFilename('新品推荐', 1080, 1920, 1, 'png');
      expect(result).toMatch(/^新品推荐_1080x1920_1x_\d{8}_\d{6}\.png$/);
    });

    it('generates correct format with project name', () => {
      const result = generateExportFilename(
        'my project',
        1080,
        1440,
        2,
        'jpeg',
      );
      expect(result).toMatch(/^my-project_1080x1440_2x_\d{8}_\d{6}\.jpg$/);
    });

    it('uses untitled when name is null', () => {
      const result = generateExportFilename(null, 1080, 1080, 1, 'png');
      expect(result).toMatch(/^untitled_1080x1080_1x_\d{8}_\d{6}\.png$/);
    });

    it('uses untitled when name is empty string', () => {
      const result = generateExportFilename('', 1080, 1080, 1, 'png');
      expect(result).toMatch(/^untitled_1080x1080_1x_\d{8}_\d{6}\.png$/);
    });

    it('uses jpg extension for jpeg format', () => {
      const result = generateExportFilename('test', 1080, 1920, 1, 'jpeg');
      expect(result).toEndWith('.jpg');
      expect(result).not.toEndWith('.jpeg');
    });

    it('uses png extension for png format', () => {
      const result = generateExportFilename('test', 1080, 1920, 1, 'png');
      expect(result).toEndWith('.png');
    });

    it('sanitizes template name with spaces and illegal chars', () => {
      // Remove <>, then replace space with -
      const result = generateExportFilename(
        'my file<name>',
        1080,
        1920,
        1,
        'png',
      );
      expect(result).toMatch(/^my-filename_1080x1920_1x_\d{8}_\d{6}\.png$/);
    });

    it('timestamp is valid YYYYMMDD_HHmmss format', () => {
      const result = generateExportFilename('test', 1080, 1920, 1, 'png');
      const match = result.match(/_(\d{8})_(\d{6})\.png$/);
      expect(match).not.toBeNull();
      const [, datePart, timePart] = match!;
      expect(datePart).toMatch(/^\d{8}$/);
      expect(timePart).toMatch(/^\d{6}$/);

      // Validate it's a plausible date
      const year = parseInt(datePart.substring(0, 4));
      const month = parseInt(datePart.substring(4, 6));
      const day = parseInt(datePart.substring(6, 8));
      expect(year).toBeGreaterThanOrEqual(2020);
      expect(year).toBeLessThanOrEqual(2100);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });

    it('2x scale appears in filename', () => {
      const result = generateExportFilename('test', 1080, 1920, 2, 'png');
      expect(result).toContain('_2x_');
    });

    it('1x scale appears in filename', () => {
      const result = generateExportFilename('test', 1080, 1920, 1, 'png');
      expect(result).toContain('_1x_');
    });

    it('includes dimensions in filename', () => {
      const result = generateExportFilename('test', 1080, 1440, 1, 'png');
      expect(result).toContain('_1080x1440_');
    });
  });
});

// Custom matcher for toEndWith
expect.extend({
  toEndWith(received: string, end: string) {
    const pass = received.endsWith(end);
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? 'not to' : 'to'} end with ${end}`,
    };
  },
});

// Extend Vitest's expect with custom matcher
declare module 'vitest' {
  interface Assertion {
    toEndWith(end: string): void;
  }
}
