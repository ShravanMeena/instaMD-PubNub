import PubNub from 'pubnub';
import { v4 as uuidv4 } from 'uuid';

const pubnub = new PubNub({
  publishKey: import.meta.env.VITE_PUBNUB_PUBLISH_KEY,
  subscribeKey: import.meta.env.VITE_PUBNUB_SUBSCRIBE_KEY,
  // secretKey removed: PAM is disabled
  userId: uuidv4(), // Initial temporary ID, will be updated on login
});

export default pubnub;
