// reducers.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import db from "../db";
import { RootState } from "./store";
import { CONTRACT, abi, arc200 } from "ulujs";
import { getAlgorandClients } from "../wallets";
import { PoolI } from "../types";
import { CTCINFO_STAKR_200 } from "../contants/dex";

interface Farm {
  txId: string;
  round: number;
  ts: number;
  poolId: number;
  who: string;
  stakeToken: number;
  rewardsToken: number;
  rewards: number;
  start: number;
  end: number;
}

export interface FarmState {
  farms: Farm[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export const getFarms = createAsyncThunk<
  Farm[],
  void,
  { rejectValue: string; state: RootState }
>("pools/getFarms", async (_, { getState, rejectWithValue }) => {
  try {
    const poolsTable = db.table("farms");
    const pools = await poolsTable.toArray();
    const minRound = 5486024;
    const lastRound =
      pools.length > 0 ? Math.max(...pools.map((pool) => pool.round)) : 0;
    const { algodClient, indexerClient } = getAlgorandClients();
    const ci = new CONTRACT(
      CTCINFO_STAKR_200,
      algodClient,
      indexerClient,
      {
        name: "",
        desc: "",
        methods: [],
        events: [
          // poolId, who, stakeToken, rewardsToken, rewards, start, end
          {
            name: "Pool",
            args: [
              {
                type: "uint64",
                name: "poolId",
              },
              {
                type: "address",
                name: "who",
              },
              {
                type: "uint64",
                name: "stakeToken",
              },
              {
                type: "(uint64)",
                name: "rewardsToken",
              },
              {
                type: "(uint256)",
                name: "rewards",
              },
              {
                type: "uint64",
                name: "start",
              },
              {
                type: "uint64",
                name: "end",
              },
            ],
          },
          {
            name: "Stake",
            args: [
              {
                type: "uint64",
              },
              {
                type: "address",
              },
              {
                type: "uint256",
              },
              {
                type: "(uint256,uint256)",
              },
            ],
          },
        ],
      },
      {
        addr: "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
        sk: new Uint8Array(0),
      }
    );
    const events = await ci.Pool({
      minRound: lastRound,
    });
    const newPools = events
      .filter((event: any) => event[1] > lastRound)
      .map((event: any) => {
        return {
          txId: event[0],
          round: event[1],
          ts: event[2],
          poolId: Number(event[3]),
          who: event[4],
          stakeToken: Number(event[5]),
          rewardsToken: Number(event[6]),
          rewards: Number(event[7]),
          start: Number(event[8]),
          end: Number(event[9]),
        };
      });
    for (const pool of newPools.filter(
      (pool: PoolI) => pool.round >= minRound
    )) {
      await db.table("farms").bulkPut(
        newPools.map((farm: Farm) => {
          return {
            txId: farm.txId,
            round: farm.round,
            ts: farm.ts,
            poolId: farm.poolId,
            who: farm.who,
            stakeToken: farm.stakeToken,
            rewardsToken: farm.rewardsToken,
            rewards: farm.rewards,
            start: farm.start,
            end: farm.end,
          };
        })
      );
    }
    const wl: number[] = [];
    return ([...pools, ...newPools] as Farm[]).filter(
      (pool) =>
        pool.round >= minRound && (wl.length > 0 || !wl.includes(pool.poolId))
    );
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const initialState: FarmState = {
  farms: [],
  status: "idle",
  error: null,
};

const farmSlice = createSlice({
  name: "farms",
  initialState,
  reducers: {
    updateFarm(state, action) {
      const { poolId, newData } = action.payload;
      const poolToUpdate = state.farms.find((farm) => farm.poolId === poolId);
      if (poolToUpdate) {
        Object.assign(poolToUpdate, newData);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFarms.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getFarms.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.farms = [...action.payload];
      })
      .addCase(getFarms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { updateFarm } = farmSlice.actions;
export default farmSlice.reducer;
