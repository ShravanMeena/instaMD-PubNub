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

const ReactionBar = ({ reactions, onAdd, onRemove, currentUserId }) => {
    // reactions: { "reaction": { "👍": [{uuid, actionTimetoken}, ...] } }
    const reactionMap = reactions?.reaction || {};
    
    return (
        <div className="flex flex-wrap gap-1 mt-1 justify-end">
            {Object.entries(reactionMap).map(([emoji, actions]) => {
                if (!actions || actions.length === 0) return null;
                
                const count = actions.length;
                const hasReacted = actions.some(a => a.uuid === currentUserId);
                const myAction = actions.find(a => a.uuid === currentUserId);

                return (
                    <button
                        key={emoji}
                        onClick={() => hasReacted ? onRemove(myAction.actionTimetoken) : onAdd(emoji)}
                        className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-colors",
                            hasReacted 
                                ? "bg-primary/20 border-primary text-primary" 
                                : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        <span>{emoji}</span>
                        <span className="font-semibold">{count}</span>
                    </button>
                );
            })}
        </div>
    );
};

const EmojiPicker = ({ onSelect }) => {
    const emojis = ["❤️", "😂", "👍", "🔥", "😮", "😢"];
    return (
        <div className="flex gap-1 bg-popover border border-border p-1 rounded-full shadow-lg">
            {emojis.map(emoji => (
                <button 
                    key={emoji} 
                    onClick={() => onSelect(emoji)}
                    className="hover:bg-muted rounded-full p-1 transition-colors text-sm hover:scale-125 duration-200"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

const MessageBubble = React.memo(({ message, isOwn, channel, onUserClick, onAddReaction, onRemoveReaction, currentUserId }) => {
    const pubnub = usePubNub();
    const isSending = message.status === 'sending';
    const isError = message.status === 'error';
    const [showActions, setShowActions] = useState(false);
    
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
            const fileObj = { channel: channel, id: message.file?.id, name: message.file?.name };
            const result = pubnub.getFileUrl(fileObj);
            if (result && result.url) fileUrl = result.url;
        } catch (e) {
            console.error("Error generating file URL", e);
        }
    }

    return (
        <div 
            className={cn(
                "flex gap-3 max-w-[80%] py-1 group relative", 
                isOwn ? "self-end flex-row-reverse" : "self-start",
                isSending && "opacity-70"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
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
                     <div className="relative group/file inline-block mb-1">
                         <div className={cn(
                            "rounded-xl overflow-hidden border border-border bg-muted/30 relative",
                            isOwn ? "rounded-br-none" : "rounded-bl-none"
                        )}>
                            <img 
                                src={fileUrl} 
                                alt="attachment" 
                                className="block max-w-[250px] max-h-[250px] object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                style={{ minWidth: '100px', minHeight: '100px' }} 
                                onClick={() => window.open(fileUrl, '_blank')}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                         </div>
                         {/* Reaction Trigger for File */}
                         {!isSending && !isError && (
                            <div className={cn(
                                "absolute top-2 opacity-0 group-hover/file:opacity-100 transition-opacity duration-200 z-10",
                                isOwn ? "right-full mr-2" : "left-full ml-2"
                            )}>
                                <EmojiPicker onSelect={(emoji) => onAddReaction(message.timetoken, emoji)} />
                            </div>
                         )}
                     </div>
                )}

                {hasText && (
                    <div className="relative group/text inline-block max-w-full">
                        <div 
                            className={cn(
                                "p-3 rounded-2xl text-sm leading-relaxed shadow-sm relative break-words",
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
                        {/* Reaction Trigger for Text */}
                        {!isSending && !isError && (
                            <div className={cn(
                                "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/text:opacity-100 transition-opacity duration-200 z-10",
                                isOwn ? "right-full mr-2" : "left-full ml-2"
                            )}>
                                <EmojiPicker onSelect={(emoji) => onAddReaction(message.timetoken, emoji)} />
                            </div>
                        )}
                    </div>
                )}
                
                
                {/* Reactions Display */}
                {message.actions && (
                    <ReactionBar 
                        reactions={message.actions} 
                        onAdd={(emoji) => onAddReaction(message.timetoken, emoji)}
                        onRemove={(actionTimetoken) => onRemoveReaction(message.timetoken, actionTimetoken)}
                        currentUserId={currentUserId}
                    />
                )}
                
                <div className="flex items-center justify-between mt-1 px-1">
                    <span className="text-[10px] text-muted-foreground opacity-70 flex items-center gap-1">
                        {formatTime(payload.createdAt || message.timetoken / 10000)}
                        {isSending && <span className="italic">(Sending...)</span>}
                    </span>
                    
                    {/* Read Receipts */}
                    {message.readBy && message.readBy.length > 0 && (
                        <div className="flex items-center -space-x-1.5 ml-2">
                            {message.readBy.map(u => (
                                <Avatar key={u.userId} className="h-3.5 w-3.5 ring-1 ring-background">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.userId}`} />
                                    <AvatarFallback className="text-[6px]">{u.userId[0]}</AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

const TypingBubble = () => (
    <div className="flex items-center gap-1 p-2 ml-4">
        <span className="flex gap-1 h-2">
            <span className="animate-bounce h-1.5 w-1.5 bg-gray-400 rounded-full" style={{ animationDelay: '0ms' }}></span>
            <span className="animate-bounce h-1.5 w-1.5 bg-gray-400 rounded-full" style={{ animationDelay: '150ms' }}></span>
            <span className="animate-bounce h-1.5 w-1.5 bg-gray-400 rounded-full" style={{ animationDelay: '300ms' }}></span>
        </span>
    </div>
);

const MessageList = ({ messages, currentUser, channel, fetchMore, hasMore, isLoadingMore, onAddReaction, onRemoveReaction, readReceipts, markAllAsRead, typingUsers }) => {
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

    // Trigger Mark Read when messages load or user is at bottom
    useEffect(() => {
        if (messages.length > 0 && atBottom) {
             const timer = setTimeout(() => {
                 markAllAsRead?.();
             }, 1000); // 1s debounce
             return () => clearTimeout(timer);
        }
    }, [messages, atBottom, markAllAsRead]);

    return (
        <div className="h-full flex-1 flex flex-col relative w-full">
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
                    initialTopMostItemIndex={messages.length - 1}
                    alignToBottom={true}
                    followOutput={'auto'}
                    
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
                        ),
                        Footer: () => (
                            <div className="pb-2">
                                {typingUsers && typingUsers.length > 0 && (
                                    <div className="flex items-center gap-2 px-6 py-1">
                                         <TypingBubble />
                                         <span className="text-xs text-muted-foreground italic">
                                             {typingUsers.join(', ')} is typing...
                                         </span>
                                    </div>
                                )}
                            </div>
                        )
                    }}
                    
                    itemContent={(index, msg) => {
                         // SYSTEM MESSAGE RENDERING
                         if (msg.type === 'system') {
                             return (
                                 <div className="flex justify-center py-2">
                                     <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground">
                                         {msg.text}
                                     </span>
                                 </div>
                             );
                         }

                         const isOwn = msg.publisher === currentUser?.id || msg.payload?.sender?.id === currentUser?.id;
                         
                         // Calculate who has read this message (only show on the exact message they read last)
                         const readBy = Object.entries(readReceipts || {})
                            .filter(([uid, token]) => uid !== currentUser?.id && token === msg.timetoken)
                            .map(([uid]) => ({ userId: uid }));

                         // Also attach readBy to the message object for the Bubble
                         const msgWithReceipts = { ...msg, readBy };

                         return (
                            <div className="px-4 w-full">
                                <MessageBubble 
                                    message={msgWithReceipts} 
                                    isOwn={isOwn}
                                    channel={channel}
                                    onUserClick={setSelectedUser}
                                    onAddReaction={onAddReaction}
                                    onRemoveReaction={onRemoveReaction}
                                    currentUserId={currentUser?.id}
                                />
                            </div>
                         );
                    }}
                    
                    atBottomStateChange={(bottom) => {
                        setAtBottom(bottom);
                    }}
                />
            )}

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
