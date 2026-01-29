import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from '../MessageInput';

// Mock EmojiPicker to avoid rendering heavy component
vi.mock('emoji-picker-react', () => ({
    default: () => <div data-testid="emoji-picker" />
}));

describe('MessageInput', () => {
    const mockCurrentUser = { id: 'user1', name: 'User 1' };
    const mockChannel = 'channel-1';
    const mockPubNub = { sendFile: vi.fn() };

    it('renders input field', () => {
        render(
            <MessageInput 
                onSendMessage={vi.fn()} 
                currentUser={mockCurrentUser}
                channel={mockChannel}
                pubnub={mockPubNub}
            />
        );
        expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
    });

    it('updates text on typing', () => {
        render(
            <MessageInput 
                onSendMessage={vi.fn()} 
                currentUser={mockCurrentUser}
                channel={mockChannel}
                pubnub={mockPubNub}
            />
        );
        const input = screen.getByPlaceholderText(/Type a message/i);
        fireEvent.change(input, { target: { value: 'New message' } });
        expect(input.value).toBe('New message');
    });

    it('calls onSendMessage when send button is clicked', () => {
        const onSendMessage = vi.fn();
        render(
            <MessageInput 
                onSendMessage={onSendMessage} 
                currentUser={mockCurrentUser}
                channel={mockChannel}
                pubnub={mockPubNub}
            />
        );
        
        const input = screen.getByPlaceholderText(/Type a message/i);
        fireEvent.change(input, { target: { value: 'Hello' } });
        
        // Find send button (it usually has an icon, but we can search by type submit)
        // Alternatively, since we know the structure, we can look for the button that submits form
        // Find send button by type="submit"
        // Since getByRole doesn't support type attribute directly in all versions, we can use a selector
        // or just getAllByRole and pick the last one (usually send is last)
        const buttons = screen.getAllByRole('button');
        const submitBtn = buttons[buttons.length - 1]; // Send is the last button
        
        fireEvent.click(submitBtn);
        
        expect(onSendMessage).toHaveBeenCalledWith('Hello');
    });

    it('shows emoji picker when emoji button is clicked', () => {
         render(
            <MessageInput 
                onSendMessage={vi.fn()} 
                currentUser={mockCurrentUser}
                channel={mockChannel}
                pubnub={mockPubNub}
            />
        );
        
        // Assumption: The first button is emoji, second is image, third is send (if text)
        // A better way is to rely on accessible names if they existed
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]); // Emoji button
        
        expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
    });
});
