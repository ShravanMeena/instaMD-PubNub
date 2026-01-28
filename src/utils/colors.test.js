import { describe, it, expect } from 'vitest';
import { getRandomColor, getAvatarUrl } from './colors';

describe('colors utils', () => {
    it('should return a valid random color', () => {
        const color = getRandomColor();
        expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('should generate a valid avatar URL', () => {
        const seed = 'test-user';
        const url = getAvatarUrl(seed);
        expect(url).toContain('https://api.dicebear.com/7.x/avataaars/svg');
        expect(url).toContain('seed=test-user');
    });
});
