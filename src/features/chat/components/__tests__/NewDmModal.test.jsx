import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NewDmModal from '../NewDmModal';

// Mocks
vi.mock('../../hooks/useUsers', () => ({
    default: () => ({
        users: [
            { id: 'u2', name: 'Alice', avatar: 'alice.png' },
            { id: 'u3', name: 'Bob', avatar: 'bob.png' }
        ],
        loading: false
    })
}));

vi.mock('../../context/ChatContext', () => ({
    useChat: () => ({
        user: { id: 'u1' } // Current user
    })
}));

describe('NewDmModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSelectUser: vi.fn()
    };

    it('renders user list', () => {
        render(<NewDmModal {...defaultProps} />);
        
        expect(screen.getByText('New Message')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('filters users by search', () => {
        render(<NewDmModal {...defaultProps} />);
        
        const input = screen.getByPlaceholderText('Search users...');
        fireEvent.change(input, { target: { value: 'Alice' } });
        
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('handles user selection', () => {
        render(<NewDmModal {...defaultProps} />);
        
        const userBtn = screen.getByText('Alice').closest('button');
        fireEvent.click(userBtn);
        
        expect(defaultProps.onSelectUser).toHaveBeenCalledWith('u2');
    });

    it('shows empty state when no users found', () => {
        render(<NewDmModal {...defaultProps} />);
        
        const input = screen.getByPlaceholderText('Search users...');
        fireEvent.change(input, { target: { value: 'Z' } }); // No match
        
        expect(screen.getByText('No users found.')).toBeInTheDocument();
    });
});
