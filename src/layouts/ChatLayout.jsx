import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '@/features/chat/components/Sidebar';
import MessageList from '@/features/chat/components/MessageList'; 
import MessageInput from '@/features/chat/components/MessageInput'; 
import { useChat } from '@/features/chat/context/ChatContext';
import useMessages from '@/features/chat/hooks/useMessages';
import usePresence from '@/features/chat/hooks/usePresence';
import useChannels from '@/features/chat/hooks/useChannels';
import { Menu, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ChatLayout = () => {
    const { user, pubnub, setCurrentChannel, currentChannel } = useChat();
    
    // Navigation & URL Logic
    const { channelId } = useParams(); // URL params: /channel/:channelId
    const navigate = useNavigate();

    // Hoisted State: Layout manages the data now
    const channelsData = useChannels();
    const { joinedChannels, joinChannel, loading: channelsLoading } = channelsData;

    // Sync URL with Context & Auto-Join
    useEffect(() => {
        const handleChannelSync = async () => {
            if (channelsLoading || !channelId) return;

            const selected = joinedChannels.find(c => c.id === channelId);
            
            if (selected) {
                 // Already joined, set current
                 if (selected.id !== currentChannel?.id) {
                     setCurrentChannel(selected);
                 }
            } else {
                 // Not joined? Try to auto-join (Deep Link Logic)
                 console.log(`Auto-joining channel: ${channelId}`);
                 const success = await joinChannel(channelId);
                 if (!success) {
                     console.error("Failed to auto-join channel from URL.");
                     // Optionally redirect or show error
                 }
                 // If success, joinedChannels will update (via state setter in hook), 
                 // triggering this effect again to set selected.
            }
        };
        
        handleChannelSync();
    }, [channelId, joinedChannels, channelsLoading, setCurrentChannel, currentChannel, joinChannel]);

    // Messages & Presence
    const { messages, sendMessage, channel } = useMessages(user);
    const { onlineUsers, typingUsers, sendTypingSignal } = usePresence(user);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Copy State
    const [copied, setCopied] = useState(false);
    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-screen w-screen flex bg-background overflow-hidden font-sans">
            {/* Sidebar */}
            <aside 
                className={`
                    w-[280px] h-full flex-col border-r bg-card 
                    transition-transform duration-300 ease-in-out z-30 absolute md:relative 
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    flex
                `}
            >
                {/* Pass hoisted data down */}
                <Sidebar 
                    currentUser={user} 
                    channelsData={channelsData}
                    onClose={() => setIsSidebarOpen(false)} 
                />
            </aside>
            
            {/* Main Content */}
            <main className="flex-1 flex flex-col relative w-full h-full bg-background min-w-0">
                {/* Header */}
                <header className="h-16 px-6 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm z-10">
                    <div className="flex items-center">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="mr-4 md:hidden" 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                {currentChannel ? (currentChannel.isDm ? currentChannel.name : `#${currentChannel.name}`) : 'Select a Channel'}
                                {currentChannel?.type === 'private' && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">Private</span>}
                            </h2>
                            <span className="text-xs text-muted-foreground animate-pulse">
                                {typingUsers.length > 0 && <span className="text-primary font-medium">Someone is typing...</span>}
                            </span>
                        </div>
                    </div>
                    
                    {/* Share Button */}
                    {currentChannel && !currentChannel.isDm && (
                        <div className="flex items-center">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={handleCopyLink} className="text-muted-foreground hover:text-primary">
                                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{copied ? 'Copied!' : 'Share Channel Link'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </header>

                {!currentChannel || (channelId && currentChannel.id !== channelId) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        {channelId && currentChannel?.id !== channelId ? (
                             <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p>Loading channel...</p>
                            </div>
                        ) : (
                            <>
                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Menu className="h-8 w-8 opacity-50" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No Channel Selected</h3>
                                <p>Choose a channel from the sidebar to start chatting.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Messages Area */}
                        <div className="flex-1 overflow-hidden relative flex flex-col">
                           <MessageList messages={messages} currentUser={user} channel={channel} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-border bg-card/30 backdrop-blur-sm">
                           <MessageInput 
                               onSendMessage={sendMessage} 
                               onTyping={sendTypingSignal} 
                               pubnub={pubnub}
                               channel={channel}
                               currentUser={user}
                           />
                        </div>
                    </>
                )}
            </main>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 md:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default ChatLayout;
