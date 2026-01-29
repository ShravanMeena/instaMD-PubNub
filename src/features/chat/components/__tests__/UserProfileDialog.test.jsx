import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserProfileDialog from '../UserProfileDialog';

describe('UserProfileDialog', () => {
    const mockUser = {
        id: 'u1',
        name: 'Test User',
        avatar: 'avatar.png'
    };

    const defaultProps = {
        user: mockUser,
        isOpen: true,
        onClose: vi.fn(),
        onMessageClick: vi.fn()
    };

    it('renders user details', () => {
        render(<UserProfileDialog {...defaultProps} />);
        
        expect(screen.getByText('User Profile')).toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('App User')).toBeInTheDocument();
    });

    it('allows messaging the user', () => {
        render(<UserProfileDialog {...defaultProps} />);
        
        const messageBtn = screen.getByText('Message');
        fireEvent.click(messageBtn);
        
        expect(defaultProps.onMessageClick).toHaveBeenCalled();
    });

    it('renders nothing when closed', () => {
        // Since Dialog uses Radix UI and portal usually, testing 'closed' state 
        // with jsdom depends on if the content is completely unmounted.
        // Radix Dialog unmounts content when closed.
        render(<UserProfileDialog {...defaultProps} isOpen={false} />);
        
        expect(screen.queryByText('User Profile')).not.toBeInTheDocument();
    });
});
