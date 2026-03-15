const PUNCTUATION = new Set([" ", ",", "-", ";", ":", ".", "(", "[", "{", "<", ")", "]", "}", ">"]);

export function isPunctuation(c: string): boolean {
  return PUNCTUATION.has(c);
}

export function isAlphaEtc(c: string): boolean {
  return (c >= "A" && c <= "Z") || (c >= "a" && c <= "z") || c === "-" || c === ".";
}

export function vToUAndJToI(c: string): string {
  switch (c) {
    case "V":
      return "U";
    case "v":
      return "u";
    case "J":
      return "I";
    case "j":
      return "i";
    default:
      return c;
  }
}

export function vToUAndJToIString(s: string): string {
  let result = "";
  for (const c of s) {
    result += vToUAndJToI(c);
  }
  return result;
}
