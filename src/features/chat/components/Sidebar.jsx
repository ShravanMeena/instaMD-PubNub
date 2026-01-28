import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { X, MessageSquare, LogOut } from "lucide-react"
import ChannelList from './ChannelList';
import DirectMessageList from './DirectMessageList';
import NewDmModal from './NewDmModal';
// import useChannels from '../hooks/useChannels'; // Removed
import { useChat } from '../context/ChatContext';
import { useAuth } from '@/context/AuthContext';

import { useNavigate } from 'react-router-dom';

const Sidebar = ({ currentUser, onClose, channelsData }) => {
    const [isNewDmOpen, setIsNewDmOpen] = useState(false);
    // const channelsData = useChannels(); // Removed: Passed via props
    const { getDmChannelId, joinedChannels } = channelsData;
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleSelectUser = async (userId) => {
        try {
            // Check if we already have a DM with this user
            const existingDm = joinedChannels.find(c => c.type === 'dm' && c.otherUserId === userId);
            
            if (existingDm) {
                navigate(`/dm/${existingDm.id}`);
                setIsNewDmOpen(false);
            } else {
                // Create new one and switch
                const newChannel = await getDmChannelId(userId);
                navigate(`/dm/${newChannel.id}`);
                setIsNewDmOpen(false);
            }
        } catch (error) {
            console.error("Failed to create DM", error);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 bg-card border-r border-border w-[280px]">
            <div className="flex items-center justify-between mb-6 pl-2">
                <div className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <img src="/src/assets/instamd_logo.png" alt="InstaMD" className="h-8 w-auto object-contain" />
                </div>
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex items-center gap-3 p-3 mb-6 bg-muted/50 rounded-lg border border-border">
                <Avatar className="h-10 w-10 border-2" style={{ borderColor: currentUser?.color || 'transparent' }}>
                    <AvatarImage src={currentUser?.avatar} />
                    <AvatarFallback>{currentUser?.name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <div className="text-sm font-semibold truncate max-w-[140px]">{currentUser?.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Online
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Channels */}
                <ChannelList {...channelsData} />

                {/* Direct Messages */}
                <DirectMessageList {...channelsData} onOpenNewDm={() => setIsNewDmOpen(true)} />
            </div>

            <div className="mt-auto pt-4 border-t border-border">
                <Button 
                    variant="ghost" 
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
                    onClick={() => signOut()}
                >
                    <LogOut className="h-4 w-4" />
                    Log Out
                </Button>
            </div>

            <NewDmModal 
                isOpen={isNewDmOpen} 
                onClose={() => setIsNewDmOpen(false)} 
                onSelectUser={handleSelectUser}
            />
        </div>
    );
};

export default Sidebar;
