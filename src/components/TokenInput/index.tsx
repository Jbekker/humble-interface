import styled from "@emotion/styled";
import React, { FC } from "react";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";
import TokenSelect from "../TokenSelect";

const MaxButton = styled.div`
  display: flex;
  padding: 6px;
  justify-content: center;
  align-items: flex-end;
  gap: 10px;
  border-radius: 5px;
  &.light {
    background: var(--Color-Brand-Background-Primary-100, #d4a0ff);
  }
  &.dark {
    background: var(--Color-Brand-Background-Primary-100, #f1eafc);
  }
`;

const MaxButtonLabel = styled.div`
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  line-height: 120%; /* 14.4px */
  cursor: pointer;
  color: var(--Color-Brand-Pure-Black, #000);
`;

const SwapTokenContainer = styled.div`
  display: flex;
  padding: var(--Spacing-800, 24px) var(--Spacing-900, 32px);
  flex-direction: column;
  align-items: flex-start;
  gap: var(--Spacing-700, 16px);
  align-self: stretch;
  border-radius: var(--Radius-800, 24px);
  &.light {
    background: var(--Color-Brand-Background-Primary-30, #f1eafc);
  }
  &.dark {
    background: var(--Color-Brand-Background-Primary-30, #291c47);
  }
`;

const SwapTokenLabel = styled.div`
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  /* Body/Title 1 */
  font-family: "IBM Plex Sans Condensed";
  font-size: 15px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%; /* 18px */
  &.light {
    color: var(--Color-Neutral-Element-Primary, #0c0c10);
  }
  &.dark {
    color: var(--Color-Neutral-Element-Primary, #fff);
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;
`;

const Row1 = styled(Row)`
  padding-bottom: 6px;
  &.light {
    border-bottom: 1px solid var(--Color-Neutral-Stroke-Primary, #d8d8e1);
  }
  &.dark {
    border-bottom: 1px solid
      var(--Color-Neutral-Stroke-Primary, rgba(255, 255, 255, 0.2));
  }
  @media screen and (max-width: 600px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const Row2 = styled(Row)`
  align-items: center;
`;

const TokenContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
`;

const TokenRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
`;

const TokenLogo = styled.div`
  display: flex;
  padding: 4px;
  align-items: center;
  gap: 10px;
  border-radius: 50px;
  background: var(--Color-Brand-Amber, #ffbe1d);
`;

const Logo = styled.div`
  display: flex;
  width: 24px;
  height: 24px;
  justify-content: center;
  align-items: center;
  border-radius: var(--Radius-300, 8px);
  background: var(
    --Color-Neutral-Background-Transparent,
    rgba(255, 255, 255, 0)
  );
`;

const TokenButtonContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
`;

const TokenButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
`;

const TokenLabel = styled.div`
  font-feature-settings: "clig" off, "liga" off;
  /* Body/Small */
  font-family: "IBM Plex Sans Condensed";
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%; /* 12px */
  &.light {
    color: var(--Brand-Black, #000);
  }
  &.dark {
    color: var(--Color-Neutral-Element-Primary, #fff);
  }
`;

const TokenIdContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const TokenIdLabel = styled.div`
  font-feature-settings: "clig" off, "liga" off;
  /* Body/P medium */
  font-family: "IBM Plex Sans Condensed";
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 14.4px */
  &.light {
    color: var(--Brand-Black, #000);
  }
  &.dark {
    color: var(--Color-Neutral-Element-Primary, #fff);
  }
`;

const TokenInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`;

const TokenInput = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--Spacing-400, 8px);
  width: 318px;
  @media screen and (max-width: 400px) {
    width: 280px;
  }
`;

const TokenInputContainer = styled.div`
  display: flex;
  padding: 13px var(--Spacing-600, 12px);
  align-items: center;
  gap: var(--Spacing-400, 8px);
  align-self: stretch;
  border-radius: var(--Radius-300, 8px);
  background: var(
    --Color-Comp-Input-Background-Default,
    rgba(255, 255, 255, 0)
  );
  &.light {
    border: 1.5px solid
      var(--Color-Neutral-Stroke-Primary-Static-Contrast, #7e7e9a);
  }
  &.dark {
    border: 1.5px solid
      var(
        --Color-Neutral-Stroke-Primary-Static-Contrast,
        rgba(255, 255, 255, 0.5)
      );
  }
  & input {
    color: var(--Color-Neutral-Element-Secondary, #f6f6f8);
  }
  &.has-value.dark {
    border: 2px solid var(--Color-Neutral-Stroke-Black, #fff);
  }
  &.has-value.light {
    border: 2px solid var(--Color-Neutral-Stroke-Black, #141010);
  }
  &.has-value {
    background: var(--Color-Neutral-Background-Base-Static-Contrast, #fff);
    & input {
      color: var(--Color-Neutral-Element-Secondary-Static-Contrast, #565e6e);
    }
  }
`;

const Input = styled.input`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  flex: 1 0 0;
  overflow: hidden;
  text-align: right;
  font-feature-settings: "clig" off, "liga" off;
  text-overflow: ellipsis;
  font-family: "Plus Jakarta Sans";
  font-size: 18px;
  font-style: normal;
  font-weight: 700;
  line-height: 120%; /* 21.6px */
  &.light {
    color: var(--Color-Neutral-Element-Secondary, #56566e);
    &::placeholder {
      color: var(--Color-Neutral-Element-Secondary, #56566e);
    }
  }
  &.dark {
    color: var(--Color-Neutral-Element-Secondary, #f6f6f8);
    &::placeholder {
      color: var(--Color-Neutral-Element-Secondary, #f6f6f8);
    }
  }
`;

const InputValueHelperText = styled.div`
  text-align: right;
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 15px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%; /* 18px */
  &.light {
    color: var(--Color-Neutral-Element-Secondary, #56566e);
  }
  &.dark {
    color: var(--Color-Neutral-Element-Secondary, #f6f6f8);
  }
`;

const BalanceContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
`;

const BalanceLabel = styled.div`
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%; /* 14.4px */
  &.light {
    color: var(--Color-Neutral-Element-Secondary, #56566e);
  }
  &.dark {
    color: var(--Color-Neutral-Element-Secondary, #f6f6f8);
  }
`;

const BalanceValue = styled.div`
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%; /* 14.4px */
  &.light {
    color: var(--Color-Neutral-Element-Primary, #0c0c10);
  }
  &.dark {
    color: var(--Color-Neutral-Element-Primary, #fff);
  }
`;

const WalletIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M8.66663 7.43335H4.66663"
        stroke="#292D32"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M1.33337 7.43331V4.35331C1.33337 2.99331 2.43338 1.89331 3.79338 1.89331H7.54004C8.90004 1.89331 10 2.73998 10 4.09998"
        stroke="#292D32"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M11.6534 8.13318C11.32 8.45318 11.16 8.9465 11.2934 9.45317C11.46 10.0732 12.0734 10.4665 12.7134 10.4665H13.3334V11.4332C13.3334 12.9065 12.14 14.0999 10.6667 14.0999H4.00004C2.52671 14.0999 1.33337 12.9065 1.33337 11.4332V6.76652C1.33337 5.29319 2.52671 4.09985 4.00004 4.09985H10.6667C12.1334 4.09985 13.3334 5.29985 13.3334 6.76652V7.73315H12.6134C12.24 7.73315 11.9 7.87985 11.6534 8.13318Z"
        stroke="#292D32"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M14.6666 8.41341V9.78674C14.6666 10.1601 14.3599 10.4668 13.9799 10.4668H12.6933C11.9733 10.4668 11.3133 9.94009 11.2533 9.22009C11.2133 8.80009 11.3733 8.40676 11.6533 8.13342C11.8999 7.88009 12.2399 7.7334 12.6133 7.7334H13.9799C14.3599 7.7334 14.6666 8.04008 14.6666 8.41341Z"
        stroke="#292D32"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

interface SwapProps {
  label: string;
  amount: string;
  setAmount: (amount: string) => void;
}
const Swap: FC<SwapProps> = ({ label, amount, setAmount }) => {
  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  return (
    <SwapTokenContainer className={isDarkTheme ? "dark" : "light"}>
      <SwapTokenLabel className={isDarkTheme ? "dark" : "light"}>
        {label}
      </SwapTokenLabel>
      <Row1 className={isDarkTheme ? "dark" : "light"}>
        <TokenContainer>
          <TokenRow>
            <TokenLogo>
              <Logo>
                {/* placeholder crypto icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M8.61872 3.38128C8.96043 3.72299 8.96043 4.27701 8.61872 4.61872L4.61872 8.61872C4.27701 8.96043 3.72299 8.96043 3.38128 8.61872C3.03957 8.27701 3.03957 7.72299 3.38128 7.38128L7.38128 3.38128C7.72299 3.03957 8.27701 3.03957 8.61872 3.38128ZM14.6187 3.38128C14.9604 3.72299 14.9604 4.27701 14.6187 4.61872L4.61872 14.6187C4.27701 14.9604 3.72299 14.9604 3.38128 14.6187C3.03957 14.277 3.03957 13.723 3.38128 13.3813L13.3813 3.38128C13.723 3.03957 14.277 3.03957 14.6187 3.38128ZM20.6187 3.38128C20.9604 3.72299 20.9604 4.27701 20.6187 4.61872L4.61872 20.6187C4.27701 20.9604 3.72299 20.9604 3.38128 20.6187C3.03957 20.277 3.03957 19.723 3.38128 19.3813L19.3813 3.38128C19.723 3.03957 20.277 3.03957 20.6187 3.38128ZM20.6187 9.38128C20.9604 9.72299 20.9604 10.277 20.6187 10.6187L10.6187 20.6187C10.277 20.9604 9.72299 20.9604 9.38128 20.6187C9.03957 20.277 9.03957 19.723 9.38128 19.3813L19.3813 9.38128C19.723 9.03957 20.277 9.03957 20.6187 9.38128ZM20.6187 15.3813C20.9604 15.723 20.9604 16.277 20.6187 16.6187L16.6187 20.6187C16.277 20.9604 15.723 20.9604 15.3813 20.6187C15.0396 20.277 15.0396 19.723 15.3813 19.3813L19.3813 15.3813C19.723 15.0396 20.277 15.0396 20.6187 15.3813Z"
                    fill="#56566E"
                  />
                </svg>
              </Logo>
            </TokenLogo>
            <TokenButtonContainer>
              <TokenButtonWrapper>
                <TokenSelect />
                <TokenLabel className={isDarkTheme ? "dark" : "light"}>
                  Algorand
                </TokenLabel>
                <TokenIdContainer>
                  <TokenIdLabel>ID: 0</TokenIdLabel>
                </TokenIdContainer>
              </TokenButtonWrapper>
            </TokenButtonContainer>
          </TokenRow>
        </TokenContainer>
        <TokenInputGroup>
          <TokenInput>
            <TokenInputContainer
              className={[
                isDarkTheme ? "dark" : "light",
                amount !== "" ? "has-value" : "has-placeholder",
              ].join(" ")}
            >
              <Input
                className={isDarkTheme ? "dark" : "light"}
                placeholder="0.00"
                onChange={(e) => setAmount(e.target.value)}
              />
            </TokenInputContainer>
          </TokenInput>
          <InputValueHelperText className={isDarkTheme ? "dark" : "light"}>
            ~ 0 ALGO
          </InputValueHelperText>
        </TokenInputGroup>
      </Row1>
      <Row2>
        <BalanceContainer>
          <WalletIcon />
          <BalanceLabel className={isDarkTheme ? "dark" : "light"}>
            Your balance:
          </BalanceLabel>
          <BalanceValue>0 ALGO</BalanceValue>
        </BalanceContainer>
        <MaxButton className={isDarkTheme ? "dark" : "light"}>
          <MaxButtonLabel>Max</MaxButtonLabel>
        </MaxButton>
      </Row2>
    </SwapTokenContainer>
  );
};

export default Swap;
