import styled from "@emotion/styled";
import React, { FC, useEffect, useMemo, useState } from "react";
import SwapIcon from "static/icon/icon-swap-stable-light.svg";
import ActiveSwapIcon from "static/icon/icon-swap-active-light.svg";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { useWallet } from "@txnlab/use-wallet";
import { CircularProgress, Stack } from "@mui/material";
import { CONTRACT, abi, arc200, swap200 } from "ulujs";
import { TOKEN_VIA, TOKEN_WVOI1 } from "../../constants/tokens";
import { getAlgorandClients } from "../../wallets";
import TokenInput from "../TokenInput";
import { useSearchParams } from "react-router-dom";
import { ARC200TokenI, PoolI } from "../../types";
import { getTokens } from "../../store/tokenSlice";
import { UnknownAction } from "@reduxjs/toolkit";
import { getPools } from "../../store/poolSlice";
import algosdk from "algosdk";
import { toast } from "react-toastify";
import { tokenSymbol } from "../../utils/dex";
import DiscreteSlider from "../DiscreteSlider";

const spec = {
  name: "pool",
  desc: "pool",
  methods: [
    {
      name: "custom",
      args: [],
      returns: {
        type: "void",
      },
    },
    {
      name: "Info",
      args: [],
      returns: {
        type: "((uint256,uint256),(uint256,uint256),(uint256,uint256,uint256,address,byte),(uint256,uint256),uint64,uint64)",
      },
      readonly: true,
    },
    {
      name: "Provider_deposit",
      args: [
        { type: "byte" },
        { type: "(uint256,uint256)" },
        { type: "uint256" },
      ],
      returns: { type: "uint256" },
    },
    {
      name: "Provider_withdraw",
      args: [
        { type: "byte" },
        { type: "uint256" },
        { type: "(uint256,uint256)" },
      ],
      returns: { type: "(uint256,uint256)" },
    },
    {
      name: "Provider_withdrawA",
      args: [{ type: "uint256" }],
      returns: { type: "uint256" },
    },
    {
      name: "Provider_withdrawB",
      args: [{ type: "uint256" }],
      returns: { type: "uint256" },
    },
    {
      name: "Trader_swapAForB",
      args: [{ type: "byte" }, { type: "uint256" }, { type: "uint256" }],
      returns: { type: "(uint256,uint256)" },
    },
    {
      name: "Trader_swapBForA",
      args: [{ type: "byte" }, { type: "uint256" }, { type: "uint256" }],
      returns: { type: "(uint256,uint256)" },
    },
    {
      name: "arc200_approve",
      desc: "Approve spender for a token",
      args: [
        {
          type: "address",
          name: "spender",
          desc: "The address of the spender",
        },
        {
          type: "uint256",
          name: "value",
          desc: "The amount of tokens to approve",
        },
      ],
      returns: {
        type: "bool",
        desc: "Success",
      },
    },
    {
      name: "arc200_balanceOf",
      desc: "Returns the current balance of the owner of the token",
      readonly: true,
      args: [
        {
          type: "address",
          name: "owner",
          desc: "The address of the owner of the token",
        },
      ],
      returns: {
        type: "uint256",
        desc: "The current balance of the holder of the token",
      },
    },
    {
      name: "arc200_transfer",
      desc: "Transfers tokens",
      readonly: false,
      args: [
        {
          type: "address",
          name: "to",
          desc: "The destination of the transfer",
        },
        {
          type: "uint256",
          name: "value",
          desc: "Amount of tokens to transfer",
        },
      ],
      returns: {
        type: "bool",
        desc: "Success",
      },
    },
    {
      name: "createBalanceBox",
      desc: "Creates a balance box",
      args: [
        {
          type: "address",
        },
      ],
      returns: {
        type: "void",
      },
    },
    //createAllowanceBox(address,address)void
    {
      name: "createAllowanceBox",
      desc: "Creates an allowance box",
      args: [
        {
          type: "address",
        },
        {
          type: "address",
        },
      ],
      returns: {
        type: "void",
      },
    },
    //createBalanceBoxes(address)void
    {
      name: "createBalanceBoxes",
      desc: "Creates a balance box",
      args: [
        {
          type: "address",
        },
      ],
      returns: {
        type: "void",
      },
    },
    // hasBox((byte,byte[64]))byte
    {
      name: "hasBox",
      desc: "Checks if the account has a box",
      args: [
        {
          type: "(byte,byte[64])",
        },
      ],
      returns: {
        type: "byte",
      },
    },
    {
      name: "reserve",
      args: [
        {
          type: "address",
        },
      ],
      returns: {
        type: "(uint256,uint256)",
      },
      readonly: true,
    },
  ],
  events: [],
};

