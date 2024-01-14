
import {generateCustomUuid} from "custom-uuid";

let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

/**
 * Generates a unique ID for a guest user
 */
function generateGuestName() {
  return "Guest#" + generateCustomUuid(chars, 8);
}

export {generateGuestName};
