// reducers.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import db from "../db";
import { RootState } from "./store";
import { SaleI, NFTIndexerSaleI } from "../types";

export interface SalesState {
  sales: SaleI[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export const getSales = createAsyncThunk<
  SaleI[],
  void,
  { rejectValue: string; state: RootState }
>("sales/getSales", async (_, { getState, rejectWithValue }) => {
  try {
    const saleTable = db.table("sales");
    const sales = await saleTable.toArray();
    const lastRound =
      sales.length > 0
        ? Math.max(...sales.map((sale: SaleI) => sale.round))
        : 0;
    const response = await axios.get(
      "https://mainnet-idx.voirewards.com/nft-indexer/v1/mp/sales",
      {
        params: {
          "min-round": lastRound,
        },
      }
    );
    const newsales = response.data.sales.filter(
      (sale: NFTIndexerSaleI) => sale.round > lastRound
    );
    console.log({ newsales });
    await db.table("sales").bulkPut(
      newsales.map((sale: SaleI) => {
        return {
          pk: `${sale.mpContractId}-${sale.mpListingId}`,
          transactionId: sale.transactionId,
          mpContractId: sale.mpContractId,
          mpListingId: sale.mpListingId,
          tokenId: sale.tokenId,
          seller: sale.seller,
          buyer: sale.buyer,
          currency: sale.currency,
          price: sale.price,
          round: sale.round,
          timestamp: sale.timestamp,
          collectionId: sale.collectionId,
        };
      })
    );
    return [...sales, ...newsales].map((sale: any) => sale) as SaleI[];
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const initialState: SalesState = {
  sales: [],
  status: "idle",
  error: null,
};

const saleslice = createSlice({
  name: "sales",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSales.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getSales.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.sales = [...action.payload];
      })
      .addCase(getSales.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default saleslice.reducer;
