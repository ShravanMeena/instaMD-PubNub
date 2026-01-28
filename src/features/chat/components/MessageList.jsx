import React, { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import usePubNub from '../hooks/usePubNub';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';
import useChannels from '../hooks/useChannels';
import { useChat } from '../context/ChatContext';
import UserProfileDialog from './UserProfileDialog';

const MessageBubble = React.memo(({ message, isOwn, channel, onUserClick }) => {
    const pubnub = usePubNub();
    
    // Helper to format time
    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const payload = message.payload || {};
    const sender = payload.sender || {};
    const hasText = !!payload.text;
    const hasFile = !!message.file;

    // Use URL from file object if available, otherwise generate it
    let fileUrl = message.file?.url || null;
    
    if (hasFile && !fileUrl) {
        try {
            const fileObj = {
                channel: channel,
                id: message.file?.id,
                name: message.file?.name
            };
            const result = pubnub.getFileUrl(fileObj);
            if (result && result.url) {
                fileUrl = result.url;
                // console.log("Generated URL:", fileUrl);
            } else {
                 console.warn("getFileUrl returned empty:", result, "for", fileObj);
            }
        } catch (e) {
            console.error("Error generating file URL", e);
        }
    }
    
    // Debug output if it has a file but no URL
    if (hasFile && !fileUrl) {
        console.log("Has File but no URL:", message.file);
    }

    return (
        <div 
            className={cn(
                "flex gap-3 max-w-[80%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                isOwn ? "self-end flex-row-reverse" : "self-start"
            )}
        >
            {!isOwn && (
                <Avatar 
                    className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onUserClick(sender)}
                >
                    <AvatarImage src={sender?.avatar} />
                    <AvatarFallback>{sender?.name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
            )}
            
            <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
                {!isOwn && (
                    <span 
                        className="text-xs font-medium text-muted-foreground mb-1 ml-1 cursor-pointer hover:underline" 
                        style={{ color: sender?.color }}
                        onClick={() => onUserClick(sender)}
                    >
                        {sender?.name}
                    </span>
                )}
                
                {hasFile && fileUrl && (
                     <div className={cn(
                        "rounded-xl overflow-hidden mb-1 border border-border bg-muted/30 relative",
                        isOwn ? "rounded-br-none" : "rounded-bl-none"
                    )}>
                        {/* Debug: Print text if image fails or is hidden */}
                        {/* <div className="text-[10px] truncate max-w-[200px] text-muted-foreground p-1">{fileUrl}</div> */}
                        
                        <img 
                            src={fileUrl} 
                            alt="attachment" 
                            className="block max-w-[250px] max-h-[250px] object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                            style={{ minWidth: '100px', minHeight: '100px' }} // Force dimensions to test visibility
                            onClick={() => window.open(fileUrl, '_blank')}
                            onError={(e) => {
                                console.error("Image failed to load:", fileUrl);
                                e.target.style.display = 'none';
                            }}
                        />
                     </div>
                )}

                {hasText && (
                    <div 
                        className={cn(
                            "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                            isOwn 
                                ? "bg-primary text-primary-foreground rounded-br-none" 
                                : "bg-muted text-foreground border border-border rounded-bl-none"
                        )}
                    >
                        {payload.text}
                    </div>
                )}
                
                <span className="text-[10px] text-muted-foreground opacity-70 mt-1 px-1">
                    {formatTime(payload.createdAt || message.timetoken / 10000)} {/* Fallback for time */}
                </span>
            </div>
        </div>
    );
});

const MessageList = ({ messages, currentUser, channel }) => {
    const bottomRef = useRef(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const { getDmChannelId, joinedChannels } = useChannels();
    const { setCurrentChannel } = useChat();

    // Auto-scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleDmStart = async () => {
        if (!selectedUser) return;
        
        try {
            // Check if DM exists locally first
            const existingDm = joinedChannels.find(c => c.type === 'dm' && c.otherUserId === selectedUser.id);
            
            if (existingDm) {
                // If it exists, just switch to it. No refresh needed.
                setCurrentChannel(existingDm);
            } else {
                // If it doesn't exist, create/fetch it.
                // getDmChannelId now handles the optimistic UI update, 
                // so we don't need to manually refresh the whole list.
                const newChannel = await getDmChannelId(selectedUser.id);
                setCurrentChannel(newChannel);
            }
            setSelectedUser(null);
        } catch (error) {
            console.error("Failed to start DM:", error);
        }
    };

    return (
        <div className="h-full flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <div className="bg-muted/50 p-6 rounded-full mb-4">
                        <span className="text-4xl">👋</span>
                    </div>
                    <p className="font-medium">No messages yet.</p>
                    <p className="text-sm opacity-70">Start the conversation!</p>
                </div>
            )}
            
            {messages.map((msg) => {
                 // Check if it's our own message based on pubnub UUID match
                 const isOwn = msg.publisher === currentUser?.id || msg.payload?.sender?.id === currentUser?.id;
                 return (
                    <MessageBubble 
                        key={msg.id} 
                        message={msg} 
                        isOwn={isOwn}
                        channel={channel}
                        onUserClick={setSelectedUser}
                    />
                 );
            })}
            <div ref={bottomRef} />

            {/* User Profile Dialog */}
            <UserProfileDialog 
                user={selectedUser}
                isOpen={!!selectedUser}
                onClose={(open) => !open && setSelectedUser(null)}
                onMessageClick={handleDmStart}
            />
        </div>
    );
};

export default MessageList;
