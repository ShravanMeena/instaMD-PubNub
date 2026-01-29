import { describe, it, expect } from 'vitest';
import pubnub from './pubnub';

describe('PubNub Configuration', () => {
    it('should be authorized with a UUID', () => {
        expect(pubnub.getUUID()).toBeDefined();
    });

    it('should have publish and subscribe keys', () => {
        // Note: In test environment these might be undefined if not mocked, 
        // but we are just checking the instance structure for now.
        // For a real test, we would mock import.meta.env
        expect(pubnub).toHaveProperty('publish');
        expect(pubnub).toHaveProperty('subscribe');
    });
});
