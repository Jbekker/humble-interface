import { configureStore } from "@reduxjs/toolkit";
import themeReducer, { ThemeState } from "./themeSlice";
import tokenReducer, { TokensState } from "./tokenSlice";
import collectionReducer, { CollectionsState } from "./collectionSlice";
import saleReducer, { SalesState } from "./saleSlice";
import dexReducer, { DexState } from "./dexSlice";
import poolReducer, { PoolState } from "./poolSlice";

const store = configureStore({
  reducer: {
    theme: themeReducer,
    pools: poolReducer,
    tokens: tokenReducer,
    //
    collections: collectionReducer,
    sales: saleReducer,
    dex: dexReducer,
  },
});

export type RootState = {
  theme: ThemeState;
  pools: PoolState;
  tokens: TokensState;
  //
  collections: CollectionsState;
  sales: SalesState;
  dex: DexState;
};

export default store;
