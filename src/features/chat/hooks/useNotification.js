import { useState, useCallback, useEffect } from 'react';

const useNotification = () => {
    const [permission, setPermission] = useState(Notification.permission);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notification');
            return;
        }
        
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            const newPermission = await Notification.requestPermission();
            setPermission(newPermission);
        }
    }, []);

    const showNotification = useCallback((title, options = {}) => {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            try {
                const n = new Notification(title, options);
                n.onclick = () => {
                    window.focus();
                    n.close();
                };
            } catch (e) {
                console.error("Notification creation failed:", e);
            }
        }
    }, []);

    // Check permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    return { permission, requestPermission, showNotification };
};

export default useNotification;
