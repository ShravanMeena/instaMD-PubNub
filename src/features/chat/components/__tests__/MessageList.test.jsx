import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageList from '../MessageList';

// Mocks
vi.mock('../../hooks/usePubNub', () => ({
    default: () => ({
        getFileUrl: vi.fn(),
    })
}));

vi.mock('../../hooks/useChannels', () => ({
    default: () => ({
        getDmChannelId: vi.fn(),
        joinedChannels: [],
    })
}));

vi.mock('../../context/ChatContext', () => ({
    useChat: () => ({
        setCurrentChannel: vi.fn(),
    })
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

// Mock child components to avoid deep rendering issues
vi.mock('../UserProfileDialog', () => ({
    default: () => <div data-testid="user-profile-dialog" />
}));

describe('MessageList', () => {
    const mockCurrentUser = { id: 'user1', name: 'User 1' };
    const mockChannel = 'channel-1';
    const mockMessages = [
        {
            id: 'msg1',
            publisher: 'user1',
            payload: {
                text: 'Hello World',
                sender: { id: 'user1', name: 'User 1' },
                createdAt: new Date().toISOString()
            }
        },
        {
            id: 'msg2',
            publisher: 'user2',
            payload: {
                text: 'Hi there',
                sender: { id: 'user2', name: 'User 2' },
                createdAt: new Date().toISOString()
            }
        }
    ];

    it('renders empty state when no messages', () => {
        render(
            <MessageList 
                messages={[]} 
                currentUser={mockCurrentUser} 
                channel={mockChannel} 
                hasMore={false} 
                isLoadingMore={false}
                fetchMore={vi.fn()}
            />
        );
        expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
    });

    it('renders messages correctly', () => {
        render(
            <MessageList 
                messages={mockMessages} 
                currentUser={mockCurrentUser} 
                channel={mockChannel} 
                hasMore={false} 
                isLoadingMore={false}
                fetchMore={vi.fn()}
            />
        );
        expect(screen.getByText('Hello World')).toBeInTheDocument();
        expect(screen.getByText('Hi there')).toBeInTheDocument();
    });

    it('renders load more button when hasMore is true', () => {
        const fetchMoreFn = vi.fn();
        render(
            <MessageList 
                messages={mockMessages} 
                currentUser={mockCurrentUser} 
                channel={mockChannel} 
                hasMore={true} 
                isLoadingMore={false}
                fetchMore={fetchMoreFn}
            />
        );
        
        const loadMoreBtn = screen.getByText(/Load Previous Messages/i);
        expect(loadMoreBtn).toBeInTheDocument();
        
        fireEvent.click(loadMoreBtn);
        expect(fetchMoreFn).toHaveBeenCalled();
    });
});
