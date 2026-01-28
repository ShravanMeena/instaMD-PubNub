import { useRef, useEffect } from 'react';
import pubnub from '@/lib/pubnub';

/**
 * Custom hook to access the PubNub instance and ensure it's configured.
 * @returns {Object} The PubNub instance
 */
const usePubNub = () => {
  const pubnubRef = useRef(pubnub);

  useEffect(() => {
    // strict mode safety: ensure we don't re-initialize aggressively
    // In this singleton pattern, it's already safe.
  }, []);

  return pubnubRef.current;
};

export default usePubNub;
