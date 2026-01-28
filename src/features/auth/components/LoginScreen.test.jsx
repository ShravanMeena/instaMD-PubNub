import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginScreen from './LoginScreen';
import { ChatProvider } from '../../context/ChatContext';

// Mock the context
vi.mock('../../context/ChatContext', async () => {
    const actual = await vi.importActual('../../context/ChatContext');
    return {
        ...actual,
        useChat: () => ({
            setUser: vi.fn(),
            pubnub: { setUUID: vi.fn() },
        }),
    };
});

describe('LoginScreen', () => {
    it('renders correctly', () => {
        render(<LoginScreen />);
        expect(screen.getByText(/NeonChat/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Pick a username/i)).toBeInTheDocument();
    });

    it('allows typing a username', () => {
        render(<LoginScreen />);
        const input = screen.getByPlaceholderText(/Pick a username/i);
        fireEvent.change(input, { target: { value: 'TestUser' } });
        expect(input.value).toBe('TestUser');
    });
});
