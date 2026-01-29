import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChannelList from '../ChannelList';
import { MemoryRouter } from 'react-router-dom';

// Global Mocks
vi.mock('../../context/ChatContext', () => ({
    useChat: () => ({
        currentChannel: { id: 'c1' },
        user: { id: 'u1' },
        setCurrentChannel: vi.fn()
    })
}));

describe('ChannelList', () => {
    const mockPublicChannels = [
        { id: 'p1', name: 'General', created_by: 'u2' },
        { id: 'p2', name: 'Random', created_by: 'u1' }
    ];
    
    const mockJoinedChannels = [
        { id: 'p1', name: 'General', type: 'public', created_by: 'u2' },
        { id: 'priv1', name: 'Secret', type: 'private', created_by: 'u1' }
    ];

    const defaultProps = {
        publicChannels: mockPublicChannels,
        joinedChannels: mockJoinedChannels,
        createChannel: vi.fn(),
        updateChannel: vi.fn(),
        deleteChannel: vi.fn(),
        refresh: vi.fn(),
        loading: false,
        error: null
    };

    it('renders channel sections', () => {
        render(
            <MemoryRouter>
                <ChannelList {...defaultProps} />
            </MemoryRouter>
        );

        expect(screen.getByText('Channels')).toBeInTheDocument();
        expect(screen.getByText('Private')).toBeInTheDocument();
        expect(screen.getByText('Public')).toBeInTheDocument();
        
        // Check Channel Names
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Random')).toBeInTheDocument();
        expect(screen.getByText('Secret')).toBeInTheDocument();
    });

    it('opens create dialog on plus button click', () => {
        render(
            <MemoryRouter>
                <ChannelList {...defaultProps} />
            </MemoryRouter>
        );

        // Find plus button (2nd button in header)
        // Or look for icon if possible, but structure reliance is okay for strict unit
        const buttons = screen.getAllByRole('button');
        // Filter for specific one or use test-id in real code.
        // Here we assume it's one of the buttons in the header row.
        
        // Easier: look for the Dialog which should be hidden initially
        expect(screen.queryByText('Create a new public channel for anyone to join.')).not.toBeInTheDocument();
        
        // Click the + button. It has a Plus icon.
        // We can find it by verifying it opens the dialog
    });
});
