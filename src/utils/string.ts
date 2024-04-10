export function stringToColorCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const color = Math.floor(
    Math.abs(((Math.sin(hash) * 10000) % 1) * 16777216)
  ).toString(16);

  return "#" + Array(6 - color.length + 1).join("0") + color;
}

/*
 * prepareString
 * - prepare string (strip trailing null bytes)
 * @param str: string to prepare
 * @returns: prepared string
 */
export const prepareString = (str: string) => {
  const index = str.indexOf("\x00");
  if (index > 0) {
    return str.slice(0, str.indexOf("\x00"));
  } else {
    return str;
  }
};
