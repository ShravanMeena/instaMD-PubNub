import PubNub from 'pubnub';
import { v4 as uuidv4 } from 'uuid';

const getPersistedUserId = () => {
  try {
    const key = 'pubnub_chat_uuid';
    let id = localStorage.getItem(key);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(key, id);
    }
    return id;
  } catch (e) {
    // Fallback for non-browser environments (e.g., tests)
    return uuidv4();
  }
};

const pubnub = new PubNub({
  publishKey: import.meta.env.VITE_PUBNUB_PUBLISH_KEY,
  subscribeKey: import.meta.env.VITE_PUBNUB_SUBSCRIBE_KEY,
  // secretKey removed: PAM is disabled
  userId: getPersistedUserId(),
});

export default pubnub;
