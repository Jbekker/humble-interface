import styled from "@emotion/styled";
import React, { useEffect, useMemo, useState } from "react";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { useWallet } from "@txnlab/use-wallet";
import PoolPosition from "../PoolPosition";
import PoolList from "../PoolList";
import { getPools } from "../../store/poolSlice";
import { UnknownAction } from "@reduxjs/toolkit";
import { BalanceI, PoolI, PositionI } from "../../types";
import { getTokens } from "../../store/tokenSlice";
import axios from "axios";
import BigNumber from "bignumber.js";

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

const Pool = () => {
  const { activeAccount } = useWallet();
  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  const [showing, setShowing] = useState<number>(10);
  const [showingPositions, setShowingPositions] = useState<number>(10);

  const pools: PoolI[] = useSelector((state: RootState) => state.pools.pools);

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
    if (!activeAccount) return;
    axios
      .get(`https://arc72-idx.nautilus.sh/nft-indexer/v1/arc200/tokens`)
      .then((res) => {
        setTokens(res.data.tokens);
      });
  }, [activeAccount]);

  const [positions, setPositions] = React.useState<PositionI[]>([]);
  useEffect(() => {
    if (!activeAccount || !balances) return;
    (async () => {
      const positions = [];
      for (const bal of balances) {
        const balance = BigInt(bal.balance);
        const pool = pools.find((p) => p.poolId === bal.contractId);
        if (!pool || balance === BigInt(0)) continue;
        positions.push({
          ...pool,
          balance: BigInt(bal.balance),
        });
      }
      setPositions(positions);
    })();
  }, [activeAccount, pools, balances]);

  const filteredPools = useMemo(() => {
    if (!tokens) return [];
    const fPools = [...pools].sort((a, b) => a.round - b.round);
    const uPools = new Map();
    for (const pool of fPools) {
      const key =
        pool.tokA > pool.tokB
          ? `${pool.tokB}-${pool.tokA}`
          : `${pool.tokA}-${pool.tokB}`;
      if (!uPools.has(key)) {
        uPools.set(key, pool);
      }
    }
    return Array.from(uPools.values());
  }, [tokens, pools]);

  return (
    <PoolRoot className={isDarkTheme ? "dark" : "light"}>
      {activeAccount ? (
        <>
          <PoolPosition
            positions={positions}
            showing={showingPositions}
            tokens={tokens || ([] as any[])}
          />
          {positions.length > showingPositions ? (
            <ViewMoreButton
              onClick={() => {
                setShowingPositions(showingPositions + 10);
                setShowing(10);
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
        />
        {filteredPools.length > showing ? (
          <ViewMoreButton
            onClick={() => {
              setShowingPositions(10);
              setShowing(showing + 10);
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
