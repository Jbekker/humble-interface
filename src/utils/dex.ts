import { TOKEN_VOI, TOKEN_WVOI1 } from "../constants/tokens";
import { ARC200TokenI } from "../types";

export const tokenSymbol = (
  token: ARC200TokenI | undefined,
  excludeWrapped = false
) => {
  const symbol = token?.symbol || "";
  if (symbol.match(/^wVOI/)) {
    if (excludeWrapped) {
      return "VOI";
    }
    return "wVOI";
  } else {
    return symbol;
  }
};

export const tokenId = (token: ARC200TokenI | undefined) => {
  const id = token?.tokenId || 0;
  switch (id) {
    case TOKEN_VOI:
      return TOKEN_WVOI1;
    default:
      return id;
  }
};
