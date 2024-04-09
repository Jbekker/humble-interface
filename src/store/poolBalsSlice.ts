// reducers.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import db from "../db";
import { RootState } from "./store";
import axios from "axios";

interface PoolBals {
  round: number;
  ts: number;
  poolId: number;
  balA: string;
  balB: string;
  rate: string;
}

export interface PoolBalsState {
  poolBals: PoolBals[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export const getPoolBals = createAsyncThunk<
  PoolBals[],
  void,
  { rejectValue: string; state: RootState }
>("poolBals/getPoolBals", async (_, { getState, rejectWithValue }) => {
  try {
    const poolBalsTable = db.table("poolBals");
    const poolBals = await poolBalsTable.toArray();
    const minRound = 5486024;
    const storedBals = [];
    if (poolBals.length === 0) {
      const { data } = await axios.get("/api/poolBals.json");
      storedBals.push(
        ...data.filter((pool: PoolBals) => pool.round >= minRound)
      );
    }
    const newBals = [];
    if (storedBals.length > 0) {
      newBals.push(...storedBals);
    }
    if (newBals.length > 0) {
      await db.table("poolBals").bulkPut(
        newBals.map((pool: PoolBals) => ({
          pk: `${pool.round}_${pool.poolId},`,
          ...pool,
        }))
      );
    }
    return [...poolBals, ...newBals] as PoolBals[];
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const initialState: PoolBalsState = {
  poolBals: [],
  status: "idle",
  error: null,
};

const poolSlice = createSlice({
  name: "poolBals",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getPoolBals.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getPoolBals.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.poolBals = [...action.payload];
      })
      .addCase(getPoolBals.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default poolSlice.reducer;
