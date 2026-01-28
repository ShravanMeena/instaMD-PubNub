import React, { useState } from 'react';
import { useChat } from '../context/ChatContext'; // To set current channel
import useChannels from '../hooks/useChannels';
import { Button } from "@/components/ui/button";
import { Plus, Hash, Lock, MessageCircle, X, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const ChannelList = ({ publicChannels, createChannel, updateChannel, deleteChannel, loading, error, refresh }) => {
    // const { ... } = useChannels(); // Removed: Uses props now
    const { setCurrentChannel, currentChannel, user } = useChat(); // Need to implement setCurrentChannel in Context
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    
    // Delete State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [channelToDelete, setChannelToDelete] = useState(null);
    
    // Edit State
    const [editingChannel, setEditingChannel] = useState(null);

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        if (!newChannelName.trim()) return;
        
        setIsCreating(true);
        try {
            if (editingChannel) {
                await updateChannel(editingChannel.id, newChannelName);
                // Update current channel name if selected
                if(currentChannel?.id === editingChannel.id) {
                     setCurrentChannel(prev => ({ ...prev, name: newChannelName }));
                }
            } else {
                await createChannel(newChannelName);
            }
            setIsCreateOpen(false);
            setNewChannelName('');
            setEditingChannel(null);
        } catch (err) {
            console.error(err);
        } finally {
            setIsCreating(false);
        }
    };

    const openCreate = () => {
        setEditingChannel(null);
        setNewChannelName('');
        setIsCreateOpen(true);
    };

    const openEdit = (e, channel) => {
        e.stopPropagation();
        setEditingChannel(channel);
        setNewChannelName(channel.name);
        setIsCreateOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channels</span>
                
                <div className="flex items-center gap-1">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4" 
                        onClick={() => refresh()} 
                        title="Refresh Channels"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-cw h-3 w-3"><path d="M21 12a9 9 0 1 1-9-9c5.2 0 9 5.4 9 9Z"/><path d="M21 3v9h-9"/></svg>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-4 w-4" onClick={openCreate}>
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            <div className="space-y-1">

                {loading && (
                    <div className="px-2 py-4 flex justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                )}

                
                {/* DEBUG / ERROR DISPLAY */}
                {error && (
                     <div className="px-2 py-2 text-[10px] text-red-600 bg-red-50 border border-red-200 rounded mx-2 mb-2">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                
                {!loading && publicChannels.length === 0 && (
                    <div className="px-2 py-4 text-center">
                         <div className="text-xs text-muted-foreground italic mb-2">
                            No public channels found.
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-6 text-[10px]"
                            onClick={async () => {
                                alert("Testing connection...");
                                const res = await refresh();
                                alert("Refresh triggered. Check UI.");
                            }}
                        >
                            Test Connection
                        </Button>
                    </div>
                )}
                
                {/* Public Channels List */}
                {publicChannels.map(channel => (
                    <div key={channel.id} className="group flex items-center justify-between w-full pr-2">
                        <button
                            onClick={() => setCurrentChannel(channel)}
                            className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                                currentChannel?.id === channel.id 
                                    ? 'bg-primary/10 text-primary font-medium' 
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                        >
                            <Hash className="h-4 w-4 opacity-70" />
                            <span className="truncate">{channel.name}</span>
                        </button>
                         
                         {/* Only show edit/delete for channel creator */}
                         {user?.id === channel.created_by && (
                             <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 {/* Edit Button */}
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={(e) => openEdit(e, channel)}
                                >
                                    <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                </Button>

                                 {/* Delete Button */}
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setChannelToDelete(channel);
                                        setConfirmOpen(true);
                                    }}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </Button>
                             </div>
                         )}
                    </div>
                ))}
            </div>

            {/* Create/Edit Channel Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingChannel ? 'Edit Channel' : 'Create Channel'}</DialogTitle>
                        <DialogDescription>
                            {editingChannel ? 'Rename this channel.' : 'Create a new public channel for anyone to join.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateOrUpdate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid items-center gap-4">
                                <Label htmlFor="name">Channel Name</Label>
                                <Input
                                    id="name"
                                    value={newChannelName}
                                    onChange={(e) => setNewChannelName(e.target.value)}
                                    placeholder="e.g. general"
                                    className="col-span-3"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={!newChannelName.trim() || isCreating}>
                                {editingChannel ? 'Save Changes' : 'Create Channel'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog 
                isOpen={confirmOpen}
                onClose={setConfirmOpen}
                onConfirm={() => {
                    if (channelToDelete) {
                        deleteChannel(channelToDelete.id);
                        if(currentChannel?.id === channelToDelete.id) setCurrentChannel(null);
                        setChannelToDelete(null);
                    }
                }}
                title="Delete Channel"
                description={`Are you sure you want to delete #${channelToDelete?.name}? This cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
};

export default ChannelList;
