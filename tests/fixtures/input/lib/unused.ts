export function usedHelper() {
  return "I am used somewhere";
}

export function unusedHelper() {
  return "Nobody imports me";
}

function internalOnly() {
  return "I am not exported";
}

export const USED_CONSTANT = 42;
export const UNUSED_CONSTANT = "never imported";
