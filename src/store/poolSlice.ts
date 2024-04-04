// reducers.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import db from "../db";
import { RootState } from "./store";
import { CONTRACT, abi, arc200 } from "ulujs";
import { getAlgorandClients } from "../wallets";
import { PoolI } from "../types";

interface Pool {
  txId: string;
  round: number;
  ts: number;
  poolId: number;
  tokA: number;
  tokB: number;
}

export interface PoolState {
  pools: Pool[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

export const getPools = createAsyncThunk<
  Pool[],
  void,
  { rejectValue: string; state: RootState }
>("pools/getPools", async (_, { getState, rejectWithValue }) => {
  try {
    const poolsTable = db.table("pools");
    const tokensTable = db.table("tokens");
    const pools = await poolsTable.toArray();
    const tokens = await tokensTable.toArray();
    const minRound = 5486024;
    const lastRound =
      pools.length > 0 ? Math.max(...pools.map((pool) => pool.round)) : 0;
    const { algodClient, indexerClient } = getAlgorandClients();
    const ci = new CONTRACT(
      23223143,
      algodClient,
      indexerClient,
      {
        name: "",
        desc: "",
        methods: [],
        events: [
          { name: "Register", args: [{ type: "(uint64,uint64,uint64)" }] },
        ],
      },
      {
        addr: "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
        sk: new Uint8Array(0),
      }
    );
    const makeCi = (ctcInfo: number) =>
      new arc200(ctcInfo, algodClient, indexerClient, {
        acc: {
          addr: "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
          sk: new Uint8Array(0),
        },
        formatBytes: true,
      });

    const events = await ci.Register({
      minRound: lastRound,
    });
    const newPools = events
      .filter((event: any) => event[1] > lastRound)
      .map((event: any) => {
        return {
          txId: event[0],
          round: event[1],
          ts: event[2],
          poolId: Number(event[3][0]),
          tokA: Number(event[3][1]),
          tokB: Number(event[3][2]),
        };
      });
    for (const pool of newPools.filter(
      (pool: PoolI) => pool.round >= minRound
    )) {
      await db.table("pools").bulkPut(
        newPools.map((pool: Pool) => {
          return {
            txId: pool.txId,
            round: pool.round,
            ts: pool.ts,
            poolId: pool.poolId,
            tokA: pool.tokA,
            tokB: pool.tokB,
          };
        })
      );
    }
    // const newTokens: any[] = [];
    // for (const pool of newPools) {
    //   newTokens.push(pool.poolId);
    //   if (
    //     !tokens.find((token) => token.tokenId === pool.tokA) &&
    //     !newTokens.find((token) => token.tokenId === pool.tokA)
    //   ) {
    //     newTokens.push(pool.tokA);
    //   }
    //   if (
    //     !tokens.find((token) => token.tokenId === pool.tokB) &&
    //     !newTokens.find((token) => token.tokenId === pool.tokB)
    //   ) {
    //     newTokens.push(pool.tokB);
    //   }
    // }
    // const dbTokens = []
    // for (const tokenId of newTokens) {
    //   const ci = makeCi(tokenId);
    //   const arc200_nameR = await ci.arc200_name();
    //   const arc200_symbolR = await ci.arc200_symbol();
    //   const arc200_decimalsR = await ci.arc200_decimals();
    //   const arc200_totalSupplyR = await ci.arc200_totalSupply();
    //   if (
    //     arc200_nameR.success &&
    //     arc200_symbolR.success &&
    //     arc200_decimalsR.success &&
    //     arc200_totalSupplyR.success
    //   ) {

    //     dbTokens.push({
    //       tokenId,
    //       name: arc200_nameR.returnValue,
    //       symbol: arc200_symbolR.returnValue,
    //       decimals: Number(arc200_decimalsR.returnValue),
    //       totalSupply: arc200_totalSupplyR.returnValue,
    //     });
    //   }
    // }
    // await db.table("tokens").bulkPut(dbTokens);
    const wl: number[] = [];
    return ([...pools, ...newPools] as Pool[]).filter(
      (pool) =>
        pool.round >= minRound && (wl.length > 0 || !wl.includes(pool.poolId))
    );
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const initialState: PoolState = {
  pools: [],
  status: "idle",
  error: null,
};

const poolSlice = createSlice({
  name: "pools",
  initialState,
  reducers: {
    updatePool(state, action) {
      const { poolId, newData } = action.payload;
      const poolToUpdate = state.pools.find((pool) => pool.poolId === poolId);
      if (poolToUpdate) {
        Object.assign(poolToUpdate, newData);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPools.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getPools.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.pools = [...action.payload];
      })
      .addCase(getPools.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { updatePool } = poolSlice.actions;
export default poolSlice.reducer;
