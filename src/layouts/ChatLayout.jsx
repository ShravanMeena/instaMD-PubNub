import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '@/features/chat/components/Sidebar';
import MessageList from '@/features/chat/components/MessageList'; 
import MessageInput from '@/features/chat/components/MessageInput'; 
import { useChat } from '@/features/chat/context/ChatContext';
import useMessages from '@/features/chat/hooks/useMessages';
import usePresence from '@/features/chat/hooks/usePresence';
import useChannels from '@/features/chat/hooks/useChannels';
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChatLayout = () => {
    const { user, pubnub, setCurrentChannel, currentChannel } = useChat();
    
    // Navigation & URL Logic
    const { channelId, type } = useParams(); // URL params: /channel/:channelId
    const navigate = useNavigate();

    // Hoisted State: Layout manages the data now
    const channelsData = useChannels();
    const { joinedChannels, loading: channelsLoading } = channelsData;

    // Sync URL with Context
    useEffect(() => {
        if (!channelsLoading && channelId && joinedChannels.length > 0) {
            const selected = joinedChannels.find(c => c.id === channelId);
            // Only update if different to prevent loops
            if (selected && selected.id !== currentChannel?.id) {
                setCurrentChannel(selected);
            } else if (!selected) {
                 // Handle 404 - Channel not found or not joined
                 // For now, perhaps redirect to home or show error?
                 // console.warn("Channel from URL not found in joined list.");
            }
        }
    }, [channelId, joinedChannels, channelsLoading, setCurrentChannel, currentChannel]);

    // Messages & Presence
    const { messages, sendMessage, channel } = useMessages(user);
    const { onlineUsers, typingUsers, sendTypingSignal } = usePresence(user);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                            <h2 className="text-sm font-bold text-foreground">
                                {currentChannel ? (currentChannel.isDm ? currentChannel.name : `#${currentChannel.name}`) : 'Select a Channel'}
                            </h2>
                            <span className="text-xs text-muted-foreground animate-pulse">
                                {typingUsers.length > 0 
                                    ? <span className="text-primary font-medium">Someone is typing...</span>
                                    : `${onlineUsers.length} Online`}
                            </span>
                        </div>
                    </div>
                </header>

                {!currentChannel ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Menu className="h-8 w-8 opacity-50" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Channel Selected</h3>
                        <p>Choose a channel from the sidebar to start chatting.</p>
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