interface AddIconProps {
  theme: "light" | "dark";
}
const AddIcon: FC<AddIconProps> = ({ theme }) => {
  return theme === "dark" ? (
    <svg
      width="49"
      height="71"
      viewBox="0 0 49 71"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="22.0342"
        y1="-2.18557e-08"
        x2="22.0342"
        y2="71"
        stroke="white"
        stroke-opacity="0.2"
      />
      <rect x="0.53418" y="11" width="48" height="48" rx="24" fill="black" />
      <rect
        x="1.03418"
        y="11.5"
        width="47"
        height="47"
        rx="23.5"
        stroke="white"
        stroke-opacity="0.2"
      />
      <path
        d="M8.53418 35H40.5342"
        stroke="white"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M24.5342 51V19"
        stroke="white"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  ) : (
    <svg
      width="49"
      height="71"
      viewBox="0 0 49 71"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="22.0342"
        y1="-2.18557e-08"
        x2="22.0342"
        y2="71"
        stroke="#D8D8E1"
      />
      <rect
        x="1.03418"
        y="11.5"
        width="47"
        height="47"
        rx="23.5"
        fill="white"
      />
      <rect
        x="1.03418"
        y="11.5"
        width="47"
        height="47"
        rx="23.5"
        stroke="#D8D8E1"
      />
      <path
        d="M8.53418 35H40.5342"
        stroke="#141010"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M24.5342 51V19"
        stroke="#141010"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const SpinnerIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="26"
      height="24"
      viewBox="0 0 26 24"
      fill="none"
    >
      <path
        d="M4.78886 10.618L2.89155 8.7207L1.00513 10.618"
        stroke="white"
        stroke-width="1.63562"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M21.2104 13.3828L23.1078 15.2801L25.0051 13.3828"
        stroke="white"
        stroke-width="1.63562"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M23.0966 14.5293V11.9996C23.0966 6.41666 18.5714 1.90234 12.9994 1.90234C9.81541 1.90234 6.96943 3.38534 5.11572 5.68611"
        stroke="white"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M2.90234 9.4707V12.0005C2.90234 17.5834 7.42756 22.0977 12.9996 22.0977C16.1836 22.0977 19.0296 20.6147 20.8833 18.3139"
        stroke="white"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const SwapHeadingContainer = styled.div`
  width: 100%;
`;

const SwapHeading = styled.div`
  color: var(--Color-Neutral-Element-Primary, #0c0c10);
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  /* Heading/Display 2 */
  font-family: "Plus Jakarta Sans";
  font-size: 18px;
  font-style: normal;
  font-weight: 700;
  line-height: 120%; /* 21.6px */
  &.dark {
    color: var(--Color-Neutral-Element-Primary, #fff);
  }
`;

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

const BaseButton = styled.div`
  cursor: pointer;
`;

const Button = styled(BaseButton)`
  display: flex;
  padding: var(--Spacing-700, 16px) var(--Spacing-800, 24px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  border-radius: var(--Radius-750, 20px);
  background: var(--Color-Accent-Disabled-Soft, #d8d8e1);
  &.active {
    border-radius: var(--Radius-700, 16px);
    background: var(--Color-Accent-CTA-Background-Default, #2958ff);
  }
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
  &.has-divider {
    padding-bottom: 12px;
    border-bottom: 1px solid
      var(--Color-Neutral-Stroke-Primary, rgba(255, 255, 255, 0.2));
  }
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

const PoolRemove = () => {
  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  const dispatch = useDispatch();
  /* Tokens */
  const tokens = useSelector((state: RootState) => state.tokens.tokens);
  const tokenStatus = useSelector((state: RootState) => state.tokens.status);
  useEffect(() => {
    dispatch(getTokens() as unknown as UnknownAction);
  }, [dispatch]);
  /* Pools */
  const pools: PoolI[] = useSelector((state: RootState) => state.pools.pools);
  const poolsStatus = useSelector((state: RootState) => state.pools.status);
  useEffect(() => {
    dispatch(getPools() as unknown as UnknownAction);
  }, [dispatch]);

  /* Params */
  const [sp] = useSearchParams();
  const paramPoolId = sp.get("poolId");
  const paramTokenId = sp.get("tokenId");

  /* Wallet */
  const {
    providers,
    activeAccount,
    signTransactions,
    sendTransactions,
    getAccountInfo,
  } = useWallet();

  const [pool, setPool] = useState<PoolI>();
  useEffect(() => {
    if (!pool) return;
    if (paramTokenId) {
      const pool = pools.find((p: PoolI) => `${p.poolId}` === `${paramPoolId}`);
      if (pool) {
        setPool(pool);
      } else {
        setPool(pools[0]);
      }
    } else {
      setPool(pools[0]);
    }
  }, [pools, paramPoolId]);

  const [accInfo, setAccInfo] = React.useState<any>(null);
  const [focus, setFocus] = useState<"from" | "to">("from");
  const [fromAmount, setFromAmount] = React.useState<any>("");
  const [toAmount, setToAmount] = React.useState<any>("");
  const [on, setOn] = useState(false);

  const [token, setToken] = useState<ARC200TokenI>();
  const [token2, setToken2] = useState<ARC200TokenI>();

  const [tokenOptions, setTokenOptions] = useState<ARC200TokenI[]>();
  const [tokenOptions2, setTokenOptions2] = useState<ARC200TokenI[]>();
  const [balance, setBalance] = React.useState<string>();
  const [balance2, setBalance2] = React.useState<string>();

  useEffect(() => {
    if (!tokens || !pools || pools.length === 0) return;
    const newTokens = new Set<number>();
    for (const pool of pools) {
      newTokens.add(pool.tokA);
      newTokens.add(pool.tokB);
    }
    const poolTokens = Array.from(newTokens);
    const tokenOptions = tokens.filter((t: ARC200TokenI) =>
      poolTokens.includes(t.tokenId)
    );
    setTokenOptions(tokenOptions);
  }, [tokens, pools]);

  useEffect(() => {
    if (token || !tokenOptions) return;
    setToken(tokenOptions[0]);
  }, [token, tokenOptions]);

  const eligiblePools = useMemo(() => {
    return pools.filter((p: PoolI) => {
      return (
        [p.tokA, p.tokB].includes(token?.tokenId || 0) &&
        [p.tokA, p.tokB].includes(token2?.tokenId || 0) &&
        p.tokA !== p.tokB
      );
    });
  }, [pools, token, token2]);

  useEffect(() => {
    setPool(eligiblePools[0]);
  }, [eligiblePools]);

  const [info, setInfo] = useState<any>();
  useEffect(() => {
    if (!pool) return;
    const { algodClient, indexerClient } = getAlgorandClients();
    const ci = new swap200(pool.poolId, algodClient, indexerClient);
    ci.Info().then((info: any) => {
      setInfo(
        ((info: any) => ({
          lptBals: info[0],
          poolBals: info[1],
          protoInfo: ((pi: any) => ({
            protoFee: Number(pi[0]),
            lpFee: Number(pi[1]),
            totFee: Number(pi[2]),
            protoAddr: pi[3],
            locked: pi[4],
          }))(info[2]),
          protoBals: info[3],
          tokA: Number(info[4]),
          tokB: Number(info[5]),
        }))(info.returnValue)
      );
    });
  }, [pool]);

  const [poolBalance, setPoolBalance] = useState<BigInt>();
  useEffect(() => {
    if (!activeAccount || !pool) return;
    const { algodClient, indexerClient } = getAlgorandClients();
    const ci = new arc200(pool?.poolId, algodClient, indexerClient);
    ci.arc200_balanceOf(activeAccount.address).then(
      (arc200_balanceOfR: any) => {
        if (arc200_balanceOfR.success) {
          setPoolBalance(arc200_balanceOfR.returnValue);
        }
      }
    );
  }, [activeAccount, pool]);

  const [poolShare, setPoolShare] = useState<string>("0");
  useEffect(() => {
    if (!activeAccount || !pool || !info || !poolBalance) return;
    const newShare = (100 * Number(poolBalance)) / Number(info.lptBals[1]);
    setPoolShare(newShare.toFixed(2));
  }, [activeAccount, pool, info, poolBalance]);

  console.log("poolShare", poolShare);

  const [expectedOutcome, setExpectedOutcome] = useState<string>();
  useEffect(() => {
    if (!activeAccount || !pool || !info || !fromAmount || !token || !token2) {
      setExpectedOutcome(undefined);
      return;
    }
    const { algodClient, indexerClient } = getAlgorandClients();
    const ci = new CONTRACT(pool.poolId, algodClient, indexerClient, spec, {
      addr: "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
      sk: new Uint8Array(0),
    });
    const share = (Number(poolShare) * Number(fromAmount)) / 100;
    const withdrawAmount = Math.round((Number(info.lptBals[1]) * share) / 100);
    ci.setFee(4000);
    ci.Provider_withdraw(1, withdrawAmount, [0, 0]).then(
      (Provider_withdrawR: any) => {
        if (Provider_withdrawR.success) {
          setExpectedOutcome(Provider_withdrawR.returnValue);
        }
      }
    );
  }, [
    activeAccount,
    pool,
    info,
    fromAmount,
    toAmount,
    token,
    token2,
    poolShare,
  ]);

  console.log("expectedOutcome", expectedOutcome);

  const [newShare, setNewShare] = useState<string>();
  useEffect(() => {
    if (!expectedOutcome || !info) {
      setNewShare(undefined);
      return;
    }
    const newShare = (Number(poolShare) * (100 - Number(fromAmount))) / 100;
    setNewShare(newShare.toFixed(2));
  }, [expectedOutcome, poolBalance, info]);

  console.log("newShare", newShare);

  const [newPoolShare, setNewPoolShare] = useState<string>();

  const rate = useMemo(() => {
    if (!info || !token || !token2) return;
    if (info.tokA === token?.tokenId) {
      return (
        (Number(info.poolBals[0]) * 10 ** token2.decimals) /
        Number(info.poolBals[1]) /
        10 ** token.decimals
      ).toFixed(token.decimals);
    } else {
      return (
        (Number(info.poolBals[1]) * 10 ** token.decimals) /
        Number(info.poolBals[0]) /
        10 ** token2.decimals
      ).toFixed(token2.decimals);
    }
  }, [info, token, token2]);

  console.log("rate", rate);

  useEffect(() => {
    if (!rate || !fromAmount || !toAmount || !focus || !token || !token2)
      return;
    if (focus === "from") {
      setToAmount(
        Number(
          (Number(rate) * Number(fromAmount)).toFixed(token2.decimals)
        ).toLocaleString()
      );
    } else if (focus === "to") {
      setFromAmount(
        Number(
          (Number(toAmount) / Number(rate)).toFixed(token.decimals)
        ).toLocaleString()
      );
    }
  }, [rate, fromAmount, toAmount, focus, token, token2]);

  useEffect(() => {
    if (!pool || !token || !token2 || !toAmount || focus !== "to") return;
    const { algodClient, indexerClient } = getAlgorandClients();
    const acc = {
      addr: "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
      sk: new Uint8Array(0),
    };
    const ci = new CONTRACT(pool.poolId, algodClient, indexerClient, spec, acc);
    ci.setFee(4000);
    if (token.tokenId === pool?.tokA) {
      ci.Trader_swapBForA(1, Number(toAmount) * 10 ** token2.decimals, 0).then(
        (r: any) => {
          console.log({ r });
          if (r.success) {
            const fromAmount = (
              Number(r.returnValue[0]) /
              10 ** token2.decimals
            ).toLocaleString();
            console.log({ fromAmount });
            setFromAmount(fromAmount);
          }
        }
      );
    } else if (token.tokenId === pool?.tokB) {
      ci.Trader_swapAForB(1, Number(fromAmount) * 10 ** token.decimals, 0).then(
        (r: any) => {
          console.log({ r });
          if (r.success) {
            const fromAmount = (
              Number(r.returnValue[1]) /
              10 ** token.decimals
            ).toLocaleString();
            console.log({ fromAmount });
            setFromAmount(fromAmount);
          }
        }
      );
    }
  }, [pool, token, token2, toAmount, focus]);

  const isValid = !!token && !!token2 && !!fromAmount;

  // EFFECT
  useEffect(() => {
    if (
      tokenStatus !== "succeeded" ||
      !tokens ||
      token ||
      token2 ||
      tokens.length === 0
    )
      return;
    //setToken(tokens[0]);
    const options = new Set<ARC200TokenI>();
    for (const p of pools) {
      if ([p.tokA, p.tokB].includes(tokens[0].tokenId)) {
        if (tokens[0].tokenId === p.tokA) {
          options.add(
            tokens.find(
              (t: ARC200TokenI) => `${t.tokenId}` === `${p.tokB}`
            ) as ARC200TokenI
          );
        } else {
          options.add(
            tokens.find(
              (t: ARC200TokenI) => `${t.tokenId}` === `${p.tokA}`
            ) as ARC200TokenI
          );
        }
      }
    }
    //setToken2(Array.from(options)[0]);
  }, [tokens, tokenStatus, pools, token, token2]);

  // EFFECT
  useEffect(() => {
    if (!tokens || !pool) return;
    const tokenA = tokens.find(
      (t: ARC200TokenI) => `${t.tokenId}` === `${pool.tokA}`
    );
    const tokenB = tokens.find(
      (t: ARC200TokenI) => `${t.tokenId}` === `${pool.tokB}`
    );
    if (paramTokenId) {
      if (`${paramTokenId}` === `${tokenA?.tokenId}`) {
        setToken(tokenA);
        setToken2(tokenB);
      } else {
        setToken(tokenB);
        setToken2(tokenA);
      }
    } else {
      setToken(tokenA);
      setToken2(tokenB);
    }
  }, [tokens, pool, paramTokenId]);

  // EFFECT
  useEffect(() => {
    const options = new Set<ARC200TokenI>();
    for (const p of pools) {
      if ([p.tokA, p.tokB].includes(token?.tokenId || 0)) {
        if (token?.tokenId === p.tokA) {
          options.add(
            tokens.find(
              (t: ARC200TokenI) => `${t.tokenId}` === `${p.tokB}`
            ) as ARC200TokenI
          );
        } else {
          options.add(
            tokens.find(
              (t: ARC200TokenI) => `${t.tokenId}` === `${p.tokA}`
            ) as ARC200TokenI
          );
        }
      }
    }
    setTokenOptions2(Array.from(options));
    setToken2(Array.from(options)[0]);
    setToAmount("");
    setFromAmount("");
  }, [token, pools]);

  useEffect(() => {
    if (!token2) return;
    setToAmount("");
  }, [token2]);

  // EFFECT
  useEffect(() => {
    if (!token || !activeAccount) return;
    const { algodClient, indexerClient } = getAlgorandClients();
    const ci = new arc200(token.tokenId, algodClient, indexerClient);
    ci.arc200_balanceOf(activeAccount.address).then(
      (arc200_balanceOfR: any) => {
        if (arc200_balanceOfR.success) {
          setBalance(
            (
              Number(arc200_balanceOfR.returnValue) /
              10 ** token.decimals
            ).toLocaleString()
          );
        }
      }
    );
  }, [token, activeAccount]);

  // EFFECT
  useEffect(() => {
    if (!token2 || !activeAccount) return;
    const { algodClient, indexerClient } = getAlgorandClients();
    const ci = new arc200(token2.tokenId, algodClient, indexerClient);
    ci.arc200_balanceOf(activeAccount.address).then(
      (arc200_balanceOfR: any) => {
        if (arc200_balanceOfR.success) {
          setBalance2(
            (
              Number(arc200_balanceOfR.returnValue) /
              10 ** token2.decimals
            ).toLocaleString()
          );
        }
      }
    );
  }, [token2, activeAccount]);

  // EFFECT: get voi balance
  useEffect(() => {
    if (activeAccount && providers && providers.length >= 3) {
      getAccountInfo().then(setAccInfo);
    }
  }, [activeAccount, providers]);

  const buttonLabel = useMemo(() => {
    if (isValid) {
      return "Remove liquidity";
    } else {
      return "Select token above";
    }
  }, [isValid]);

  const handleButtonClick = async () => {
    if (!isValid || !token || !token2) return;
    if (!activeAccount) {
      toast.info("Please connect your wallet first");
      return;
    }
    try {
      setOn(true);
      const { algodClient, indexerClient } = getAlgorandClients();
      const makeCi = (ctcInfo: number) => {
        const acc = {
          addr: activeAccount?.address || "",
          sk: new Uint8Array(0),
        };
        return new CONTRACT(ctcInfo, algodClient, indexerClient, spec, acc);
      };
      const makeBuilder = (
        ctcInfoPool: number,
        ctcInfoTokA: number,
        ctcInfoTokB: number
      ) => {
        const acc = {
          addr: activeAccount?.address || "",
          sk: new Uint8Array(0),
        };
        return {
          pool: new CONTRACT(
            ctcInfoPool,
            algodClient,
            indexerClient,
            spec,
            acc,
            true,
            false,
            true
          ),
          arc200: {
            tokA: new CONTRACT(
              ctcInfoTokA,
              algodClient,
              indexerClient,
              {
                ...abi.arc200,
                methods: [
                  ...abi.arc200.methods,
                  {
                    name: "withdraw",
                    args: [
                      {
                        name: "amount",
                        type: "uint64",
                        desc: "Amount to withdraw",
                      },
                    ],
                    returns: {
                      type: "uint256",
                      desc: "Amount withdrawn",
                    },
                  },
                ],
              },
              acc,
              true,
              false,
              true
            ),
            tokB: new CONTRACT(
              ctcInfoTokB,
              algodClient,
              indexerClient,
              {
                ...abi.arc200,
                methods: [
                  ...abi.arc200.methods,
                  {
                    name: "withdraw",
                    args: [
                      {
                        name: "amount",
                        type: "uint64",
                        desc: "Amount to withdraw",
                      },
                    ],
                    returns: {
                      type: "uint256",
                      desc: "Amount withdrawn",
                    },
                  },
                ],
              },
              acc,
              true,
              false,
              true
            ),
          },
        };
      };

      // pick a pool
      const pool = eligiblePools.slice(-1)[0];
      const { poolId, tokA, tokB } = pool;
      const ci = makeCi(poolId);
      ci.setFee(4000);
      // get reserves
      // const reserveR = await ci.reserve(activeAccount.address);
      // if (!reserveR.success) return new Error("Reserve failed");
      // const [reserveA, reserveB] = reserveR.returnValue;
      // console.log({ reserveA, reserveB });

      // determine the direction
      // const swapAForB = pool.tokA === token.tokenId;
      // if (swapAForB) {
      // const inA = Math.round(Number(fromAmount) * 10 ** token.decimals);
      // const inB = Math.round(Number(toAmount) * 10 ** token2.decimals);

      const withdrawShare =
        fromAmount === "100"
          ? Number(poolShare)
          : (Number(poolShare) * Number(fromAmount)) / 100;

      const withdrawAmount =
        fromAmount === "100"
          ? poolBalance
          : Math.round((Number(info.lptBals[1]) * withdrawShare) / 100);

      const Provider_withdrawR = await ci.Provider_withdraw(
        1,
        withdrawAmount,
        [0, 0]
      );
      if (!Provider_withdrawR.success)
        return new Error("Add liquidity simulation failed");
      const Provider_withdraw = Provider_withdrawR.returnValue;

      console.log({ Provider_withdraw });

      const builder = makeBuilder(poolId, tokA, tokB);
      const poolAddr = algosdk.getApplicationAddress(poolId);

      const buildN = [
        builder.pool.Provider_withdraw(0, withdrawAmount, Provider_withdraw),
      ];

      // if Provider_withdraw includes wVOI add withdraw wVOI
      let wVOIWithdraw = BigInt(0);
      if ([TOKEN_WVOI1].includes(tokA) || [TOKEN_WVOI1].includes(tokB)) {
        if ([TOKEN_WVOI1].includes(tokA)) {
          wVOIWithdraw = Provider_withdraw[0];
        } else {
          wVOIWithdraw = Provider_withdraw[1];
        }
        buildN.push(builder.arc200.tokA.withdraw(wVOIWithdraw));
      }

      const buildP = (await Promise.all(buildN)).map((res: any) => res.obj);
      ci.setAccounts([poolAddr]);
      ci.setEnableGroupResourceSharing(true);
      ci.setExtraTxns(buildP);
      const customR = await ci.custom();
      console.log({ customR });
      if (!customR.success)
        return new Error("Add liquidity group simulation failed");
      await toast.promise(
        signTransactions(
          customR.txns.map(
            (t: string) => new Uint8Array(Buffer.from(t, "base64"))
          )
        ).then(sendTransactions),
        {
          pending: `Remove liquidity ${(
            Number(Provider_withdraw[0]) /
            10 ** token.decimals
          ).toFixed(token.decimals)} ${tokenSymbol(token, true)} + ${(
            Number(Provider_withdraw[1]) /
            10 ** token2.decimals
          ).toFixed(token2.decimals)} ${tokenSymbol(token2, true)}`,
          success: `Add liquidity successful!`,
        },
        {
          type: "default",
          position: "top-center",
          theme: "dark",
        }
      );
    } catch (e: any) {
      toast.error(e.message);
      console.error(e);
    } finally {
      setOn(false);
    }
  };

  const isLoading = !pools || !tokens;

  return !isLoading ? (
    <SwapRoot className={isDarkTheme ? "dark" : "light"}>
      <SwapHeadingContainer>
        <SwapHeading className={isDarkTheme ? "dark" : "light"}>
          Remove Liquidity
        </SwapHeading>
      </SwapHeadingContainer>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <label htmlFor="from">Remove amount</label>
        {/*<input
          name="from"
          style={{
            border: "1px solid #D8D8E1",
            borderRadius: "8px",
            color: "white",
            textAlign: "right",
            marginRight: "10px",
            padding: "10px",
            flexGrow: 1,
          }}
          type="number"
          min={0}
          max={100}
          value={fromAmount}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!isNaN(n) && n >= 0 && n <= 100) {
              setFromAmount(e.target.value);
            }
          }}
        />*/}
      </div>
      <DiscreteSlider
        onChange={(v) => {
          setFromAmount(v.toString());
        }}
      />
      <div
        style={{
          width: "100%",
        }}
      >
        Current share: {poolShare}%
      </div>
      <div
        style={{
          width: "100%",
        }}
      >
        New share: {newShare}%
      </div>
      <div
        style={{
          width: "100%",
        }}
      >
        You will receive: <br />
        {tokenSymbol(
          tokens.find((t: ARC200TokenI) => t.tokenId === pool?.tokA),
          true
        )}
        :{" "}
        {expectedOutcome
          ? Number(expectedOutcome?.[0]) / 10 ** (token?.decimals || 0)
          : "-"}
        {tokenSymbol(
          tokens.find((t: ARC200TokenI) => t.tokenId === pool?.tokB),
          true
        )}
        :{" "}
        {expectedOutcome
          ? Number(expectedOutcome?.[1]) / 10 ** (token2?.decimals || 0)
          : "-"}
      </div>
      <Button
        className={isValid ? "active" : undefined}
        onClick={() => {
          if (!on) {
            handleButtonClick();
          }
        }}
      >
        {!on ? (
          buttonLabel
        ) : (
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <CircularProgress color="inherit" size={20} />
            Remove liquidity in progress
          </div>
        )}
      </Button>
    </SwapRoot>
  ) : null;
};

export default PoolRemove;
