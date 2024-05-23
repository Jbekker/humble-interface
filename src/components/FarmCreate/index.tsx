import styled from "@emotion/styled";
import React, { FC, useEffect, useMemo, useState } from "react";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { useWallet } from "@txnlab/use-wallet";
import { CircularProgress, Stack } from "@mui/material";
import { CONTRACT, abi, arc200 } from "ulujs";
import { TOKEN_WVOI1 } from "../../constants/tokens";
import { getAlgorandClients } from "../../wallets";
import TokenInput from "../TokenInput";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ARC200TokenI, PoolI } from "../../types";
import { getTokens } from "../../store/tokenSlice";
import { UnknownAction } from "@reduxjs/toolkit";
import { getPools } from "../../store/poolSlice";
import algosdk from "algosdk";
import { toast } from "react-toastify";
import { tokenId, tokenSymbol } from "../../utils/dex";
import BigNumber from "bignumber.js";
import BasicDateCalendar from "../BasicDateCalendar";
import moment from "moment";

const Note = styled.div`
  align-self: stretch;
  color: var(--Color-Neutral-Element-Primary, #fff);
  font-feature-settings: "clig" off, "liga" off;
  /* Body/P */
  font-family: "IBM Plex Sans Condensed";
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%; /* 14.4px */
`;

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

const SubHeading = styled.h4`
  width: 100%;
`;

