import { configureStore } from "@reduxjs/toolkit";
import themeReducer, { ThemeState } from "./themeSlice";
import tokenReducer, { TokensState } from "./tokenSlice";
import collectionReducer, { CollectionsState } from "./collectionSlice";
import saleReducer, { SalesState } from "./saleSlice";
import dexReducer, { DexState } from "./dexSlice";

const store = configureStore({
  reducer: {
    theme: themeReducer,
    tokens: tokenReducer,
    collections: collectionReducer,
    sales: saleReducer,
    dex: dexReducer,
  },
});

export type RootState = {
  tokens: TokensState;
  collections: CollectionsState;
  sales: SalesState;
  theme: ThemeState;
  dex: DexState;
};

export default store;
