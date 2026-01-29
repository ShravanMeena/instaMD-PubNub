import { useState, useEffect } from 'react';
import usePubNub from './usePubNub';

const CHANNEL = 'demo-channel-v2';

/**
 * Hook to manage real-time presence and typing indicators.
 * 
 * @param {Object} user - The current authenticated user object.
 * @param {string} user.id - Unique identifier for the user.
 * @param {string} user.name - Display name of the user.
 * @param {string} [currentChannelId] - The ID of the currently active channel.
 * 
 * @returns {Object} Presence state and methods.
 * @returns {Array<Object>} onlineUsers - List of currently online users in the channel.
 * @returns {Array<string>} typingUsers - List of user IDs currently typing.
 * @returns {Function} sendTypingSignal - Function to broadcast typing status (true/false).
 */
const usePresence = (user, currentChannelId) => {
    const pubnub = usePubNub();
    const [onlineUsers, setOnlineUsers] = useState({});
    const [typingUsers, setTypingUsers] = useState({});

    // Use current channel or fallback
    const CHANNEL = currentChannelId || 'demo-channel-v2';

    useEffect(() => {
        if (!user || !currentChannelId) return;

        if (!user || !currentChannelId) return;

        // Ensure we are using the correct UUID for self-identification
        const currentUUID = pubnub.getUUID();

        // 1. Subscribe with Presence
        pubnub.subscribe({
            channels: [CHANNEL],
            withPresence: true,
        });

        // 2. Fetch HereNow (Polled for reliability)
        const fetchHereNow = async () => {
             try {
                const response = await pubnub.hereNow({
                    channels: [CHANNEL],
                    includeUUIDs: true,
                    includeState: true
                });
                
                if (response.channels[CHANNEL]) {
                    const occupants = response.channels[CHANNEL].occupants;
                    const usersMap = {};
                    occupants.forEach(occ => {
                         // Fallback structure if state is missing
                         usersMap[occ.uuid] = {
                             id: occ.uuid,
                             name: occ.state?.name || `User ${occ.uuid.substring(0,4)}`,
                             avatar: occ.state?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${occ.uuid}`,
                             isOnline: true
                         };
                    });
                    setOnlineUsers(usersMap);
                }
            } catch (e) {
                // Silent catch
            }
        };

        fetchHereNow();
        // Poll every 10 seconds
        const intervalId = setInterval(fetchHereNow, 10000);

        // 3. Set Local State
        const updateState = () => {
           pubnub.setState({
                channels: [CHANNEL],
                state: {
                    name: user.name,
                    avatar: user.avatar,
                    id: user.id
                }
            }).catch(() => {});
        };
        
        updateState();

        // 4. Listeners
        const listener = {
            presence: (event) => {
                const { action, uuid, state } = event;
                if (event.channel !== CHANNEL) return;

                setOnlineUsers(prev => {
                    const next = { ...prev };
                    if (action === 'join' || action === 'state-change') {
                        next[uuid] = {
                            id: uuid,
                            name: state?.name || next[uuid]?.name || 'Anonymous',
                            avatar: state?.avatar || next[uuid]?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uuid}`,
                            isOnline: true
                        };
                    } else if (action === 'leave' || action === 'timeout') {
                        delete next[uuid];
                    }
                    return next;
                });
            },
            signal: (event) => {
                if (event.channel === CHANNEL) {
                    const msg = event.message;
                    const userId = msg.userId || msg.uid || msg.id;
                    const userName = msg.userName || msg.name || 'Anonymous'; // Support name
                    const isTyping = msg.isTyping !== undefined ? msg.isTyping : (msg.t === true || msg.t === 1 || msg.it === 1);
                    const isTypingSignal = (msg.type === 'typing' || msg.tp === 't' || msg.t !== undefined);

                    if (isTypingSignal && userId) {
                        if (userId === user.id) return; 
                        setTypingUsers(prev => {
                            if (isTyping) {
                                return { ...prev, [userId]: userName }; // Store Name instead of true
                            } else {
                                const next = { ...prev };
                                delete next[userId];
                                return next;
                            }
                        });
                    }
                }
            }
        };

        pubnub.addListener(listener);

        return () => {
            clearInterval(intervalId);
            pubnub.removeListener(listener);
            pubnub.unsubscribe({ channels: [CHANNEL] });
            setOnlineUsers({});
            setTypingUsers({});
        };
    }, [user, pubnub, CHANNEL, currentChannelId, user?.id]);

    // Send typing signal
    const sendTypingSignal = (isTyping) => {
        if (!user || !currentChannelId) {
             return;
        }
        
        const message = { 
            id: user.id, 
            name: user.name, // Send Name!
            t: isTyping 
        };
        
        // console.log(`📤 Sending typing to ${CHANNEL}`, message);

        pubnub.signal({
            channel: CHANNEL,
            message: message
        }).catch(err => {
            console.error("Signal failed:", err);
        });
    };

    return { 
        onlineUsers: Object.values(onlineUsers), 
        typingUsers: Object.values(typingUsers), // Return array of Names
        sendTypingSignal 
    };
};

export default usePresence;
