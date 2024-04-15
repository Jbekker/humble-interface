import styled from "@emotion/styled";
import React from "react";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { ARC200TokenI, PoolI, PositionI } from "../../types";
import { arc200 } from "ulujs";
import { getAlgorandClients } from "../../wallets";
import { useWallet } from "@txnlab/use-wallet";
import { Link, useNavigate } from "react-router-dom";
import { tokenSymbol } from "../../utils/dex";
import { Stack } from "@mui/material";
import PoolCard from "../PoolCard";

const Button = styled.div`
  cursor: pointer;
  //
`;

const BaseButton = styled(Button)`
  display: flex;
  padding: var(--Spacing-400, 8px) var(--Spacing-600, 12px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: var(--Radius-600, 13px);
`;

const CreateTokenButton = styled(BaseButton)`
  background: var(--Color-Accent-CTA-Background-Default, #2958ff);
`;

const CreateButtonInner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const CreateButtonLabel = styled.div`
  color: var(--Color-Neutral-Element-Primary, #fff);
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "Plus Jakarta Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%; /* 16.8px */
  //
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

const PoolIcon = () => {
  return (
    <svg
      width="23"
      height="24"
      viewBox="0 0 23 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.3231 15.6665C14.3231 19.3865 11.3122 22.3974 7.59224 22.3974C3.87224 22.3974 0.861328 19.3865 0.861328 15.6665C0.861328 11.9465 3.87224 8.93555 7.59224 8.93555C7.76679 8.93555 7.93042 8.94648 8.11588 8.95739C11.4213 9.2083 14.0613 11.8483 14.3122 15.1537C14.3122 15.3174 14.3231 15.4811 14.3231 15.6665Z"
        stroke="white"
        stroke-width="1.5"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M21.5778 8.40081C21.5778 12.1208 18.5669 15.1318 14.8469 15.1318H14.3123C14.0614 11.8263 11.4214 9.18626 8.11597 8.93535V8.40081C8.11597 4.68081 11.1269 1.66992 14.8469 1.66992C18.5669 1.66992 21.5778 4.68081 21.5778 8.40081Z"
        fill="white"
        stroke-width="1.5"
        stroke-miterlimit="10"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const PoolPosition = () => {
  const { activeAccount } = useWallet();
  const navigate = useNavigate();
  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  const tokens: ARC200TokenI[] = useSelector(
    (state: RootState) => state.tokens.tokens
  );
  const pools: PoolI[] = useSelector((state: RootState) => state.pools.pools);

  const [positions, setPositions] = React.useState<PositionI[]>([]);
  React.useEffect(() => {
    if (!activeAccount) return;
    const { algodClient, indexerClient } = getAlgorandClients();
    (async () => {
      const positions = [];
      for (const pool of pools.slice(0, 5)) {
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
  }, [activeAccount, pools]);

  console.log("positions", positions);

  return (
    <YourLiquidityRoot className={isDarkTheme ? "dark" : "light"}>
      <HeadingRow className="heading-row">
        <SectionTitle>Your Liquidity</SectionTitle>
        <CreateTokenButton
          onClick={() => {
            navigate(`/pool/create`);
          }}
        >
          <CreateButtonInner>
            <CreateButtonLabel>Create pool</CreateButtonLabel>
            {<PoolIcon />}
          </CreateButtonInner>
        </CreateTokenButton>
      </HeadingRow>
      <Body>
        {positions.length > 0 ? (
          <Stack
            spacing={2}
            sx={{
              width: "100%",
            }}
          >
            {positions.map((position) => (
              <>
                <PoolCard
                  //key={p.poolId}
                  pool={position}
                  // tokA={
                  //   tokens?.find(
                  //     (t: ARC200TokenI) => t.tokenId === position.tokA
                  //   ) || ({} as ARC200TokenI)
                  //}
                  // tokB={
                  //   tokens?.find(
                  //     (t: ARC200TokenI) => t.tokenId === position.tokB
                  //   ) || ({} as ARC200TokenI)
                  // }
                  balance={(Number(position.balance) / 10 ** 6).toFixed(6)}
                />
                {/*<div
                  key={position.poolId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignSelf: "center",
                    width: "100%",
                    padding: "1px 0px",
                    alignItems: "baseline",
                    gap: "10px",
                  }}
                >
                  <div>
                    {tokenSymbol(
                      tokens.find((token) => token.tokenId === position.tokA),
                      true
                    )}
                    {" / "}
                    {tokenSymbol(
                      tokens.find((token) => token.tokenId === position.tokB),
                      true
                    )}
                  </div>
                  <div>{position.poolId}</div>
                  <div>{(Number(position.balance) / 10 ** 6).toFixed(6)}</div>
                  <div>
                    <Link to={`/pool/add?poolId=${position.poolId}`}>
                      <button>Add more</button>
                    </Link>
                    <Link to={`/pool/remove?poolId=${position.poolId}`}>
                      <button>Remove</button>
                    </Link>
                  </div>
                    </div>*/}
              </>
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
