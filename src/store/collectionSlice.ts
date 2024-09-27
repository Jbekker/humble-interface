// reducers.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import db from "../db";
import { RootState } from "./store";
import { CollectionI, NFTIndexerCollectionI } from "../types";

export interface CollectionsState {
  collections: CollectionI[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export const getCollections = createAsyncThunk<
  CollectionI[],
  void,
  { rejectValue: string; state: RootState }
>("collections/getCollections", async (_, { getState, rejectWithValue }) => {
  try {
    const collectionTable = db.table("collections");
    const collections = await collectionTable.toArray();
    const lastRound =
      collections.length > 0
        ? Math.max(
            ...collections.map(
              (collection: CollectionI) => collection.mintRound
            )
          )
        : 0;
    console.log({ lastRound });
    const response = await axios.get(
      "https://mainnet-idx.voirewards.com/nft-indexer/v1/collections",
      {
        params: {
          "mint-min-round": lastRound,
        },
      }
    );
    const newCollections = response.data.collections.filter(
      (collection: NFTIndexerCollectionI) => collection.mintRound > lastRound
    );
    await db.table("collections").bulkPut(
      newCollections.map((collection: CollectionI) => {
        return {
          pk: `${collection.contractId}`,
          contractId: collection.contractId,
          totalSupply: collection.totalSupply,
          isBlacklisted: collection.isBlacklisted,
          mintRound: collection.mintRound,
        };
      })
    );
    return [...collections, ...newCollections].map(
      (collection: any) => collection
    ) as CollectionI[];
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const initialState: CollectionsState = {
  collections: [],
  status: "idle",
  error: null,
};

const collectionslice = createSlice({
  name: "collections",
  initialState,
  reducers: {
    updateCollection(state, action) {
      const { contractId, newData } = action.payload;
      const collectionToUpdate = state.collections.find(
        (collection) => collection.contractId === contractId
      );
      if (collectionToUpdate) {
        Object.assign(collectionToUpdate, newData);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCollections.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getCollections.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.collections = [...action.payload];
      })
      .addCase(getCollections.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { updateCollection } = collectionslice.actions;
export default collectionslice.reducer;
