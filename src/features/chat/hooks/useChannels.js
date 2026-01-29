import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import logger from '@/utils/logger';

const useChannels = () => {
    const { user } = useAuth();
    const [publicChannels, setPublicChannels] = useState([]);
    const [joinedChannels, setJoinedChannels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchChannels = useCallback(async () => {
        setError(null);
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // 1. Fetch all public channels
            const { data: publicData, error: publicError } = await supabase
                .from('channels')
                .select('*')
                .eq('type', 'public')
                .order('created_at', { ascending: false });

            if (publicError) throw publicError;
            
            setPublicChannels(publicData || []);
            
            // 2. Fetch channels I have joined
            const { data: myData, error: myError } = await supabase
                .from('channel_members')
                .select(`
                    channel_id,
                    channels (
                        id,
                        name,
                        type,
                        description,
                        created_by
                    )
                `)
                .eq('user_id', user.id);

            if (myError) throw myError;
            
            const joined = myData.map(item => item.channels).filter(Boolean);
            const dmChannelIds = joined.filter(c => c.type === 'dm').map(c => c.id);
            
            let dmsWithMetadata = [];

            if (dmChannelIds.length > 0) {
                 const { data: membersData, error: membersError } = await supabase
                    .from('channel_members')
                    .select('channel_id, profiles(id, username, avatar_url)')
                    .in('channel_id', dmChannelIds)
                    .neq('user_id', user.id); // Get the OTHER person
                 
                 // Map back to channel objects
                 dmsWithMetadata = joined
                    .filter(c => c.type === 'dm')
                    .map(dm => {
                         const otherMember = membersData?.find(m => m.channel_id === dm.id)?.profiles;
                         // If we can't find the other member (e.g. broken channel from earlier errors), skip it
                         if (!otherMember) return null;

                         return {
                             ...dm,
                             // Map DB columns to UI expected props
                             name: otherMember.username || 'User', 
                             avatar: otherMember.avatar_url,
                             otherUserId: otherMember.id,
                             isDm: true
                         };
                    })
                    .filter(Boolean); // Remove nulls (broken DMs)
            }

            const publicJoined = joined.filter(c => c.type === 'public');

            setJoinedChannels([...publicJoined, ...dmsWithMetadata]);

        } catch (error) {
            logger.error("Error fetching channels:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);

    const createChannel = async (name, description = '', isPrivate = false) => {
        // 1. Insert channel
        const { data, error } = await supabase
            .from('channels')
            .insert({
                name,
                description,
                type: isPrivate ? 'private' : 'public',
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        // 2. Auto-join creator
        if (data) {
             await supabase
            .from('channel_members')
            .insert({
                channel_id: data.id,
                user_id: user.id
            });
            
            // Add to joined list immediately
            setJoinedChannels(prev => [...prev, data]);
            
            // Only add to public list if public
            if (!isPrivate) {
                setPublicChannels(prev => [data, ...prev]);
            }
        }
        
        return data;
    };

    const getDmChannelId = async (otherUserId) => {
        // Use the RPC to safely get or create the channel (prevents duplicates)
        const { data: channelId, error } = await supabase
            .rpc('get_or_create_dm_channel', { other_user_id: otherUserId });

        if (error) throw error;

        // Fetch the OTHER user's profile to construct the channel object locally
        const { data: otherUserProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single();

        // We need the full channel object to return
        // Since RPC only returned ID, let's fetch basic info or construct it
        // (It's always type: dm, name: dm)
        const channelObject = {
            id: channelId,
            name: otherUserProfile?.username || otherUserProfile?.name || 'User',
            avatar: otherUserProfile?.avatar_url || otherUserProfile?.avatar,
            type: 'dm',
            otherUserId: otherUserId,
            isDm: true,
            created_by: user.id // Approximate, might be old channel
        };
        
        // Optimistically add to joined channels if not already there
        setJoinedChannels(prev => {
            if (prev.find(c => c.id === channelId)) return prev;
            return [...prev, channelObject];
        });
        
        return channelObject;
    };

    const joinChannel = async (channelId) => {
        try {
            const { error } = await supabase
                .from('channel_members')
                .insert({
                    channel_id: channelId,
                    user_id: user.id
                });

            if (error) {
                // Ignore unique violation if already joined (Postgres 23505 or HTTP 409)
                if (error.code === '23505' || error.status === 409 || error.message?.includes('violates unique constraint')) {
                    // Already joined, proceed gracefully
                } else {
                    throw error;
                }
            }
            
            // Optimistic update? Better to refresh or fetch specific channel
            // For now, let's just fetch the channel details to add to joined list
            const { data: channelData } = await supabase
                .from('channels')
                .select('*')
                .eq('id', channelId)
                .single();
                
            if (channelData) {
                 setJoinedChannels(prev => {
                     if (prev.find(c => c.id === channelId)) return prev;
                     return [...prev, channelData];
                 });
            }
            
            return true;
        } catch (error) {
            logger.error("Error joining channel:", error);
            return false;
        }
    };

    const updateChannel = async (channelId, newName) => {
         const { data, error } = await supabase
            .from('channels')
            .update({ name: newName })
            .eq('id', channelId)
            .select()
            .single();

        if (error) throw error;
        
        // Update local state
        setPublicChannels(prev => prev.map(c => c.id === channelId ? data : c));
        return data;
    };

    const deleteChannel = async (channelId) => {
        const { error } = await supabase
            .from('channels')
            .delete()
            .eq('id', channelId);
            
        if (error) throw error;
        
        // Remove from local state immediately for responsiveness
        setPublicChannels(prev => prev.filter(c => c.id !== channelId));
        setJoinedChannels(prev => prev.filter(c => c.id !== channelId));
        return true;
    };

    return {
        publicChannels,
        joinedChannels,
        loading,
        createChannel,
        updateChannel, 
        deleteChannel,
        getDmChannelId,
        joinChannel,
        refresh: fetchChannels,
        error
    };
};

export default useChannels;
