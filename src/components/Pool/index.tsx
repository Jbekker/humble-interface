import styled from "@emotion/styled";
import React, { useEffect, useMemo, useState } from "react";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { useWallet } from "@txnlab/use-wallet";
import PoolPosition from "../PoolPosition";
import PoolList from "../PoolList";
import { getPools } from "../../store/poolSlice";
import { UnknownAction } from "@reduxjs/toolkit";
import { BalanceI, IndexerPoolI, PoolI, PositionI } from "../../types";
import { getTokens } from "../../store/tokenSlice";
import axios from "axios";
import BigNumber from "bignumber.js";

const formatter = new Intl.NumberFormat("en", { notation: "compact" });

const PoolRoot = styled.div`
  display: flex;
  padding: var(--Spacing-1000, 40px);
  flex-direction: column;
  align-items: center;
  gap: var(--Spacing-800, 24px);
  border-radius: var(--Radius-800, 24px);
  &.light {
    border: 1px solid
      var(--Color-Neutral-Stroke-Primary-Static-Contrast, #7e7e9a);
    background: var(
      --Color-Canvas-Transparent-white-950,
      rgba(255, 255, 255, 0.95)
    );
  }
  &.dark {
    border: 1px solid var(--Color-Brand-Primary, #41137e);
    background: var(--Color-Canvas-Transparent-white-950, #070709);
    box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  }
  width: 100%;
  @media screen and (min-width: 600px) {
    width: 630px;
  }
`;

const ViewMoreButton = styled.div`
  display: flex;
  padding: var(--Spacing-700, 16px) var(--Spacing-800, 24px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: var(--Radius-750, 20px);
  background: var(--Color-Accent-CTA-Background-Default, #2958ff);
`;

const ButtonLabelContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const DropdownIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
    >
      <path
        d="M16.5 10L12.5 14L8.5 10"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const Button = styled.div`
  cursor: pointer;
`;

const ButtonLabel = styled(Button)`
  color: var(--Color-Brand-White, #fff);
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "Plus Jakarta Sans";
  font-size: 22px;
  font-style: normal;
  font-weight: 700;
  line-height: 120%; /* 26.4px */
`;

const applyFilter = (p: any, f: string) =>
  p.symbolA.indexOf(f.toUpperCase()) >= 0 ||
  p.symbolB.indexOf(f.toUpperCase()) >= 0 ||
  `${p.tokAId}` === f ||
  `${p.tokBId}` === f ||
  p.poolId === f.toUpperCase();

