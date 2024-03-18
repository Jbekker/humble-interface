import styled from "@emotion/styled";
import React, { useEffect, useState } from "react";
import SwapIcon from "static/icon/icon-swap-stable-light.svg";
import ActiveSwapIcon from "static/icon/icon-swap-active-light.svg";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";
import { useWallet } from "@txnlab/use-wallet";
import { Stack } from "@mui/material";
import { arc200 } from "ulujs";
import { TOKEN_VIA } from "../../contants/tokens";
import { getAlgorandClients } from "../../wallets";
import TokenInput from "../TokenInput";

const SwapRoot = styled.div`
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
  @media screen and (min-width: 600px) {
    width: 630px;
  }
`;

const SwapContainer = styled(Stack)`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: stretch;
`;

const Button = styled.div`
  display: flex;
  padding: var(--Spacing-700, 16px) var(--Spacing-800, 24px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  border-radius: var(--Radius-750, 20px);
  background: var(--Color-Accent-Disabled-Soft, #d8d8e1);
`;

const SummaryContainer = styled.div`
  display: flex;
  padding: 0px var(--Spacing-900, 32px);
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  align-self: stretch;
`;

const RateContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;
`;

const RateLabel = styled.div`
  width: 200px;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "Plus Jakarta Sans";
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  line-height: 120%; /* 19.2px */
  &.dark {
    color: var(--Color-Neutral-Stroke-Black, #fff);
  }
  &.light {
    color: var(--Color-Neutral-Stroke-Black, #141010);
  }
`;

const RateValue = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const RateMain = styled.div`
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "Plus Jakarta Sans";
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  line-height: 120%; /* 19.2px */
  &.dark {
    color: var(--Color-Neutral-Stroke-Black, #fff);
  }
  &.light {
    color: var(--Color-Neutral-Stroke-Black, #141010);
  }
`;

const RateSub = styled.div`
  color: #009c5a;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%; /* 15.6px */
`;

const BreakdownContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  align-self: stretch;
`;

const BreakdownStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: -4px;
  align-self: stretch;
`;

const BreakdownRow = styled.div`
  display: flex;
  padding: 4px 0px;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;
`;

const BreakdownLabel = styled.div`
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 180%; /* 28.8px */
  gap: 4px;
  display: flex;
  flex-direction: row;
  align-items: center;
  &.dark {
    color: var(--Color-Neutral-Element-Primary, #fff);
  }
  &.light {
    color: var(--Color-Neutral-Element-Primary, #0c0c10);
  }
`;

const BreakdownValueContiner = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
`;

const BreakdownValue = styled.div`
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 15px;
  font-style: normal;
  font-weight: 600;:sp
  line-height: 120%; /* 18px */
  &.dark {
    color: var(--Color-Neutral-Element-Primary, #fff);
  }
  &.light {
    color: var(--Color-Neutral-Element-Primary, #0c0c10);
  }
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
        d="M7.99992 14.6663C11.6666 14.6663 14.6666 11.6663 14.6666 7.99967C14.6666 4.33301 11.6666 1.33301 7.99992 1.33301C4.33325 1.33301 1.33325 4.33301 1.33325 7.99967C1.33325 11.6663 4.33325 14.6663 7.99992 14.6663Z"
        stroke="white"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M8 8V11.3333"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M7.99634 5.33301H8.00233"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const Swap = () => {
  /* Wallet */
  const { providers, activeAccount, connectedAccounts, getAccountInfo } =
    useWallet();
  const [accInfo, setAccInfo] = React.useState<any>(null);
  const [balance, setBalance] = React.useState<any>(null);
  const [fromAmount, setFromAmount] = React.useState<any>("");
  const [toAmount, setToAmount] = React.useState<any>("");
  // EFFECT: get voi balance
  useEffect(() => {
    if (activeAccount && providers && providers.length >= 3) {
      getAccountInfo().then(setAccInfo);
    }
  }, [activeAccount, providers]);
  // EFFECT: get voi balance
  useEffect(() => {
    if (activeAccount && providers && providers.length >= 3) {
      const { algodClient, indexerClient } = getAlgorandClients();
      const ci = new arc200(TOKEN_VIA, algodClient, indexerClient);
      ci.arc200_balanceOf(activeAccount.address).then(
        (arc200_balanceOfR: any) => {
          if (arc200_balanceOfR.success) {
            setBalance(Number(arc200_balanceOfR.returnValue));
          }
        }
      );
    }
  }, [activeAccount, providers]);
  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  const [on, setOn] = useState(false);
  return (
    <>
      <SwapRoot className={isDarkTheme ? "dark" : "light"}>
        <SwapContainer gap={on ? 1.43 : 0}>
          <TokenInput
            label="Swap from"
            amount={fromAmount}
            setAmount={setFromAmount}
          />
          <img
            src={on ? ActiveSwapIcon : SwapIcon}
            alt="swap"
            className={on ? "rotate" : undefined}
          />
          <TokenInput
            label="Swap to"
            amount={toAmount}
            setAmount={setToAmount}
          />
        </SwapContainer>
        <SummaryContainer>
          <RateContainer>
            <RateLabel className={isDarkTheme ? "dark" : "light"}>
              Rate
            </RateLabel>
            <RateValue>
              <RateMain className={isDarkTheme ? "dark" : "light"}>
                1 ETH = 4601.00078 USDC
              </RateMain>
              <RateSub>1 USDC = 0.00022 ETH</RateSub>
            </RateValue>
          </RateContainer>
          <BreakdownContainer>
            <BreakdownStack>
              <BreakdownRow>
                <BreakdownLabel className={isDarkTheme ? "dark" : "light"}>
                  <span>Liquidity provider fee</span>
                  <InfoCircleIcon />
                </BreakdownLabel>
                <BreakdownValueContiner>
                  <BreakdownValue className={isDarkTheme ? "dark" : "light"}>
                    0.0025 ETH
                  </BreakdownValue>
                </BreakdownValueContiner>
              </BreakdownRow>
              <BreakdownRow>
                <BreakdownLabel className={isDarkTheme ? "dark" : "light"}>
                  <span>Price impact</span>
                  <InfoCircleIcon />
                </BreakdownLabel>
                <BreakdownValueContiner>
                  <BreakdownValue className={isDarkTheme ? "dark" : "light"}>
                    0.00%
                  </BreakdownValue>
                </BreakdownValueContiner>
              </BreakdownRow>
              <BreakdownRow>
                <BreakdownLabel className={isDarkTheme ? "dark" : "light"}>
                  <span>Allowed slippage</span>
                  <InfoCircleIcon />
                </BreakdownLabel>
                <BreakdownValueContiner>
                  <BreakdownValue className={isDarkTheme ? "dark" : "light"}>
                    0.50%
                  </BreakdownValue>
                </BreakdownValueContiner>
              </BreakdownRow>
              <BreakdownRow>
                <BreakdownLabel className={isDarkTheme ? "dark" : "light"}>
                  <span>Minimum received</span>
                  <InfoCircleIcon />
                </BreakdownLabel>
                <BreakdownValueContiner>
                  <BreakdownValue className={isDarkTheme ? "dark" : "light"}>
                    4600.00076 USDC
                  </BreakdownValue>
                </BreakdownValueContiner>
              </BreakdownRow>
            </BreakdownStack>
          </BreakdownContainer>
        </SummaryContainer>
        <Button>Select token above</Button>
      </SwapRoot>
    </>
  );
};

export default Swap;
