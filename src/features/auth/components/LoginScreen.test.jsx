import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginScreen from './LoginScreen';


// Mock the context
// Mock the context
vi.mock('../../chat/context/ChatContext', async () => {
    const actual = await vi.importActual('../../chat/context/ChatContext');
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
        expect(screen.getByText(/Enter your details to join/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/user@example.com/i)).toBeInTheDocument();
    });

    it('allows typing email and password', () => {
        render(<LoginScreen />);
        
        const emailInput = screen.getByPlaceholderText(/user@example.com/i);
        fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
        expect(emailInput.value).toBe('test@test.com');

        const passwordInput = screen.getByPlaceholderText(/••••••••/i);
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        expect(passwordInput.value).toBe('password123');
    });
});
