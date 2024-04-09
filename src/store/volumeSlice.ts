// reducers.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import db from "../db";
import { RootState } from "./store";
import axios from "axios";

interface Volume {
  round: number;
  ts: number;
  poolId: number;
  inA: string;
  inB: string;
}

export interface VolumeState {
  volumes: Volume[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export const getVolume = createAsyncThunk<
  Volume[],
  void,
  { rejectValue: string; state: RootState }
>("volume/getVolume", async (_, { getState, rejectWithValue }) => {
  try {
    const volumeTable = db.table("volumes");
    const volumes = await volumeTable.toArray();
    const minRound = 5486024;
    const storedBals = [];
    if (volumes.length === 0) {
      const { data } = await axios.get("/api/volumes.json");
      storedBals.push(...data.filter((pool: Volume) => pool.round >= minRound));
    }
    const newVolumes = [];
    if (storedBals.length > 0) {
      newVolumes.push(...storedBals);
    }
    if (newVolumes.length > 0) {
      await db.table("volumes").bulkPut(
        newVolumes.map((pool: Volume) => ({
          pk: `${pool.round}_${pool.poolId},`,
          ...pool,
        }))
      );
    }
    return [...volumes, ...newVolumes] as Volume[];
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const initialState: VolumeState = {
  volumes: [],
  status: "idle",
  error: null,
};

const poolSlice = createSlice({
  name: "volumes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getVolume.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getVolume.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.volumes = [...action.payload];
      })
      .addCase(getVolume.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export default poolSlice.reducer;
