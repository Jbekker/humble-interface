import styled from "@emotion/styled";
import React, { FC, useEffect } from "react";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";
import { BalanceI, PoolI, PositionI } from "../../types";
import PoolCard from "../PoolCard";
import { useWallet } from "@txnlab/use-wallet";
import { Fade, Stack } from "@mui/material";
import axios from "axios";
import BigNumber from "bignumber.js";
import Search from "../Search";

const formatter = new Intl.NumberFormat("en", { notation: "compact" });

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
    & .heading-row2 {
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
    & .heading-row2 {
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
  /*
  padding-bottom: var(--Spacing-700, 16px);
  */
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

interface PoolPositionProps {
  positions: PositionI[];
  value: number;
  showing: number;
  tokens: any[];
  onFilter: (value: string) => void;
}

const PoolPosition: FC<PoolPositionProps> = ({
  positions,
  showing,
  tokens,
  onFilter,
  value,
}) => {
  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  return (
    <YourLiquidityRoot className={isDarkTheme ? "dark" : "light"}>
      <HeadingRow className="heading-row">
        <SectionTitle>Your Liquidity</SectionTitle>
        {positions.length > 0 ? (
          <Fade in={!!value} timeout={3000}>
            <SectionTitle style={{ fontWeight: 200, fontSize: "16px" }}>
              {formatter.format(value)} VOI
            </SectionTitle>
          </Fade>
        ) : null}
      </HeadingRow>
      <HeadingRow className="heading-row2" style={{ paddingBottom: "32px" }}>
        <Search onChange={onFilter} />
      </HeadingRow>
      <Body>
        {positions.length > 0 ? (
          <Stack
            spacing={2}
            sx={{
              width: "100%",
            }}
          >
            {positions.slice(0, showing).map((position: any) => (
              <PoolCard
                key={`position-${position.contractId}`}
                tokens={tokens || []}
                pool={position}
                balance={new BigNumber(position.balance.toString())
                  .div(new BigNumber(10).pow(6))
                  .toFixed(6)}
              />
            ))}
          </Stack>
        ) : (
          <MessageText className="message-text">
            No liquidity pools found
          </MessageText>
        )}
      </Body>
    </YourLiquidityRoot>
  );
};

export default PoolPosition;
