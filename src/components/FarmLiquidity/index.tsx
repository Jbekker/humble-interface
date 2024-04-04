import styled from "@emotion/styled";
import React, { FC, useEffect } from "react";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { ARC200TokenI, FarmI, PoolI, PositionI, StakeI } from "../../types";
import { arc200 } from "ulujs";
import { getAlgorandClients } from "../../wallets";
import { useWallet } from "@txnlab/use-wallet";
import { Link } from "react-router-dom";
import { tokenSymbol } from "../../utils/dex";
import { Stack } from "@mui/material";
import FarmCard from "../FarmCard";

const Columns = styled.div`
  display: flex;
  padding: 1px 0px;
  justify-content: center;
  align-items: baseline;
  gap: 10px;
  align-self: stretch;
`;

const Heading = styled.div`
  display: flex;
  padding: var(--Spacing-600, 12px) var(--Spacing-700, 16px);
  align-items: flex-start;
  align-self: stretch;
  border-radius: var(--Radius-500, 12px);
`;

const Column = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 16px;
`;

const ColumnPair = styled(Column)`
  width: 234px;
`;

const ColumnTVL = styled(Column)`
  width: 97px;
`;

const ColumnVolume = styled(Column)`
  width: 98px;
`;

const ColumnAPR = styled(Column)``;

const ColumnLabel = styled.div`
  color: var(--Color-Brand-Element-Primary, #fff);
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "Plus Jakarta Sans";
  font-size: 13px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%; /* 15.6px */
`;

const YourLiquidityRoot = styled.div`
  width: 90%;
  display: flex;
  padding: var(--Spacing-800, 24px) var(--Spacing-900, 32px);
  flex-direction: column;
  align-items: flex-start;
  gap: var(--Spacing-800, 24px);
  border-radius: var(--Radius-800, 24px);
  &.dark {
    background: var(--Color-Brand-Background-Primary-30, #291c47);
    & h2 {
      color: var(--Color-Neutral-Element-Primary, #fff);
    }
    & .heading-row {
      border-bottom: 1px solid
        var(--Color-Neutral-Stroke-Primary, rgba(255, 255, 255, 0.2));
    }
    & .message-text {
      color: var(--Color-Neutral-Element-Secondary, #f6f6f8);
    }
  }
  &.light {
    background: var(--Color-Brand-Background-Primary-30, #f1eafc);
    & h2 {
      color: var(--Color-Neutral-Element-Primary, #0c0c10);
    }
    & .heading-row {
      border-bottom: 1px solid var(--Color-Neutral-Stroke-Primary, #d8d8e1);
    }
    & .message-text {
      color: var(--Color-Neutral-Element-Secondary, #56566e);
    }
  }
`;

const HeadingRow = styled.div`
  display: flex;
  width: 100%;
  padding-bottom: var(--Spacing-700, 16px);
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.h2`
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  /* Heading/Display 2 */
  font-family: "Plus Jakarta Sans";
  font-size: 18px;
  font-style: normal;
  font-weight: 700;
  line-height: 120%; /* 21.6px */
`;

const Body = styled.div`
  display: flex;
  padding: 1px 0px;
  justify-content: center;
  align-items: baseline;
  gap: 10px;
  align-self: stretch;
`;

const MessageText = styled.div`
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 15px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%; /* 18px */
`;

const InfoCircleIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M7.99992 14.6673C11.6666 14.6673 14.6666 11.6673 14.6666 8.00065C14.6666 4.33398 11.6666 1.33398 7.99992 1.33398C4.33325 1.33398 1.33325 4.33398 1.33325 8.00065C1.33325 11.6673 4.33325 14.6673 7.99992 14.6673Z"
        stroke="white"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M8 8V11.3333"
        stroke="white"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M7.99634 5.33398H8.00233"
        stroke="white"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

interface FarmLiquidityProps {
  farms: FarmI[];
  pools: PoolI[];
  tokens: ARC200TokenI[];
  stake: StakeI[];
}

const FarmLiquidity: FC<FarmLiquidityProps> = ({
  pools,
  tokens,
  stake,
  farms,
}) => {
  const { activeAccount } = useWallet();
  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  const dispatch = useDispatch();

  const [positions, setPositions] = React.useState<PositionI[]>([]);
  React.useEffect(() => {
    if (!activeAccount) return;
    const { algodClient, indexerClient } = getAlgorandClients();
    (async () => {
      const positions = [];
      for (const pool of pools) {
        const ci = new arc200(pool.poolId, algodClient, indexerClient, {
          acc: {
            addr: "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
            sk: new Uint8Array(0),
          },
        });
        const arc200_balanceOfR = await ci.arc200_balanceOf(
          activeAccount.address
        );
        if (!arc200_balanceOfR.success) {
          console.error(arc200_balanceOfR.error);
          continue;
        }
        const arc200_balanceOf = arc200_balanceOfR.returnValue;
        if (arc200_balanceOf === BigInt(0)) continue;
        positions.push({
          ...pool,
          balance: arc200_balanceOf,
        });
      }
      setPositions(positions);
    })();
  }, [pools]);

  console.log("positions", positions);

  return (
    <YourLiquidityRoot className={isDarkTheme ? "dark" : "light"}>
      <HeadingRow className="heading-row">
        <SectionTitle>Farm Liquidity</SectionTitle>
      </HeadingRow>
      <Columns>
        <Heading>
          <ColumnPair>
            <ColumnLabel>&nbsp;</ColumnLabel>
          </ColumnPair>
          <ColumnTVL>
            <ColumnLabel>Rewards</ColumnLabel>
            <InfoCircleIcon />
          </ColumnTVL>
          <ColumnVolume>
            <ColumnLabel>APR</ColumnLabel>
            <InfoCircleIcon />
          </ColumnVolume>
          <ColumnAPR>
            <ColumnLabel>TVL</ColumnLabel>
            <InfoCircleIcon />
          </ColumnAPR>
        </Heading>
      </Columns>
      <Body>
        {stake.length > 0 ? (
          <Stack spacing={2} sx={{ width: "100%" }}>
            {stake.map((position) => (
              <FarmCard
                key={position.poolId}
                farm={farms.find((farm) => farm.poolId === position.poolId)}
                round={0}
                timestamp={0}
              />
            ))}
          </Stack>
        ) : (
          <MessageText className="message-text">No farms found</MessageText>
        )}
      </Body>
    </YourLiquidityRoot>
  );
};

export default FarmLiquidity;
