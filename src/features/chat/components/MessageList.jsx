import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import usePubNub from '../hooks/usePubNub';
import { Button } from "@/components/ui/button";
import MessageInput from './MessageInput'; // Ensure if used here or parent
import { useChat } from '../context/ChatContext';
import UserProfileDialog from './UserProfileDialog';
import { Virtuoso } from 'react-virtuoso';
import { useNavigate } from 'react-router-dom';
import useChannels from '../hooks/useChannels';

const MessageBubble = React.memo(({ message, isOwn, channel, onUserClick }) => {
    const pubnub = usePubNub();
    const isSending = message.status === 'sending';
    const isError = message.status === 'error';
    
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
            } else {
                 // console.warn("getFileUrl returned empty:", result, "for", fileObj);
            }
        } catch (e) {
            console.error("Error generating file URL", e);
        }
    }

    return (
        <div 
            className={cn(
                "flex gap-3 max-w-[80%] py-1", // Reduced vertical padding for tighter list
                isOwn ? "self-end flex-row-reverse" : "self-start",
                isSending && "opacity-70"
            )}
        >
            {!isOwn && (
                <Avatar 
                    className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity mt-1"
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
                        <img 
                            src={fileUrl} 
                            alt="attachment" 
                            className="block max-w-[250px] max-h-[250px] object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                            style={{ minWidth: '100px', minHeight: '100px' }} 
                            onClick={() => window.open(fileUrl, '_blank')}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                     </div>
                )}

                {hasText && (
                    <div 
                        className={cn(
                            "p-3 rounded-2xl text-sm leading-relaxed shadow-sm relative",
                            isOwn 
                                ? "bg-primary text-primary-foreground rounded-br-none" 
                                : "bg-muted text-foreground border border-border rounded-bl-none",
                             isError && "bg-destructive text-destructive-foreground"
                        )}
                    >
                        {payload.text}
                        {isError && (
                            <span className="absolute -bottom-5 right-0 text-[10px] text-destructive font-bold flex items-center gap-1">
                                Failed to send
                            </span>
                        )}
                    </div>
                )}
                
                <span className="text-[10px] text-muted-foreground opacity-70 mt-1 px-1 flex items-center gap-1">
                    {formatTime(payload.createdAt || message.timetoken / 10000)}
                    {isSending && <span className="italic">(Sending...)</span>}
                </span>
            </div>
        </div>
    );
});

const MessageList = ({ messages, currentUser, channel, fetchMore, hasMore, isLoadingMore }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const { getDmChannelId, joinedChannels } = useChannels();
    const navigate = useNavigate();
    const virtuosoRef = useRef(null);
    const [atBottom, setAtBottom] = useState(true);

    const handleDmStart = async () => {
        if (!selectedUser) return;
        
        try {
            const existingDm = joinedChannels.find(c => c.type === 'dm' && c.otherUserId === selectedUser.id);
            if (existingDm) {
                navigate(`/dm/${existingDm.id}`);
            } else {
                const newChannel = await getDmChannelId(selectedUser.id);
                navigate(`/dm/${newChannel.id}`);
            }
            setSelectedUser(null);
        } catch (error) {
            console.error("Failed to start DM:", error);
        }
    };

    // Auto-scroll logic handled natively by Virtuoso via 'followOutput' or 'initialTopMostItemIndex'
    
    return (
        <div className="h-full flex-1 flex flex-col relative">
            {messages.length === 0 && !isLoadingMore ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <div className="bg-muted/50 p-6 rounded-full mb-4">
                        <span className="text-4xl">👋</span>
                    </div>
                    <p className="font-medium">No messages yet.</p>
                    <p className="text-sm opacity-70">Start the conversation!</p>
                </div>
            ) : (
                <Virtuoso
                    ref={virtuosoRef}
                    style={{ height: '100%', width: '100%' }}
                    data={messages}
                    // Start at bottom
                    initialTopMostItemIndex={messages.length - 1}
                    alignToBottom={true}
                    followOutput={'auto'} // Smart auto-scroll if user is at bottom
                    
                    // Header for "Load More"
                    components={{
                        Header: () => (
                            <div className="py-4 flex justify-center w-full">
                                {hasMore ? (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={fetchMore} 
                                        disabled={isLoadingMore}
                                        className="text-xs text-muted-foreground"
                                    >
                                        {isLoadingMore ? "Loading..." : "Load Previous Messages"}
                                    </Button>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground opacity-50">Start of history</span>
                                )}
                            </div>
                        )
                    }}
                    
                    itemContent={(index, msg) => {
                         const isOwn = msg.publisher === currentUser?.id || msg.payload?.sender?.id === currentUser?.id;
                         return (
                            <div className="px-4">
                                <MessageBubble 
                                    message={msg} 
                                    isOwn={isOwn}
                                    channel={channel}
                                    onUserClick={setSelectedUser}
                                />
                            </div>
                         );
                    }}
                    
                    atBottomStateChange={(bottom) => {
                        setAtBottom(bottom);
                    }}
                />
            )}

            {/* Scroll to Bottom Button (Optional UX) */}
            {!atBottom && messages.length > 0 && (
                <div className="absolute bottom-4 right-4 z-10 animate-in fade-in zoom-in duration-200">
                    <Button 
                        size="sm" 
                        className="rounded-full shadow-lg h-8 w-8 p-0" 
                        onClick={() => virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' })}
                    >
                        ↓
                    </Button>
                </div>
            )}

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
