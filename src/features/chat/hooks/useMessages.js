import { useState, useEffect, useRef, useCallback } from 'react';
import usePubNub from './usePubNub';
import { useChat } from '../context/ChatContext';

const useMessages = (user) => {
    const pubnub = usePubNub();
    const { showError, currentChannel } = useChat(); // Access currentChannel
    const [messages, setMessages] = useState([]);
    
    // Identifier for the channel to subscribe to
    const CHANNEL = currentChannel?.id || 'demo-channel-v2';
    
    // Use a ref to keep track of messages for the listener closure
    const messagesRef = useRef([]);

    // Clear messages when channel changes
    useEffect(() => {
        setMessages([]);
        messagesRef.current = [];
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
                    includeMeta: true // files often in meta or message
                });

                if (response.channels[CHANNEL]) {
                   // Standardize message format
                   const history = response.channels[CHANNEL].map(msg => {
                       // Handle different message types from history
                       // Case 1: Standard Text Message
                       let payload = msg.message;
                       let file = null;

                       // Case 2: File Message (nested structure)
                       if (msg.message.file && msg.message.message) {
                           file = msg.message.file;
                           payload = msg.message.message;
                       }
                       // Case 3: Root level file (if any)
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
                }
            } catch (error) {
                console.error("Failed to fetch history:", error);
            }
        };

        fetchHistory();

        // 2. Subscribe & Listen
        const listener = {
            message: (event) => {
                console.log("Raw PubNub Message Event:", event);
                
                // Robust file extraction (just in case)
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
                console.log("Raw PubNub File Event:", event);
                
                const newMessage = {
                    id: event.timetoken,
                    payload: event.message, // The optional message sent with the file
                    file: event.file,       // The file object {id, name, url}
                    timetoken: event.timetoken,
                    publisher: event.publisher
                };

                setMessages(prev => [...prev, newMessage]);
            },
        };

        pubnub.addListener(listener);
        
        // Subscribe with Presence to ensure we don't conflict with usePresence
        pubnub.subscribe({ 
            channels: [CHANNEL],
            withPresence: true 
        });

        // Debug listener for status
        const statusListener = {
            status: (statusEvent) => {
                // console.log("PubNub Status:", statusEvent.category, statusEvent);
                if (statusEvent.category === "PNConnectedCategory") {
                    console.log("Connected to PubNub!"); // Keep this one
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
            console.error("Failed to publish full error:", error);
            console.error("Status Category:", error.status?.category);
            console.error("Error Response:", error.status?.errorData);
            
            const statusCode = error.status?.statusCode || 'N/A';
            const errorMsg = error.status?.errorData?.message || error.message;
            
            showError(`Failed: ${errorMsg} (Status: ${statusCode})\n\nTip: Check if 'Message Persistence' is ENABLED in PubNub Dashboard.`);
        }
    }, [user, pubnub, showError, CHANNEL]);

    return { messages, sendMessage, channel: CHANNEL };
};

export default useMessages;
