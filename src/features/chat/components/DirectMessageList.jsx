import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

const DirectMessageList = ({ onOpenNewDm, joinedChannels, deleteChannel }) => {
    const { setCurrentChannel, currentChannel } = useChat();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [channelToDelete, setChannelToDelete] = useState(null);

    // Filter only DM channels
    const dmChannels = (joinedChannels || []).filter(c => c.type === 'dm');

    const handleDeleteClick = (e, channel) => {
        e.stopPropagation();
        setChannelToDelete(channel);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (channelToDelete) {
            deleteChannel(channelToDelete.id);
            setChannelToDelete(null);
        }
    };

    return (
        <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between px-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Direct Messages</span>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={onOpenNewDm}>
                    <Plus className="h-3 w-3" />
                </Button>
            </div>

            <div className="space-y-1">
                {dmChannels.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-4 px-2 text-center">
                        <p className="text-xs text-muted-foreground mb-2 italic">No active conversations.</p>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs h-8" 
                            onClick={onOpenNewDm}
                        >
                            <Plus className="h-3 w-3 mr-1.5" />
                            Start Chat
                        </Button>
                    </div>
                )}
                
                {dmChannels.map(channel => (
                    <div key={channel.id} className="group relative">
                        <button
                            onClick={() => setCurrentChannel(channel)}
                            className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-colors pr-8 ${
                                currentChannel?.id === channel.id 
                                    ? 'bg-primary/10' 
                                    : 'hover:bg-muted/50'
                            }`}
                        >
                            <div className="relative">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={channel.avatar} />
                                    <AvatarFallback>{channel.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                                </Avatar>
                            </div>
                            
                            <div className="flex-1 text-left overflow-hidden">
                                <div className={`text-sm truncate ${currentChannel?.id === channel.id ? 'font-semibold text-primary' : 'font-medium text-foreground'}`}>
                                    {channel.name}
                                </div>
                            </div>
                        </button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDeleteClick(e, channel)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
            </div>

            <ConfirmDialog 
                isOpen={confirmOpen}
                onClose={setConfirmOpen}
                onConfirm={handleConfirmDelete}
                title="Remove Chat"
                description={`Are you sure you want to remove the chat with ${channelToDelete?.name}?`}
                confirmText="Remove"
                variant="destructive"
            />
        </div>
    );
};

export default DirectMessageList;
