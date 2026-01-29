import { useState, useEffect, useRef, useCallback } from 'react';
import usePubNub from './usePubNub';
import { useChat } from '../context/ChatContext';
import useNotification from './useNotification';

/**
 * Hook to manage message fetching, subscription, and publishing for a channel.
 * 
 * @param {Object} user - The current authenticated user.
 * @returns {Object} Message state and methods.
 * @returns {Array<Object>} messages - The list of messages for the current channel.
 * @returns {Function} sendMessage - Function to publish a new text message.
 * @returns {string} channel - The ID of the currently active channel.
 */
// Helper to parse actions
const parseActions = (msg) => {
    // msg.actions is object like { "reaction": { "heart": [{uuid, actionTimetoken}, ...] } }
    // We want to flatten it to a simple array or object for UI
    // Structure: actions: { "reaction": { "❤️": [ {uuid, actionTimetoken} ] } }
    return msg.actions || {};
};

const useMessages = (user) => {
    const pubnub = usePubNub();
    const { showError, currentChannel } = useChat();
    const { permission, requestPermission, showNotification } = useNotification();
    const [startTimetoken, setStartTimetoken] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    
    const [messages, setMessages] = useState([]);
    
    const CHANNEL = currentChannel?.id || 'demo-channel-v2';
    const messagesRef = useRef([]);

    useEffect(() => {
        setMessages([]);
        messagesRef.current = [];
        setStartTimetoken(null);
        setHasMore(true);
    }, [CHANNEL]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            try {
                const response = await pubnub.fetchMessages({
                    channels: [CHANNEL],
                    count: 20,
                    includeMessageActions: true,
                    includeMeta: true
                });

                if (response.channels[CHANNEL]) {
                   const history = response.channels[CHANNEL].map(msg => {
                       let payload = msg.message;
                       let file = null;

                       if (msg.message.file && msg.message.message) {
                           file = msg.message.file;
                           payload = msg.message.message;
                       }
                       else if (msg.message.file) {
                            file = msg.message.file;
                       }

                       return {
                           id: msg.timetoken,
                           payload: payload,
                           file: file, 
                           timetoken: msg.timetoken,
                           publisher: msg.uuid || msg.producer,
                           status: 'sent',
                           actions: parseActions(msg) // Parse actions
                       };
                   });
                   
                   setMessages(history);
                   
                   if (history.length > 0) setStartTimetoken(history[0].timetoken);
                   if (history.length < 20) setHasMore(false);
                } else {
                    setHasMore(false);
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            }
        };

        fetchHistory();

        const listener = {
            message: (event) => {
                const msg = event.message;

                // Notification Logic: If document is hidden (user tabbed away), show notification
                if (document.hidden && event.publisher !== user.id) {
                     const senderName = msg.sender?.name || "Someone";
                     const bodyText = msg.text || "Sent a file";
                     showNotification(`New message from ${senderName}`, {
                        body: bodyText,
                        icon: msg.sender?.avatar || '/vite.svg'
                     });
                }

                const fileData = event.file || event.message?.file;
                const clientMessageId = event.message?.clientMessageId;

                const newMessage = {
                    id: event.timetoken,
                    payload: event.message,
                    file: fileData, 
                    timetoken: event.timetoken,
                    publisher: event.publisher,
                    status: 'sent',
                    clientMessageId: clientMessageId,
                    actions: {} // Init actions
                };

                setMessages(prev => {
                    if (clientMessageId) {
                        const existingIdx = prev.findIndex(m => m.clientMessageId === clientMessageId);
                        if (existingIdx !== -1) {
                            const updated = [...prev];
                            updated[existingIdx] = newMessage;
                            return updated.sort((a, b) => a.timetoken - b.timetoken);
                        }
                    }
                    
                    // Deduping
                    if (prev.find(m => m.timetoken === event.timetoken)) return prev;
                    
                    return [...prev, newMessage].sort((a, b) => a.timetoken - b.timetoken);
                });
            },
            // Handle Reactions
            messageAction: (event) => {
                const { event: actionEvent, data } = event;
                const { messageTimetoken, actionTimetoken, type, value, uuid } = data;
                
                // 'added' or 'removed'
                setMessages(prev => {
                    return prev.map(msg => {
                        if (msg.timetoken === messageTimetoken) {
                            const newActions = { ...msg.actions };
                            if (!newActions[type]) newActions[type] = {};
                            if (!newActions[type][value]) newActions[type][value] = [];

                            const actionList = newActions[type][value];

                            if (actionEvent === 'added') {
                                // Prevent duplicates
                                if (!actionList.find(a => a.actionTimetoken === actionTimetoken)) {
                                     actionList.push({ uuid, actionTimetoken });
                                }
                            } else if (actionEvent === 'removed') {
                                newActions[type][value] = actionList.filter(a => a.actionTimetoken !== actionTimetoken);
                            }
                            
                            return { ...msg, actions: newActions };
                        }
                        return msg;
                    });
                });
            },
            
            // Handle Read Receipts (Signals)
            signal: (event) => {
                if (event.channel === CHANNEL && event.message.type === 'read_receipt') {
                    const { userId, timetoken } = event.message;
                    setReadReceipts(prev => ({
                        ...prev,
                        [userId]: timetoken
                    }));
                }
            }
        };

        pubnub.addListener(listener);
        
        pubnub.subscribe({ 
            channels: [CHANNEL],
            withPresence: true 
        });

        // Request permission if not granted yet
        if (permission === 'default') {
             requestPermission();
        }

        return () => {
            pubnub.removeListener(listener);
            pubnub.unsubscribe({ channels: [CHANNEL] });
        };
    }, [pubnub, CHANNEL, permission, requestPermission, showNotification, user.id]);

    const fetchMore = useCallback(async () => {
        if (!startTimetoken || !hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const response = await pubnub.fetchMessages({
                channels: [CHANNEL],
                count: 20,
                start: startTimetoken,
                includeMessageActions: true, // IMPORTANT
                includeMeta: true
            });

            if (response.channels[CHANNEL] && response.channels[CHANNEL].length > 0) {
                const olderMessages = response.channels[CHANNEL].map(msg => {
                       let payload = msg.message;
                       let file = null;
                       if (msg.message.file && msg.message.message) {
                           file = msg.message.file; payload = msg.message.message;
                       } else if (msg.message.file) { file = msg.message.file; }

                       return {
                           id: msg.timetoken,
                           payload: payload,
                           file: file, 
                           timetoken: msg.timetoken,
                           publisher: msg.uuid || msg.producer,
                           status: 'sent',
                           actions: parseActions(msg)
                       };
                });
                
                setMessages(prev => [...olderMessages, ...prev]);
                setStartTimetoken(olderMessages[0].timetoken);
                if (olderMessages.length < 20) setHasMore(false);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to fetch more:", error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [pubnub, CHANNEL, startTimetoken, hasMore, isLoadingMore]);

    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || !user) return;
        const clientMessageId = crypto.randomUUID();
        const now = new Date();
        const messagePayload = {
            text,
            sender: { id: user.id, name: user.name, avatar: user.avatar, color: user.color },
            type: 'text',
            createdAt: now.toISOString(),
            clientMessageId
        };

        const optimisticMessage = {
            id: clientMessageId,
            clientMessageId,
            payload: messagePayload,
            publisher: user.id,
            timetoken: now.getTime() * 10000,
            status: 'sending',
            actions: {}
        };
        
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            await pubnub.publish({ channel: CHANNEL, message: messagePayload });
        } catch (error) {
             console.error("Failed to publish:", error);
             showError(`Failed: ${error.message}`);
             setMessages(prev => prev.map(m => m.clientMessageId === clientMessageId ? { ...m, status: 'error' } : m));
        }
    }, [user, pubnub, showError, CHANNEL]);

    // NEW: Add Reaction
    const addReaction = useCallback(async (messageTimetoken, emoji) => {
        try {
            await pubnub.addMessageAction({
                channel: CHANNEL,
                messageTimetoken: messageTimetoken,
                action: {
                    type: 'reaction',
                    value: emoji
                }
            });
        } catch (e) {
            console.error("Failed to add reaction:", e);
        }
    }, [pubnub, CHANNEL]);

    // NEW: Remove Reaction
    const removeReaction = useCallback(async (messageTimetoken, actionTimetoken) => {
        try {
            await pubnub.removeMessageAction({
                channel: CHANNEL,
                messageTimetoken: messageTimetoken,
                actionTimetoken: actionTimetoken
            });
        } catch (e) {
            console.error("Failed to remove reaction:", e);
        }
    }, [pubnub, CHANNEL]);

    return { 
        messages, 
        sendMessage, 
        channel: CHANNEL,
        fetchMore,
        hasMore,
        isLoadingMore,
        addReaction,    // Exposed
        removeReaction  // Exposed
    };
};

export default useMessages;
