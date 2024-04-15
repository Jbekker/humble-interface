// db.ts
import Dexie from "dexie";

const dexDb = new Dexie("dexDatabase");

dexDb.version(1).stores({
  tokens: "tokenId, name, symbol, decimals, totalSupply",
  pools: "txId, round, ts, poolId, tokA, tokB",
  farms:
    "txId, round, ts, poolId, who, stakeToken, rewardsToken, rewards, start, end",
  stake: "txId, round, ts, poolId, who, amount, staked, totalStaked",
});
dexDb.version(2).stores({
  poolBals: "pk, round, ts, poolId, balA, balB, rate",
  volumes: "pk, round, ts, poolId, inA, inB"
});

export default dexDb;
