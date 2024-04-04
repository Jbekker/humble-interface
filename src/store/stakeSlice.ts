// reducers.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import db from "../db";
import { RootState } from "./store";
import { CONTRACT, abi, arc200 } from "ulujs";
import { getAlgorandClients } from "../wallets";
import { PoolI, StakeI } from "../types";
import { CTCINFO_STAKR_200 } from "../contants/dex";

interface Stake {
  txId: string;
  round: number;
  ts: number;
  poolId: number;
  who: string;
  stakeAmount: number;
  staked: number;
  totalStaked: number;
}

export interface StakeState {
  stake: Stake[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export const getStake = createAsyncThunk<
  Stake[],
  void,
  { rejectValue: string; state: RootState }
>("pools/getStake", async (_, { getState, rejectWithValue }) => {
  try {
    const stakeTable = db.table("stake");
    const stake = await stakeTable.toArray();
    const minRound = 5486024;
    const lastRound =
      stake.length > 0 ? Math.max(...stake.map((pool) => pool.round)) : 0;
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
    const events = await ci.Stake({
      minRound: lastRound,
    });
    console.log({ events });
    const newStake = events
      .filter((event: any) => event[1] > lastRound)
      .map((event: any) => {
        return {
          txId: event[0],
          round: event[1],
          ts: event[2],
          poolId: Number(event[3]),
          who: event[4],
          stakeAmount: Number(event[5]),
          staked: Number(event[6][0]),
          totalStaked: Number(event[6][1]),
        };
      });
    for (const pool of newStake.filter(
      (pool: StakeI) => pool.round >= minRound
    )) {
      await db.table("stake").bulkPut(
        newStake.map((stake: Stake) => {
          return {
            txId: stake.txId,
            round: stake.round,
            ts: stake.ts,
            poolId: stake.poolId,
            who: stake.who,
            amount: stake.stakeAmount,
            staked: stake.staked,
            totalStaked: stake.totalStaked,
          };
        })
      );
    }
    return [...stake, ...newStake];
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const initialState: StakeState = {
  stake: [],
  status: "idle",
  error: null,
};

const stakeSlice = createSlice({
  name: "stake",
  initialState,
  reducers: {
    updateStake(state, action) {
      const { poolId, newData } = action.payload;
      const poolToUpdate = state.stake.find((stake) => stake.poolId === poolId);
      if (poolToUpdate) {
        Object.assign(poolToUpdate, newData);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStake.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getStake.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.stake = [...action.payload];
      })
      .addCase(getStake.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { updateStake } = stakeSlice.actions;
export default stakeSlice.reducer;
