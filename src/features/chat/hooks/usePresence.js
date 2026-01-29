import { useState, useEffect } from 'react';
import usePubNub from './usePubNub';
import logger from '@/utils/logger';

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

        // FIX: Enforce UUID is set to the current user ID before interacting
        // This prevents race conditions where we subscribe with a default/temp UUID
        if (user.id && pubnub.getUUID() !== user.id) {
             logger.log("🔄 Force Switching PubNub UUID to match Auth User:", user.id);
             pubnub.setUUID(user.id);
        }

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
                    logger.log(`🕵️ HereNow (${CHANNEL}):`, occupants.length, "occupants", occupants);
                    const usersMap = {};
                    occupants.forEach(occ => {
                         usersMap[occ.uuid] = {
                             id: occ.uuid,
                             name: occ.state?.name || `User ${occ.uuid.substring(0,4)}`,
                             avatar: occ.state?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${occ.uuid}`,
                             isOnline: true
                         };
                    });
                    logger.log("✅ State Update: Online Users:", Object.keys(usersMap));
                    setOnlineUsers(usersMap);
                }
            } catch (e) {
                logger.error("HereNow Error:", e);
            }
        };

        fetchHereNow();
        const intervalId = setInterval(fetchHereNow, 10000);

        // 3. Set Local State
        const updateState = () => {
           logger.log("📡 Setting My State:", user.name);
           pubnub.setState({
                channels: [CHANNEL],
                state: {
                    name: user.name,
                    avatar: user.avatar,
                    id: user.id
                }
            }).catch(e => logger.error("SetState Error:", e));
        };
        
        updateState();

        // 4. Listeners
        const listener = {
            presence: (event) => {
                const { action, uuid, state } = event;
                if (event.channel !== CHANNEL) return;
                
                logger.log(`🔔 Presence Event: ${action} from ${uuid}`, state);

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
                    logger.log("🔄 Updated Online List:", Object.keys(next));
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
            },
            status: (statusEvent) => {
                // Monitor Connection Status specifically for this channel subscription
                if (statusEvent.category === "PNConnectedCategory") {
                    logger.log(`✅ PubNub Connected to ${CHANNEL}!`);
                    // Retry setState once connected to be sure
                    updateState();
                } else if (statusEvent.category === "PNNetworkDownCategory") {
                    logger.log("❌ PubNub Network Down");
                } else if (statusEvent.category === "PNAccessDeniedCategory") {
                    logger.error("🚫 PubNub Access Denied (Check Keys/PAM):", CHANNEL);
                } else {
                    logger.log("ℹ️ PubNub Status:", statusEvent.category);
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
        
        // logger.log(`📤 Sending typing to ${CHANNEL}`, message);

        pubnub.signal({
            channel: CHANNEL,
            message: message
        }).catch(err => {
            logger.error("Signal failed:", err);
        });
    };

    return { 
        onlineUsers: Object.values(onlineUsers), 
        typingUsers: Object.values(typingUsers), // Return array of Names
        sendTypingSignal 
    };
};

export default usePresence;
