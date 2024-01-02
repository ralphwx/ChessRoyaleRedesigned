
import {generateCustomUuid} from "custom-uuid";

let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

function generateGuestName() {
  return "Guest#" + generateCustomUuid(chars, 8);
}

export {generateGuestName};
