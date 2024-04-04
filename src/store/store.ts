import { configureStore } from "@reduxjs/toolkit";
import themeReducer, { ThemeState } from "./themeSlice";
import tokenReducer, { TokensState } from "./tokenSlice";
import collectionReducer, { CollectionsState } from "./collectionSlice";
import saleReducer, { SalesState } from "./saleSlice";
import dexReducer, { DexState } from "./dexSlice";
import poolReducer, { PoolState } from "./poolSlice";
import farmReducer, { FarmState } from "./farmSlice";
import stakeReducer, { StakeState } from "./stakeSlice";

const store = configureStore({
  reducer: {
    theme: themeReducer,
    pools: poolReducer,
    farms: farmReducer,
    stake: stakeReducer,
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
  farms: FarmState;
  stake: StakeState;
  tokens: TokensState;
  //
  collections: CollectionsState;
  sales: SalesState;
  dex: DexState;
};

export default store;
