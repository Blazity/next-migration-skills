import { usedHelper, USED_CONSTANT } from './unused.js';

export function doWork() {
  return usedHelper() + USED_CONSTANT;
}
