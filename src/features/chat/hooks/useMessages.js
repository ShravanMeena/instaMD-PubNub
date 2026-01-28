import { useState, useEffect, useRef, useCallback } from 'react';
import usePubNub from './usePubNub';
import { useChat } from '../context/ChatContext';

/**
 * Hook to manage message fetching, subscription, and publishing for a channel.
 * 
 * @param {Object} user - The current authenticated user.
 * @returns {Object} Message state and methods.
 * @returns {Array<Object>} messages - The list of messages for the current channel.
 * @returns {Function} sendMessage - Function to publish a new text message.
 * @returns {string} channel - The ID of the currently active channel.
 */
const useMessages = (user) => {
    const pubnub = usePubNub();
    const { showError, currentChannel } = useChat(); // Access currentChannel
    // State for pagination
    const [startTimetoken, setStartTimetoken] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    
    const [messages, setMessages] = useState([]);
    
    // Identifier for the channel to subscribe to
    const CHANNEL = currentChannel?.id || 'demo-channel-v2';
    
    // Use a ref to keep track of messages for the listener closure
    const messagesRef = useRef([]);

    // Clear messages when channel changes
    useEffect(() => {
        setMessages([]);
        messagesRef.current = [];
        setStartTimetoken(null);
        setHasMore(true);
    }, [CHANNEL]);

    // Sync ref with state
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        if (!user) return;

        // 1. Fetch History
        const fetchHistory = async () => {
            try {
                const response = await pubnub.fetchMessages({
                    channels: [CHANNEL],
                    count: 20,
                    includeMessageActions: true,
                    includeMeta: true
                });

                if (response.channels[CHANNEL]) {
                   // Standardize message format
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
                           publisher: msg.uuid || msg.producer
                       };
                   });
                   
                   setMessages(history);
                   
                   // Update pagination cursor
                   if (history.length > 0) {
                       setStartTimetoken(history[0].timetoken);
                   }
                   
                   // If we got fewer than requested, we reached the beginning
                   if (history.length < 20) {
                       setHasMore(false);
                   }
                } else {
                    // No messages returned
                    setHasMore(false);
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            }
        };

        fetchHistory();

        // 2. Subscribe & Listen
        const listener = {
            message: (event) => {
                // ... (listener code unchanged logic, but keeping consistant)
                console.log("Raw PubNub Message Event:", event);
                
                const fileData = event.file || event.message?.file;
                
                const newMessage = {
                    id: event.timetoken,
                    payload: event.message,
                    file: fileData, 
                    timetoken: event.timetoken,
                    publisher: event.publisher
                };

                setMessages(prev => [...prev, newMessage]);
            },
            file: (event) => {
                const newMessage = {
                    id: event.timetoken,
                    payload: event.message, 
                    file: event.file,       
                    timetoken: event.timetoken,
                    publisher: event.publisher
                };

                setMessages(prev => [...prev, newMessage]);
            },
        };

        pubnub.addListener(listener);
        
        pubnub.subscribe({ 
            channels: [CHANNEL],
            withPresence: true 
        });

        const statusListener = {
            status: (statusEvent) => {
                if (statusEvent.category === "PNConnectedCategory") {
                    console.log("Connected to PubNub!");
                }
            }
        };
        pubnub.addListener(statusListener);

        return () => {
            pubnub.unsubscribe({ channels: [CHANNEL] });
            pubnub.removeListener(listener);
            pubnub.removeListener(statusListener);
        };
    }, [user, pubnub, CHANNEL]);

    // Pagination Function
    const fetchMore = useCallback(async () => {
        if (!startTimetoken || !hasMore || isLoadingMore) return;
        
        setIsLoadingMore(true);
        try {
            const response = await pubnub.fetchMessages({
                channels: [CHANNEL],
                count: 20,
                start: startTimetoken, // Fetch older than this
                includeMessageActions: true,
                includeMeta: true
            });

            if (response.channels[CHANNEL] && response.channels[CHANNEL].length > 0) {
                const olderMessages = response.channels[CHANNEL].map(msg => {
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
                           publisher: msg.uuid || msg.producer
                       };
                });
                
                setMessages(prev => [...olderMessages, ...prev]);
                setStartTimetoken(olderMessages[0].timetoken);
                
                if (olderMessages.length < 20) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to fetch more history:", error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [pubnub, CHANNEL, startTimetoken, hasMore, isLoadingMore]);

    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || !user) return;

        const messagePayload = {
            text,
            sender: {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                color: user.color
            },
            type: 'text',
            createdAt: new Date().toISOString()
        };

        try {
            await pubnub.publish({
                channel: CHANNEL,
                message: messagePayload,
            });
        } catch (error) {
             console.error("Failed to publish:", error);
             // Error handling logic
             showError(`Failed: ${error.message}`);
        }
    }, [user, pubnub, showError, CHANNEL]);

    return { 
        messages, 
        sendMessage, 
        channel: CHANNEL,
        fetchMore,
        hasMore,
        isLoadingMore
    };
};

export default useMessages;