const Pool = () => {
  const { activeAccount } = useWallet();
  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  const pageSize = 10;
  const [showing, setShowing] = useState<number>(pageSize);
  const [showingPositions, setShowingPositions] = useState<number>(pageSize);
  const [filter, setFilter] = useState<string>("");
  const [filter2, setFilter2] = useState<string>("");

  //const pools: PoolI[] = useSelector((state: RootState) => state.pools.pools);

  const [balances, setBalances] = React.useState<BalanceI[]>();
  useEffect(() => {
    if (!activeAccount) return;
    axios
      .get(
        `https://arc72-idx.nautilus.sh/nft-indexer/v1/arc200/balances?accountId=${activeAccount.address}`
      )
      .then((res) => {
        setBalances(res.data.balances);
      });
  }, [activeAccount]);

  const [tokens, setTokens] = React.useState<any[]>();
  useEffect(() => {
    //if (!activeAccount) return;
    axios
      .get(
        `https://arc72-idx.nautilus.sh/nft-indexer/v1/arc200/tokens?includes=all`
      )
      .then((res) => {
        setTokens(res.data.tokens);
      });
  }, [activeAccount]);

  // POOLs
  const [pools, setPools] = React.useState<IndexerPoolI[]>([]);
  useEffect(() => {
    axios
      .get(`https://arc72-idx.nautilus.sh/nft-indexer/v1/dex/pools`)
      .then(({ data }) => {
        setPools(
          data.pools.map((p: IndexerPoolI) => ({
            ...p,
            tvl: formatter.format(Number(p.tvl)),
            vol: formatter.format(Number(p.volA) + Number(p.volB)),
          }))
        );
      });
  }, []);
  // const uniqPools = useMemo(() => {
  //   if (!tokens || !pools) return [];
  //   const fPools = [...pools].sort((a, b) => a.round - b.round);
  //   const uPools = new Map();
  //   for (const pool of fPools) {
  //     const key =
  // s       pool.tokA > pool.tokB
  //         ? `${pool.tokB}-${pool.tokA}`
  //         : `${pool.tokA}-${pool.tokB}`;
  //     const tokenA = tokens.find((t) => t.contractId === pool.tokA);
  //     const tokenB = tokens.find((t) => t.contractId === pool.tokB);
  //     if (!uPools.has(key)) {
  //       uPools.set(key, {
  //         ...pool,
  //         key,
  //         tokenA,
  //         tokenB,
  //       });
  //     }
  //   }
  //   return Array.from(uPools.values());
  // }, [tokens, pools]);
  const uniqPools = pools;
  const filteredPools = useMemo(() => {
    const badPools = [
      24585187, // VOI/TACOS old
      23223146, // VOI/VRC200 old
      47613814, // VOI/VIA 2nd
      48698951, // VOI/VIA 3rd
      24584694, // VOI/VOICE old
      24590736, // VOI/VIA old
    ];
    return uniqPools.filter(
      (p) => !badPools.includes(p.contractId) && applyFilter(p, filter)
    );
  }, [uniqPools, filter]);

  const [positions, setPositions] = React.useState<any[]>([]);
  useEffect(() => {
    if (!activeAccount || !balances || !tokens || !filteredPools) return;
    (async () => {
      const positions = [];
      for (const bal of balances) {
        const balance = BigInt(bal.balance);
        const pool = filteredPools.find((p) => p.contractId === bal.contractId);
        if (!pool || balance === BigInt(0)) continue;
        const tokenA = tokens.find(
          (t) => `${t.contractId}` === `${pool.tokAId}`
        );
        const tokenB = tokens.find(
          (t) => `${t.contractId}` === `${pool.tokBId}`
        );
        const value =
          pool.supply && pool.supply !== "0"
            ? new BigNumber(bal.balance)
                .dividedBy(new BigNumber(10).pow(6))
                .dividedBy(new BigNumber(pool.supply))
                .multipliedBy(
                  Number(pool.tvlA) > Number(pool.tvlB)
                    ? new BigNumber(pool.tvlB).multipliedBy(2)
                    : new BigNumber(pool.tvlA).multipliedBy(2)
                )
                .toNumber()
            : 0;
        positions.push({
          ...pool,
          balance: BigInt(bal.balance),
          value,
          formattedValue: formatter.format(value),
          tokenA,
          tokenB,
        });
      }
      positions.sort((a, b) => Number(b.value) - Number(a.value));
      setPositions(positions);
      //setValue(positions.reduce((acc, val) => acc + val.value, 0));
    })();
  }, [activeAccount, filteredPools, balances, tokens]);
  const filteredPositions = useMemo(() => {
    return positions.filter((p) => applyFilter(p, filter2));
  }, [positions, filter2]);
  const value = useMemo(
    () => filteredPositions.reduce((acc, val) => acc + val.value, 0),
    [filteredPositions]
  );

  const isLoading = !filteredPools || !filteredPositions;

  if (isLoading) return null;
  return (
    <PoolRoot className={isDarkTheme ? "dark" : "light"}>
      {activeAccount ? (
        <>
          <PoolPosition
            positions={filteredPositions}
            value={value}
            showing={showingPositions}
            tokens={tokens || ([] as any[])}
            onFilter={setFilter2}
          />
          {filteredPositions.length > showingPositions ? (
            <ViewMoreButton
              onClick={() => {
                setShowingPositions(showingPositions + pageSize);
                setShowing(pageSize);
              }}
            >
              <ButtonLabelContainer>
                <DropdownIcon />
                <ButtonLabel>View More</ButtonLabel>
              </ButtonLabelContainer>
            </ViewMoreButton>
          ) : null}
        </>
      ) : null}
      <>
        <PoolList
          pools={filteredPools}
          tokens={tokens || ([] as any[])}
          showing={showing}
          onFilter={(v) => {
            setFilter(v);
            setShowing(pageSize);
          }}
        />
        {filteredPools.length > showing ? (
          <ViewMoreButton
            onClick={() => {
              setShowingPositions(pageSize);
              setShowing(showing + pageSize);
            }}
          >
            <ButtonLabelContainer>
              <DropdownIcon />
              <ButtonLabel>View More</ButtonLabel>
            </ButtonLabelContainer>
          </ViewMoreButton>
        ) : null}
      </>
    </PoolRoot>
  );
};

export default Pool;
