import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search } from 'lucide-react';
import useUsers from '../hooks/useUsers';
import { useChat } from '../context/ChatContext';

const NewDmModal = ({ isOpen, onClose, onSelectUser }) => {
    const { users, loading } = useUsers();
    const { user: currentUser } = useChat();
    const [search, setSearch] = useState('');

    const filteredUsers = users.filter(u => {
        // Exclude self
        if (u.id === currentUser?.id) return false;
        // Search filter
        return u.name?.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                
                <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <div className="mt-4 max-h-[300px] overflow-y-auto space-y-1">
                    {loading ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                            {search ? 'No users found.' : 'No other users available.'}
                        </div>
                    ) : (
                        filteredUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => onSelectUser(user.id)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium text-sm">{user.name}</div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NewDmModal;