const Swap = () => {
  const navigate = useNavigate();
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
  //const paramTokenId = sp.get("tokenId");

  /* Wallet */
  const {
    providers,
    activeAccount,
    signTransactions,
    sendTransactions,
    getAccountInfo,
  } = useWallet();

  const [pool, setPool] = useState<PoolI>();
  const [ready, setReady] = useState<boolean>(false);

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

  const [start, setStart] = React.useState<number>(0);
  const [end, setEnd] = React.useState<number>(0);

  // EFFECT
  useEffect(() => {
    if (!pools || !tokens || pool) return;
    if (paramPoolId) {
      const pool = pools.find((p: PoolI) => `${p.poolId}` === `${paramPoolId}`);
      if (pool) {
        const token = [TOKEN_WVOI1].includes(pool.tokA)
          ? {
              tokenId: 0,
              name: "Voi",
              symbol: "VOI",
              decimals: 6,
              totalSupply: BigInt(10_000_000_000 * 1e6),
            }
          : tokens.find((t: ARC200TokenI) => `${t.tokenId}` === `${pool.tokA}`);
        setToken(token);
        const token2 = [TOKEN_WVOI1].includes(pool.tokB)
          ? {
              tokenId: 0,
              name: "Voi",
              symbol: "VOI",
              decimals: 6,
              totalSupply: BigInt(10_000_000_000 * 1e6),
            }
          : tokens.find((t: ARC200TokenI) => `${t.tokenId}` === `${pool.tokB}`);
        setToken2(token2);
      }
    }
  }, [pools, tokens]);

  // EFFECT
  useEffect(() => {
    if (!tokens) return;
    setTokenOptions([
      {
        tokenId: 0,
        name: "Voi",
        symbol: "VOI",
        decimals: 6,
        totalSupply: BigInt(10_000_000_000 * 1e6),
      },
      ...tokens,
    ]);
  }, [tokens, pools]);

  // EFFECT: update tokenOptions2 on token change
  useEffect(() => {
    if (!token || !tokenOptions) return;
    const exclude = [0, TOKEN_WVOI1].includes(token.tokenId)
      ? [0, TOKEN_WVOI1]
      : [token.tokenId];
    const tokenOptions2 = tokenOptions;
    //.filter(
    //  (t) => !exclude.includes(t.tokenId)
    //);
    // check if token options includes wVOI
    setTokenOptions2(tokenOptions2);
    setToAmount("0");
    setFromAmount("0");
  }, [token, tokenOptions]);

  console.log({ tokenOptions2 });

  useEffect(() => {
    if (!token2) return;
    setToAmount("");
  }, [token2]);

  // EFFECT
  useEffect(() => {
    if (!token || !activeAccount) return;
    const { algodClient, indexerClient } = getAlgorandClients();
    if (token.tokenId === 0) {
      algodClient
        .accountInformation(activeAccount.address)
        .do()
        .then((accInfo: any) => {
          const balance = accInfo.amount;
          const minBalance = accInfo["min-balance"];
          const availableBalance = balance - minBalance;
          setBalance((availableBalance / 1e6).toLocaleString());
        });
    } else {
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
    }
  }, [token, activeAccount]);

  // EFFECT
  useEffect(() => {
    if (!token2 || !activeAccount) return;
    const { algodClient, indexerClient } = getAlgorandClients();
    const ci = new arc200(token2.tokenId, algodClient, indexerClient);
    if (token2.tokenId === 0) {
      algodClient
        .accountInformation(activeAccount.address)
        .do()
        .then((accInfo: any) => {
          const balance = accInfo.amount;
          const minBalance = accInfo["min-balance"];
          const availableBalance = balance - minBalance;
          setBalance2((availableBalance / 1e6).toLocaleString());
        });
    } else {
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
    }
  }, [token2, activeAccount]);

  // EFFECT: get voi balance
  useEffect(() => {
    if (activeAccount && providers && providers.length >= 3) {
      getAccountInfo().then(setAccInfo);
    }
  }, [activeAccount, providers]);

  const isValid = useMemo(() => {
    return (
      !!token &&
      !!token2 &&
      //!!fromAmount &&
      !!toAmount &&
      //!!balance &&
      !!balance2 &&
      //Number(fromAmount.replace(/,/g, "")) <=
      //Number(balance.replace(/,/g, "")) &&
      Number(toAmount.replace(/,/g, "")) <= Number(balance2.replace(/,/g, ""))
    );
  }, [balance, balance2, fromAmount, toAmount, token, token2]);

  console.log("isValid", isValid);

  const buttonLabel = useMemo(() => {
    if (isValid) {
      return "Create farm";
    } else {
      if (
        Number(fromAmount.replace(/,/g, "")) >
        Number(balance?.replace(/,/g, ""))
      ) {
        return `Insufficient ${tokenSymbol(token)} balance`;
      } else if (
        Number(toAmount.replace(/,/g, "")) > Number(balance2?.replace(/,/g, ""))
      ) {
        return `Insufficient ${tokenSymbol(token2)} balance`;
      } else if (!token || !token2) {
        return "Select token above";
      } else if (!fromAmount || !toAmount) {
        return "Enter amount above";
      } else {
        return "Invalid input";
      }
    }
  }, [isValid, fromAmount, toAmount, balance, balance2, token, token2]);

  const handlePoolCreate = async () => {
    if (!activeAccount || !token || !token2) return;
    try {
      // create app -> app id
      // approve spend tok A to app id
      // approve spend tok B to app id
      // call provider deposit
      // -------------------------------------------
      // create app -> app id
      // -------------------------------------------
      const { algodClient, indexerClient } = getAlgorandClients();

      // -------------------------------------------
      // reach_p0
      // -------------------------------------------
      do {
        const ctcInfo = 36898212;
        const spec = {
          name: "",
          desc: "",
          methods: [
            // custom()void
            {
              name: "custom",
              args: [],
              returns: {
                type: "void",
              },
            },
            //Funder_deployPool(((uint64),uint64,(uint256),uint64,uint64))uint64
            {
              name: "Funder_deployPool",
              desc: "Deploys a pool",
              args: [
                {
                  type: "((uint64),uint64,(uint256),uint64,uint64)",
                  desc: "((rewardToken), stakeToken, (rewardAmount), startTime, endTime)",
                },
              ],
              returns: {
                type: "uint64",
              },
            },
          ],
          events: [],
        };
        const ci = new CONTRACT(ctcInfo, algodClient, indexerClient, spec, {
          addr: activeAccount.address,
          sk: new Uint8Array(0),
        });
        const stakeToken = tokenId(token);
        const rewardToken = tokenId(token2);
        const rewardAmount = BigInt(
          new BigNumber(toAmount.replace(/,/g, ""))
            .multipliedBy(new BigNumber(10).pow(token2.decimals))
            .toFixed(0)
        );
        const ciRTok = new CONTRACT(
          rewardToken,
          algodClient,
          indexerClient,
          abi.arc200,
          {
            addr: activeAccount.address,
            sk: new Uint8Array(0),
          }
        );

        const arc200_allowanceR = await ciRTok.arc200_allowance(
          activeAccount.address,
          algosdk.getApplicationAddress(ctcInfo)
        );
        if (!arc200_allowanceR.success)
          throw new Error("Failed to get allowance");
        const arc200_allowance = arc200_allowanceR.returnValue;
        const newAllowance = arc200_allowance + rewardAmount;

        const allowanceSU = new BigNumber(arc200_allowance)
          .div(new BigNumber(10).pow(token2.decimals))
          .toFixed(0);
        const newAllowanceSU = new BigNumber(newAllowance)
          .div(new BigNumber(10).pow(token2.decimals))
          .toFixed(0);
        const rewardSU = new BigNumber(rewardAmount.toString())
          .div(new BigNumber(10).pow(token2.decimals))
          .toFixed(0);

        const builder = {
          arc200: new CONTRACT(
            rewardToken,
            algodClient,
            indexerClient,
            abi.arc200,
            {
              addr: activeAccount.address,
              sk: new Uint8Array(0),
            },
            true,
            false,
            true
          ),
          stakr200: new CONTRACT(
            ctcInfo,
            algodClient,
            indexerClient,
            spec,
            {
              addr: activeAccount.address,
              sk: new Uint8Array(0),
            },
            true,
            false,
            true
          ),
        };

        let customR;
        for (const p1 of [0, 28100]) {
          const txns = [];
          const txnO = (
            await builder.arc200.arc200_approve(
              algosdk.getApplicationAddress(ctcInfo),
              newAllowance
            )
          ).obj;
          txns.push({
            ...txnO,
            payment: p1,
            note: new TextEncoder().encode(
              `${token2.symbol} arc200_approve ${
                activeAccount.address
              } ${algosdk.getApplicationAddress(
                ctcInfo
              )} ${newAllowanceSU} (${allowanceSU} -> ${newAllowanceSU}) +${rewardSU}`
            ),
          });
          const txn1 = (
            await builder.stakr200.Funder_deployPool([
              [rewardToken],
              stakeToken,
              [rewardAmount],
              start / 1000,
              end / 1000,
            ])
          ).obj;
          txns.push({
            ...txn1,
            payment: 102100,
            note: new TextEncoder().encode(
              `deploy farm ${token.symbol} -> ${
                token2.symbol
              } ${rewardSU} starting: ${moment(start).format(
                "LL"
              )} ending: ${moment(end).format("LL")}
              `
            ),
          });
          console.log(txns);
          ci.setFee(2000);
          ci.setExtraTxns(txns);
          ci.setAccounts([algosdk.getApplicationAddress(ctcInfo)]);
          ci.setEnableGroupResourceSharing(true);
          customR = await ci.custom();
          console.log({ customR });
          if (customR.success) {
            break;
          }
        }
        await toast.promise(
          signTransactions(
            customR.txns.map(
              (t: string) => new Uint8Array(Buffer.from(t, "base64"))
            )
          ).then(sendTransactions),
          {
            pending: "Pending transaction to create farm",
            success: "Successfully created farm",
          }
        );
      } while (0);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const isLoading = !pools || !tokens;

  return !isLoading ? (
    <SwapRoot className={isDarkTheme ? "dark" : "light"}>
      <SwapHeadingContainer>
        <SwapHeading className={isDarkTheme ? "dark" : "light"}>
          Create farm
        </SwapHeading>
      </SwapHeadingContainer>
      <SwapContainer gap={2}>
        <SubHeading>Step 1: Choose stake token</SubHeading>
        <TokenInput
          label="Stake token"
          amount={fromAmount}
          setAmount={setFromAmount}
          token={token}
          setToken={setToken}
          balance={balance}
          onFocus={() => setFocus("from")}
          options={tokenOptions}
        />
        {token ? (
          <>
            <SubHeading>Step 2: Choose reward</SubHeading>
            <TokenInput
              label="Reward token"
              amount={toAmount}
              setAmount={setToAmount}
              token={token2}
              setToken={setToken2}
              options={tokenOptions2}
              balance={balance2}
              onFocus={() => setFocus("to")}
            />
          </>
        ) : null}
        {token2 && toAmount ? (
          <>
            <SubHeading>Step 3: Chose start date</SubHeading>
            <BasicDateCalendar
              onChange={(e: any) => {
                setStart(e.valueOf());
                setEnd(e.valueOf());
              }}
            />
          </>
        ) : null}
        {start ? (
          <>
            <SubHeading>Step 4: Chose end date</SubHeading>
            <BasicDateCalendar
              minDate={
                !!start && start > 0
                  ? moment(start).add(1, "w").format("YYYY-MM-DD")
                  : moment().add(1, "w").format("YYYY-MM-DD")
              }
              onChange={(e: any) => {
                setEnd(e.valueOf());
              }}
            />
          </>
        ) : null}
        {isValid ? (
          <>
            <SubHeading>Summary</SubHeading>
            <p>
              Creating {token?.symbol} staking pool rewarding {toAmount}{" "}
              {token2?.symbol} from {moment(start).format("LL")} to{" "}
              {moment(end).format("LL")} starting {moment(start).fromNow()} and
              ending {moment(end).fromNow()}.
            </p>
          </>
        ) : null}
      </SwapContainer>
      <Button
        className={isValid ? "active" : undefined}
        onClick={() => {
          if (!on) {
            handlePoolCreate();
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
            Add liquidity in progress
          </div>
        )}
      </Button>
      <Note>
        By creating a farm you'll pay a upfront fee 0.3% of rewards proportional
        to total rewards pool
      </Note>
    </SwapRoot>
  ) : null;
};

export default Swap;
