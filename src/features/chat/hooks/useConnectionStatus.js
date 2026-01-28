import { useState, useEffect } from 'react';
import usePubNub from './usePubNub';

/**
 * Hook to track the global PubNub connection status.
 * Used to display "Offline" or "Reconnecting" UI to the user.
 * 
 * @returns {Object} Connection state
 * @returns {boolean} isConnected - True if connected, False if network is down.
 * @returns {boolean} isReconnecting - True if actively trying to reconnect.
 * @returns {string} statusCategory - The raw PubNub status category string.
 */
const useConnectionStatus = () => {
    const pubnub = usePubNub();
    const [isConnected, setIsConnected] = useState(true);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [statusCategory, setStatusCategory] = useState('PNConnectedCategory');

    useEffect(() => {
        const statusListener = {
            status: (statusEvent) => {
                const category = statusEvent.category;
                setStatusCategory(category);

                if (category === 'PNNetworkDownCategory') {
                    setIsConnected(false);
                    setIsReconnecting(true);
                } else if (category === 'PNReconnectedCategory' || category === 'PNConnectedCategory') {
                    setIsConnected(true);
                    setIsReconnecting(false);
                } else if (category === 'PNNetworkIssuesCategory') {
                    setIsConnected(false);
                    setIsReconnecting(true);
                }
            }
        };

        pubnub.addListener(statusListener);

        return () => {
            pubnub.removeListener(statusListener);
        };
    }, [pubnub]);

    return { isConnected, isReconnecting, statusCategory };
};

export default useConnectionStatus;
