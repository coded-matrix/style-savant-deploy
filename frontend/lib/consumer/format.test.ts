import { describe, it, expect } from 'vitest';
import { ghs, timeAgo, compactCount } from './format';

describe('ghs', () => {
  it('formats GHS currency with 2 decimal places', () => {
    const result = ghs(250);
    expect(result).toMatch(/250\.00/);
    expect(result).toMatch(/GH/);
  });

  it('formats zero correctly', () => {
    const result = ghs(0);
    expect(result).toMatch(/0\.00/);
  });

  it('formats decimal amounts', () => {
    const result = ghs(99.5);
    expect(result).toMatch(/99\.50/);
  });
});

describe('timeAgo', () => {
  it('returns "Just now" for < 1 hour', () => {
    const recent = new Date(Date.now() - 30 * 60000).toISOString();
    expect(timeAgo(recent)).toBe('Just now');
  });

  it('returns hours for < 1 day', () => {
    const hoursAgo = new Date(Date.now() - 5 * 3600000).toISOString();
    expect(timeAgo(hoursAgo)).toBe('5h ago');
  });

  it('returns days for < 1 week', () => {
    const daysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(timeAgo(daysAgo)).toBe('3d ago');
  });

  it('returns weeks for < 5 weeks', () => {
    const weeksAgo = new Date(Date.now() - 21 * 86400000).toISOString();
    expect(timeAgo(weeksAgo)).toBe('3w ago');
  });

  it('returns month/day for >= 5 weeks', () => {
    const oldDate = new Date(Date.now() - 40 * 86400000).toISOString();
    const result = timeAgo(oldDate);
    // Should be a formatted date like "Jun 1" or "2 Jun" depending on locale
    expect(result).toMatch(/\d+ [A-Z][a-z]+|[A-Z][a-z]+ \d+/);
  });
});

describe('compactCount', () => {
  it('returns plain number for < 1000', () => {
    expect(compactCount(0)).toBe('0');
    expect(compactCount(999)).toBe('999');
    expect(compactCount(1)).toBe('1');
  });

  it('returns K suffix for >= 1000', () => {
    expect(compactCount(1000)).toBe('1K');
    expect(compactCount(1500)).toBe('1.5K');
    expect(compactCount(9999)).toBe('10K');
  });

  it('returns K without decimal for >= 10000', () => {
    expect(compactCount(10000)).toBe('10K');
    expect(compactCount(15000)).toBe('15K');
    expect(compactCount(100000)).toBe('100K');
  });
});
