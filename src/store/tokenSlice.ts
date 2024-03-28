// reducers.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import db from "../db";
import { RootState } from "./store";
import { ARC200TokenI } from "../types";

export interface TokensState {
  tokens: ARC200TokenI[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export const getTokens = createAsyncThunk<
  ARC200TokenI[],
  void,
  { rejectValue: string; state: RootState }
>("tokens/getTokens", async (_, { getState, rejectWithValue }) => {
  try {
    const tokenTable = db.table("tokens");
    const tokens = await tokenTable.toArray();
    console.log(tokens);
    return [...tokens];
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const initialState: TokensState = {
  tokens: [],
  status: "idle",
  error: null,
};

const tokenSlice = createSlice({
  name: "tokens",
  initialState,
  reducers: {
    updateToken(state, action) {
      const { tokenId, newData } = action.payload;
      const tokenToUpdate = state.tokens.find(
        (token) => token.tokenId === tokenId
      );
      if (tokenToUpdate) {
        Object.assign(tokenToUpdate, newData);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTokens.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getTokens.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tokens = [...action.payload];
      })
      .addCase(getTokens.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { updateToken } = tokenSlice.actions;
export default tokenSlice.reducer;
