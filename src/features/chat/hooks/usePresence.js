import { useState, useEffect } from 'react';
import usePubNub from './usePubNub';

const CHANNEL = 'demo-channel-v2';

const usePresence = (user) => {
    const pubnub = usePubNub();
    const [onlineUsers, setOnlineUsers] = useState({});
    const [typingUsers, setTypingUsers] = useState({});

    useEffect(() => {
        if (!user) return;

        // 1. Subscribe with Presence
        pubnub.subscribe({
            channels: [CHANNEL],
            withPresence: true,
        });

        // 2. Fetch HereNow (Polled for reliability)
        const fetchHereNow = async () => {
            try {
                // console.log(`Fetching hereNow for ${CHANNEL}...`);
                const response = await pubnub.hereNow({
                    channels: [CHANNEL],
                    includeUUIDs: true,
                    includeState: true
                });
                // console.log("HereNow Response:", response);tringify(response, null, 2));

                if (response.channels[CHANNEL]) {
                    const occupants = response.channels[CHANNEL].occupants;
                    // console.log(`Found ${occupants.length} occupants:`, occupants);
                    
                    const usersMap = {};
                    occupants.forEach(occ => {
                         usersMap[occ.uuid] = {
                             id: occ.uuid,
                             name: occ.state?.name || `User ${occ.uuid.substring(0,4)}`,
                             avatar: occ.state?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${occ.uuid}`,
                             isOnline: true
                         };
                    });
                    setOnlineUsers(usersMap);
                } else {
                    console.warn(`Channel ${CHANNEL} missing in response`, response);
                }
            } catch (e) {
                console.error("HereNow failed FULL ERROR:", e);
            }
        };

        // Initial fetch
        fetchHereNow();
        // Poll every 5 seconds to ensure accuracy (self-healing)
        const intervalId = setInterval(fetchHereNow, 5000);

        // 3. Set Local State (so others see my name/avatar)
        const updateState = () => {
           pubnub.setState({
                channels: [CHANNEL],
                state: {
                    name: user.name,
                    avatar: user.avatar,
                    id: user.id
                }
            }).catch(err => {
                console.error("SetState failed, retrying...", err);
                setTimeout(updateState, 2000); // Retry after 2s
            });
        };
        
        updateState();

        // 4. Listeners
        const listener = {
            presence: (event) => {
                const { action, uuid, state } = event;
                
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
                if (event.channel === CHANNEL && event.message.type === 'typing') {
                    const { userId, isTyping } = event.message;
                    if (userId === user.id) return; // Ignore self

                    setTypingUsers(prev => {
                        if (isTyping) {
                            return { ...prev, [userId]: true };
                        } else {
                            const next = { ...prev };
                            delete next[userId];
                            return next;
                        }
                    });
                }
            }
        };

        pubnub.addListener(listener);

        return () => {
            clearInterval(intervalId); // Stop polling
            pubnub.removeListener(listener);
            pubnub.unsubscribe({ channels: [CHANNEL] });
        };
    }, [user, pubnub]);

    // Send typing signal
    const sendTypingSignal = (isTyping) => {
        if (!user) return;
        
        pubnub.signal({
            channel: CHANNEL,
            message: { 
                type: 'typing', 
                userId: user.id, 
                isTyping 
            }
        }).catch(err => console.error(err));
    };

    return { 
        onlineUsers: Object.values(onlineUsers), 
        typingUsers: Object.keys(typingUsers), 
        sendTypingSignal 
    };
};

export default usePresence;
