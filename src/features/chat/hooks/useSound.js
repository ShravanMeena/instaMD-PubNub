import { useCallback } from 'react';

const POP_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const JOIN_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'; // Reusing for now, can be different

const useSound = () => {
    const playPop = useCallback(() => {
        try {
            const audio = new Audio(POP_SOUND);
            audio.volume = 0.5;
            audio.play().catch(e => console.warn("Audio play failed (interaction required first)", e));
        } catch (e) {
            console.error("Audio error", e);
        }
    }, []);

    const playJoin = useCallback(() => {
        try {
            const audio = new Audio(JOIN_SOUND);
            audio.volume = 0.3;
            audio.play().catch(e => console.warn("Audio play failed", e));
        } catch (e) {
            console.error("Audio error", e);
        }
    }, []);

    return { playPop, playJoin };
};

export default useSound;
