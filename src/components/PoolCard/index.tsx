import styled from "@emotion/styled";
import React, { FC, useEffect, useMemo, useState } from "react";
import { RootState } from "../../store/store";
import { useDispatch, useSelector } from "react-redux";
import { ARC200TokenI, PoolI } from "../../types";
import { Link } from "react-router-dom";
import { tokenSymbol } from "../../utils/dex";
import { getToken, getTokens, updateToken } from "../../store/tokenSlice";
import { UnknownAction } from "@reduxjs/toolkit";
import { Skeleton } from "@mui/material";
import { CONTRACT, abi } from "ulujs";
import { getAlgorandClients } from "../../wallets";
import { TOKEN_WVOI1 } from "../../constants/tokens";
import BigNumber from "bignumber.js";
import { useWallet } from "@txnlab/use-wallet";

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
  events: [
    // Address, Bals, Bals, Bals
    {
      name: "SwapEvent",
      args: [
        { type: "address" },
        { type: "(uin256,uint256)" },
        { type: "(uin256,uint256)" },
        { type: "(uin256,uint256)" },
      ],
    },
  ],
};

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const PoolCardRoot = styled.div`
  display: flex;
  padding: var(--Spacing-700, 16px) var(--Spacing-600, 12px);
  flex-direction: column;
  align-items: flex-start;
  gap: var(--Spacing-600, 12px);
  align-self: stretch;
  border-radius: var(--Radius-500, 12px);
  border: 1px solid
    var(--Color-Neutral-Stroke-Primary, rgba(255, 255, 255, 0.2));
  background: var(--Color-Canvas-Transparent-white-900, #070709);
`;

const PoolCardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;
`;

const Col1 = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
`;

const Col1Row1 = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--Spacing-200, 4px);
`;

const PairInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`;

const PairIds = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
`;

const PairTokens = styled.div`
  display: flex;
  padding-bottom: var(--Spacing-400, 8px);
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid
    var(--Color-Neutral-Stroke-Primary, rgba(255, 255, 255, 0.2));
`;

const PairTokenLabel = styled.div`
  color: var(--Color-Neutral-Element-Primary, #fff);
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 15px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%; /* 18px */
  text-transform: uppercase;
`;

const Field = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
`;

const FieldLabel = styled.div`
  color: var(--Color-Neutral-Element-Secondary, #f6f6f8);
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 120%; /* 19.2px */
`;

const FieldValue = styled.div`
  color: var(--Color-Neutral-Element-Primary, #fff);
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 19.2px */
`;

const CryptoIconPlaceholder = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 8C0 3.58172 3.58172 0 8 0H16C20.4183 0 24 3.58172 24 8V16C24 20.4183 20.4183 24 16 24H8C3.58172 24 0 20.4183 0 16V8Z"
        fill="#141010"
      />
      <path
        d="M0.5 8C0.5 3.85786 3.85786 0.5 8 0.5H16C20.1421 0.5 23.5 3.85786 23.5 8V16C23.5 20.1421 20.1421 23.5 16 23.5H8C3.85786 23.5 0.5 20.1421 0.5 16V8Z"
        stroke="white"
        stroke-opacity="0.7"
      />
      <path
        d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z"
        fill="white"
        fill-opacity="0.01"
      />
      <g clip-path="url(#clip0_390_19487)">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M8.61872 3.38128C8.96043 3.72299 8.96043 4.27701 8.61872 4.61872L4.61872 8.61872C4.27701 8.96043 3.72299 8.96043 3.38128 8.61872C3.03957 8.27701 3.03957 7.72299 3.38128 7.38128L7.38128 3.38128C7.72299 3.03957 8.27701 3.03957 8.61872 3.38128ZM14.6187 3.38128C14.9604 3.72299 14.9604 4.27701 14.6187 4.61872L4.61872 14.6187C4.27701 14.9604 3.72299 14.9604 3.38128 14.6187C3.03957 14.277 3.03957 13.723 3.38128 13.3813L13.3813 3.38128C13.723 3.03957 14.277 3.03957 14.6187 3.38128ZM20.6187 3.38128C20.9604 3.72299 20.9604 4.27701 20.6187 4.61872L4.61872 20.6187C4.27701 20.9604 3.72299 20.9604 3.38128 20.6187C3.03957 20.277 3.03957 19.723 3.38128 19.3813L19.3813 3.38128C19.723 3.03957 20.277 3.03957 20.6187 3.38128ZM20.6187 9.38128C20.9604 9.72299 20.9604 10.277 20.6187 10.6187L10.6187 20.6187C10.277 20.9604 9.72299 20.9604 9.38128 20.6187C9.03957 20.277 9.03957 19.723 9.38128 19.3813L19.3813 9.38128C19.723 9.03957 20.277 9.03957 20.6187 9.38128ZM20.6187 15.3813C20.9604 15.723 20.9604 16.277 20.6187 16.6187L16.6187 20.6187C16.277 20.9604 15.723 20.9604 15.3813 20.6187C15.0396 20.277 15.0396 19.723 15.3813 19.3813L19.3813 15.3813C19.723 15.0396 20.277 15.0396 20.6187 15.3813Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_390_19487">
          <rect
            width="16"
            height="16"
            fill="white"
            transform="translate(4 4)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

const PlaceHolderIcon = () => {
  return (
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
        fill="#F6F6F8"
      />
    </svg>
  );
};

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

const PairIconPlaceholder = () => {
  return (
    <svg
      width="56"
      height="32"
      viewBox="0 0 56 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="16" fill="#FF6438" />
      <path
        d="M4 16C4 12.2725 4 10.4087 4.60896 8.93853C5.42092 6.97831 6.97831 5.42092 8.93853 4.60896C10.4087 4 12.2725 4 16 4C19.7275 4 21.5913 4 23.0615 4.60896C25.0217 5.42092 26.5791 6.97831 27.391 8.93853C28 10.4087 28 12.2725 28 16C28 19.7275 28 21.5913 27.391 23.0615C26.5791 25.0217 25.0217 26.5791 23.0615 27.391C21.5913 28 19.7275 28 16 28C12.2725 28 10.4087 28 8.93853 27.391C6.97831 26.5791 5.42092 25.0217 4.60896 23.0615C4 21.5913 4 19.7275 4 16Z"
        fill="white"
        fill-opacity="0.01"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M12.6187 7.38128C12.9604 7.72299 12.9604 8.27701 12.6187 8.61872L8.61872 12.6187C8.27701 12.9604 7.72299 12.9604 7.38128 12.6187C7.03957 12.277 7.03957 11.723 7.38128 11.3813L11.3813 7.38128C11.723 7.03957 12.277 7.03957 12.6187 7.38128ZM18.6187 7.38128C18.9604 7.72299 18.9604 8.27701 18.6187 8.61872L8.61872 18.6187C8.27701 18.9604 7.72299 18.9604 7.38128 18.6187C7.03957 18.277 7.03957 17.723 7.38128 17.3813L17.3813 7.38128C17.723 7.03957 18.277 7.03957 18.6187 7.38128ZM24.6187 7.38128C24.9604 7.72299 24.9604 8.27701 24.6187 8.61872L8.61872 24.6187C8.27701 24.9604 7.72299 24.9604 7.38128 24.6187C7.03957 24.277 7.03957 23.723 7.38128 23.3813L23.3813 7.38128C23.723 7.03957 24.277 7.03957 24.6187 7.38128ZM24.6187 13.3813C24.9604 13.723 24.9604 14.277 24.6187 14.6187L14.6187 24.6187C14.277 24.9604 13.723 24.9604 13.3813 24.6187C13.0396 24.277 13.0396 23.723 13.3813 23.3813L23.3813 13.3813C23.723 13.0396 24.277 13.0396 24.6187 13.3813ZM24.6187 19.3813C24.9604 19.723 24.9604 20.277 24.6187 20.6187L20.6187 24.6187C20.277 24.9604 19.723 24.9604 19.3813 24.6187C19.0396 24.277 19.0396 23.723 19.3813 23.3813L23.3813 19.3813C23.723 19.0396 24.277 19.0396 24.6187 19.3813Z"
        fill="#F6F6F8"
      />
      <rect x="24" width="32" height="32" rx="16" fill="#FFBE1D" />
      <path
        d="M28 16C28 12.2725 28 10.4087 28.609 8.93853C29.4209 6.97831 30.9783 5.42092 32.9385 4.60896C34.4087 4 36.2725 4 40 4C43.7275 4 45.5913 4 47.0615 4.60896C49.0217 5.42092 50.5791 6.97831 51.391 8.93853C52 10.4087 52 12.2725 52 16C52 19.7275 52 21.5913 51.391 23.0615C50.5791 25.0217 49.0217 26.5791 47.0615 27.391C45.5913 28 43.7275 28 40 28C36.2725 28 34.4087 28 32.9385 27.391C30.9783 26.5791 29.4209 25.0217 28.609 23.0615C28 21.5913 28 19.7275 28 16Z"
        fill="white"
        fill-opacity="0.01"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M36.6187 7.38128C36.9604 7.72299 36.9604 8.27701 36.6187 8.61872L32.6187 12.6187C32.277 12.9604 31.723 12.9604 31.3813 12.6187C31.0396 12.277 31.0396 11.723 31.3813 11.3813L35.3813 7.38128C35.723 7.03957 36.277 7.03957 36.6187 7.38128ZM42.6187 7.38128C42.9604 7.72299 42.9604 8.27701 42.6187 8.61872L32.6187 18.6187C32.277 18.9604 31.723 18.9604 31.3813 18.6187C31.0396 18.277 31.0396 17.723 31.3813 17.3813L41.3813 7.38128C41.723 7.03957 42.277 7.03957 42.6187 7.38128ZM48.6187 7.38128C48.9604 7.72299 48.9604 8.27701 48.6187 8.61872L32.6187 24.6187C32.277 24.9604 31.723 24.9604 31.3813 24.6187C31.0396 24.277 31.0396 23.723 31.3813 23.3813L47.3813 7.38128C47.723 7.03957 48.277 7.03957 48.6187 7.38128ZM48.6187 13.3813C48.9604 13.723 48.9604 14.277 48.6187 14.6187L38.6187 24.6187C38.277 24.9604 37.723 24.9604 37.3813 24.6187C37.0396 24.277 37.0396 23.723 37.3813 23.3813L47.3813 13.3813C47.723 13.0396 48.277 13.0396 48.6187 13.3813ZM48.6187 19.3813C48.9604 19.723 48.9604 20.277 48.6187 20.6187L44.6187 24.6187C44.277 24.9604 43.723 24.9604 43.3813 24.6187C43.0396 24.277 43.0396 23.723 43.3813 23.3813L47.3813 19.3813C47.723 19.0396 48.277 19.0396 48.6187 19.3813Z"
        fill="#F6F6F8"
      />
    </svg>
  );
};

const PairInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`;

const Col2 = styled.div`
  display: flex;
  height: 32px;
  padding: var(--Spacing-400, 8px) 0px;
  align-items: baseline;
  gap: 10px;
`;

const TVLLabel = styled.div`
  color: var(--Color-Neutral-Element-Primary, #fff);
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 16.8px */
`;

const VolumeLabel = styled.div`
  color: var(--Color-Neutral-Element-Primary, #fff);
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 16.8px */
`;

const APRLabel = styled.div`
  color: var(--Color-Neutral-Element-Primary, #fff);
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "IBM Plex Sans Condensed";
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 16.8px */
`;

const Col3 = styled.div`
  display: flex;
  padding: 11px 0px var(--Spacing-400, 8px) 0px;
  flex-direction: column;
  align-items: baseline;
  gap: 8px;
`;

const Col4 = styled.div`
  display: flex;
  padding: var(--Spacing-600, 12px) 0px var(--Spacing-400, 8px) 0px;
  flex-direction: column;
  justify-content: center;
  align-items: baseline;
  gap: 8px;
`;

const APRLabelContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const Col5 = styled.div`
  display: flex;
  height: 65px;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--Spacing-200, 4px);
`;

const Button = styled.div`
  cursor: pointer;
`;

const AddButton = styled(Button)`
  display: flex;
  padding: var(--Spacing-400, 8px) var(--Spacing-600, 12px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  border-radius: var(--Radius-300, 8px);
  border: 1px solid
    var(--Color-Accent-Secondary-Stroke-Base, rgba(255, 255, 255, 0.7));
  background: var(--Color-Accent-Secondary-Background-Default, #141010);
`;

const ButtonLabelContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const AddButtonLabel = styled.div`
  color: var(--Color-Neutral-Element-Secondary, #f6f6f8);
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "Plus Jakarta Sans";
  font-size: 15px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%; /* 18px */
`;

const SwapButton = styled(Button)`
  display: flex;
  padding: var(--Spacing-400, 8px) var(--Spacing-600, 12px);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-radius: var(--Radius-300, 8px);
  background: var(--Color-Accent-CTA-Background-Default, #2958ff);
`;

const SwapButtonLabel = styled.div`
  color: var(--Color-Brand-White, #fff);
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "Plus Jakarta Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%; /* 16.8px */
`;

interface PoolCardProps {
  pool: PoolI;
  balance?: string;
  tvl?: string;
}
const PoolCard: FC<PoolCardProps> = ({ pool, balance }) => {
  const { activeAccount } = useWallet();
  const [tokA, setTokA] = useState<ARC200TokenI>();
  const [tokB, setTokB] = useState<ARC200TokenI>();
  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  const dispatch = useDispatch();
  // EFFECT: Fetch token A
  useEffect(() => {
    if (!tokA?.tokenId) {
      getToken(pool.tokA).then((token) => {
        setTokA(token);
        dispatch(updateToken(token) as unknown as UnknownAction);
      });
    }
  }, [dispatch]);
  // EFFECT: Fetch token B
  useEffect(() => {
    if (!tokB?.tokenId) {
      getToken(pool.tokB).then((token) => {
        setTokB(token);
        dispatch(updateToken(token) as unknown as UnknownAction);
      });
    }
  }, [dispatch]);

  const pools = useSelector((state: RootState) => state.pools.pools);

  const poolBals = useSelector(
    (state: RootState) => state.poolBals.poolBals
  ).filter((p) => p.poolId === pool.poolId);

  const volume = useSelector(
    (state: RootState) => state.volumes.volumes
  ).filter((v) => v.poolId === pool.poolId);

  const [info, setInfo] = useState<any>();
  const [infoA, setInfoA] = useState<any>();
  const [infoB, setInfoB] = useState<any>();
  const getInfo = (poolId: number) => {
    const { algodClient, indexerClient } = getAlgorandClients();
    const ci = new CONTRACT(poolId, algodClient, indexerClient, spec, {
      addr: "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
      sk: new Uint8Array(0),
    });
    return ci.Info();
  };
  // EFFECT get pool info
  useEffect(() => {
    // const { algodClient, indexerClient } = getAlgorandClients();
    // const ci = new CONTRACT(pool.poolId, algodClient, indexerClient, spec, {
    //   addr: "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
    //   sk: new Uint8Array(0),
    // });
    // ci.Info();
    const infoP = getInfo(pool.poolId);
    infoP.then((info: any) => {
      if (info.success) {
        const [lptBals, poolBals, protoInfo, protoBals, tokB, tokA] =
          info.returnValue;
        setInfo({
          lptBals,
          poolBals,
          protoInfo,
          protoBals,
          tokB: Number(tokB),
          tokA: Number(tokA),
        });
      }
    });
    if (![pool.tokA, pool.tokB].includes(TOKEN_WVOI1)) {
      const poolsA = pools.filter(
        (p) =>
          (p.tokA === TOKEN_WVOI1 && p.tokB === pool.tokA) ||
          (p.tokA === pool.tokA && p.tokB === TOKEN_WVOI1)
      );
      const poolsB = pools.filter(
        (p) =>
          (p.tokA === TOKEN_WVOI1 && p.tokB === pool.tokB) ||
          (p.tokA === pool.tokB && p.tokB === TOKEN_WVOI1)
      );
      // select 1 from each
      const poolA = poolsA.pop();
      const poolB = poolsB.pop();
      if (poolA) {
        const infoAP = getInfo(poolA.poolId);
        infoAP.then((info: any) => {
          if (info.success) {
            const [lptBals, poolBals, protoInfo, protoBals, tokB, tokA] =
              info.returnValue;
            setInfoA({
              lptBals,
              poolBals,
              protoInfo,
              protoBals,
              tokB: Number(tokB),
              tokA: Number(tokA),
            });
          }
        });
      }
      if (poolB) {
        const infoBP = getInfo(poolB.poolId);
        infoBP.then((info: any) => {
          if (info.success) {
            const [lptBals, poolBals, protoInfo, protoBals, tokB, tokA] =
              info.returnValue;
            setInfoB({
              lptBals,
              poolBals,
              protoInfo,
              protoBals,
              tokB: Number(tokB),
              tokA: Number(tokA),
            });
          }
        });
      }
    }
  }, []);

  const totalVolumeBn = useMemo(() => {
    if (!volume || !info || !tokA || !tokB) return new BigNumber(0);
    const totalA = volume
      .reduce((acc, v) => acc.plus(new BigNumber(v.inA)), new BigNumber(0))
      .div(new BigNumber(10).pow(tokA.decimals));
    const totalB = volume
      .reduce((acc, v) => acc.plus(new BigNumber(v.inB)), new BigNumber(0))
      .div(new BigNumber(10).pow(tokB.decimals));
    const rate = new BigNumber(info.poolBals[0])
      .multipliedBy(new BigNumber(10).pow(tokB.decimals))
      .div(
        new BigNumber(info.poolBals[1]).multipliedBy(
          new BigNumber(10).pow(tokA.decimals)
        )
      );
    return totalA.plus(totalB.times(rate));
  }, [volume, info, tokA, tokB]);

  const totalVolume = useMemo(() => {
    if (!totalVolumeBn) return "";
    return new Intl.NumberFormat("en", { notation: "compact" }).format(
      totalVolumeBn.toNumber()
    );
  }, [totalVolumeBn]);

  const symbolA = tokA?.symbol ? tokenSymbol(tokA, true) : "...";
  const symbolB = tokB?.symbol ? tokenSymbol(tokB, true) : "...";

  // case 1 is voi pool
  // case 2 is not voi pool but each token has voi pool
  // case 3 is not voi pool but one token has voi pool
  // case 4 is not voi pool and nether token has voi pool
  const tvlBn = useMemo(() => {
    if (!info || !tokA || !tokB) return new BigNumber(0);

    // case 1
    if (
      [tokA, tokB].map((t: ARC200TokenI) => t.tokenId).includes(TOKEN_WVOI1)
    ) {
      // tvl
      if (info.tokA === TOKEN_WVOI1) {
        return new BigNumber(info.poolBals[0])
          .multipliedBy(2)
          .div(new BigNumber(10).pow(tokA.decimals));
      } else if (info.tokB === TOKEN_WVOI1) {
        return new BigNumber(info.poolBals[1])
          .multipliedBy(2)
          .div(new BigNumber(10).pow(tokB.decimals));
      }
    }
    // case 2, 3, 4
    else {
      //if (!infoA || !infoB) return;

      const isNTPool = (info: any) =>
        [info?.tokA, info?.tokB].includes(TOKEN_WVOI1);

      const isANTPool = isNTPool(infoA);
      const isBNTPool = isNTPool(infoB);

      console.log(isANTPool, isBNTPool);

      // case 2
      if (isANTPool && isBNTPool) {
        // tokA tvl
        let rateA = new BigNumber(1);
        if (infoA.tokA === TOKEN_WVOI1) {
          const balA = new BigNumber(infoA.poolBals[0]).dividedBy(
            new BigNumber(10).pow(6)
          );
          const balB = new BigNumber(infoA.poolBals[1]).dividedBy(
            new BigNumber(10).pow(tokA.decimals)
          );
          rateA = balA.dividedBy(balB);
        } else if (infoA.tokB === TOKEN_WVOI1) {
          const balA = new BigNumber(infoA.poolBals[0]).dividedBy(
            new BigNumber(10).pow(tokA.decimals)
          );
          const balB = new BigNumber(infoA.poolBals[1]).dividedBy(
            new BigNumber(10).pow(6)
          );
          rateA = balB.dividedBy(balA);
        }
        // tokB tvl
        let rateB = new BigNumber(1);
        if (infoB.tokA === TOKEN_WVOI1) {
          const balA = new BigNumber(infoB.poolBals[0]).dividedBy(
            new BigNumber(10).pow(6)
          );
          const balB = new BigNumber(infoB.poolBals[1]).dividedBy(
            new BigNumber(10).pow(tokB.decimals)
          );
          rateB = balA.dividedBy(balB);
        } else if (infoB.tokB === TOKEN_WVOI1) {
          const balA = new BigNumber(infoB.poolBals[0]).dividedBy(
            new BigNumber(10).pow(tokB.decimals)
          );
          const balB = new BigNumber(infoB.poolBals[1]).dividedBy(
            new BigNumber(10).pow(6)
          );
          rateB = balB.dividedBy(balA);
        }
        const balA = new BigNumber(info.poolBals[0]).dividedBy(
          new BigNumber(10).pow(tokA.decimals)
        );
        const balB = new BigNumber(info.poolBals[1]).dividedBy(
          new BigNumber(10).pow(tokB.decimals)
        );
        return balA.multipliedBy(rateA).plus(balB.multipliedBy(rateB));
      }
      // case 3
      else if ((!isANTPool && isBNTPool) || (isANTPool && !isBNTPool)) {
        if (isANTPool) {
          const balA2 = new BigNumber(info.poolBals[0]).dividedBy(
            new BigNumber(10).pow(tokA.decimals)
          );
          let rate;
          if ([TOKEN_WVOI1].includes(infoA.tokA)) {
            const balA = new BigNumber(infoA.poolBals[0]).dividedBy(
              new BigNumber(10).pow(6)
            );
            const balB = new BigNumber(infoA.poolBals[1]).dividedBy(
              new BigNumber(10).pow(tokA.decimals)
            );
            rate = balA.dividedBy(balB);
          }
          // [TOKEN_WVOI1].includes(infoA.tokB)
          else {
            const balA = new BigNumber(infoA.poolBals[0]).dividedBy(
              new BigNumber(10).pow(tokA.decimals)
            );
            const balB = new BigNumber(infoA.poolBals[1]).dividedBy(
              new BigNumber(10).pow(6)
            );
            rate = balB.dividedBy(balA);
          }
          return balA2.multipliedBy(rate)//.multipliedBy(2);
        }
        // isBNTPool
        else {
          const balA2 = new BigNumber(info.poolBals[1]).dividedBy(
            new BigNumber(10).pow(tokB.decimals)
          );
          let rate;
          if ([TOKEN_WVOI1].includes(infoB.tokA)) {
            const balA = new BigNumber(infoB.poolBals[0]).dividedBy(
              new BigNumber(10).pow(6)
            );
            const balB = new BigNumber(infoB.poolBals[1]).dividedBy(
              new BigNumber(10).pow(tokB.decimals)
            );
            rate = balA.dividedBy(balB);
          }
          // [TOKEN_WVOI1].includes(infoA.tokB)
          else {
            const balA = new BigNumber(infoB.poolBals[0]).dividedBy(
              new BigNumber(10).pow(tokB.decimals)
            );
            const balB = new BigNumber(infoB.poolBals[1]).dividedBy(
              new BigNumber(10).pow(6)
            );
            rate = balB.dividedBy(balA);
          }
          return balA2.multipliedBy(rate)//.multipliedBy(2);
        }
      }
      // case 4
      else {
        return new BigNumber(0);
      }
    }
  }, [tokA, tokB, info, infoA, infoB, pools]);

  const tvl = useMemo(() => {
    if (!tvlBn) return "";
    return new Intl.NumberFormat("en", { notation: "compact" }).format(
      tvlBn.toNumber()
    );
  }, [tvlBn]);

  // apr
  // anualizedFee / tvl * 100
  const apr = useMemo(() => {
    if (!totalVolumeBn || !tvlBn) return "";
    const weeks = 52;
    // anualizedFee
    // tv * (30/10000) * 52
    const annualizedFee = totalVolumeBn.multipliedBy(30 * weeks).div(10_000);
    const aprBn = annualizedFee.multipliedBy(100).div(tvlBn);
    return aprBn.toFixed(2);
  }, [totalVolumeBn, tvlBn]);
  const [value, setValue] = useState("0");
  useEffect(() => {
    if (!poolBals || poolBals.length === 0 || !balance) return;
    // get most recent pool balance
    const poolBal = poolBals[poolBals.length - 1];
    const value = new BigNumber(balance).multipliedBy(
      new BigNumber(poolBal.rate)
    );
    setValue(
      new Intl.NumberFormat("en", { notation: "compact" }).format(
        value.toNumber()
      )
    );
  }, [poolBals, balance]);
  useEffect(() => {
    if (!info || !tokA || !tokB || !activeAccount || !balance) return;
    if (
      [tokA, tokB].map((t: ARC200TokenI) => t.tokenId).includes(TOKEN_WVOI1)
    ) {
      if (info.tokA === TOKEN_WVOI1) {
        const aValue = new BigNumber(info.poolBals[0]).div(
          new BigNumber(10).pow(tokA.decimals)
        );
        const bValue = new BigNumber(info.poolBals[1]).div(
          new BigNumber(10).pow(tokB.decimals)
        );
        const rate = aValue.div(bValue);
        const { algodClient, indexerClient } = getAlgorandClients();
        const ci = new CONTRACT(
          pool.poolId,
          algodClient,
          indexerClient,
          abi.arc200,
          {
            addr: activeAccount.address,
            sk: new Uint8Array(0),
          }
        );
        ci.arc200_balanceOf(activeAccount.address).then((balance: any) => {
          if (balance.success) {
            const ci = new CONTRACT(
              pool.poolId,
              algodClient,
              indexerClient,
              spec,
              {
                addr: "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
                sk: new Uint8Array(0),
              }
            );
            ci.setFee(2000);
            ci.Provider_withdraw(1, balance.returnValue, [0, 0]).then(
              (withdraw: any) => {
                if (withdraw.success) {
                  const balA = new BigNumber(withdraw.returnValue[0]).div(
                    new BigNumber(10).pow(tokA.decimals)
                  );
                  const balB = new BigNumber(withdraw.returnValue[1]).div(
                    new BigNumber(10).pow(tokB.decimals)
                  );
                  const value = balA.plus(balB.times(rate));
                  setValue(
                    new Intl.NumberFormat("en", { notation: "compact" }).format(
                      value.toNumber()
                    )
                  );
                }
              }
            );
          }
        });
      } else if (info.tokB === TOKEN_WVOI1) {
        // TODO in case tokB is wvoi
      }
    } else {
      // TODO in case neither is wvoi
    }
  }, [info, tokA, tokB, activeAccount]);
  return (
    <PoolCardRoot className={isDarkTheme ? "dark" : "light"}>
      <PoolCardRow>
        <Col1>
          <Col1Row1>
            <PairIconPlaceholder />
            <PairInfoContainer>
              <PairInfo>
                <PairTokens>
                  <PairTokenLabel>{symbolA}</PairTokenLabel>
                  <CryptoIconPlaceholder />
                  <PairTokenLabel>/ {symbolB}</PairTokenLabel>
                  <CryptoIconPlaceholder />
                </PairTokens>
              </PairInfo>
              <PairIds>
                <Field>
                  <FieldLabel>ID:</FieldLabel>
                  <FieldValue>{pool.tokA}</FieldValue>
                </Field>
                <Field>
                  <FieldLabel>ID:</FieldLabel>
                  <FieldValue>{pool.tokB}</FieldValue>
                </Field>
              </PairIds>
            </PairInfoContainer>
          </Col1Row1>
        </Col1>
        {balance ? (
          <>
            <Col2>
              <TVLLabel>&nbsp;</TVLLabel>
            </Col2>
            <Col3>
              <VolumeLabel>&nbsp;</VolumeLabel>
            </Col3>
            <Col4>
              <APRLabelContainer>
                <APRLabel
                  style={{
                    textAlign: "right",
                  }}
                >
                  {balance || ""}
                  <br />
                  {value !== "0" ? `≈${value} VOI` : ""}
                </APRLabel>
              </APRLabelContainer>
            </Col4>
            <Col5>
              <StyledLink
                to={`/pool/add?poolId=${pool.poolId}`}
                style={{
                  width: "100%",
                }}
              >
                <AddButton>
                  <ButtonLabelContainer>
                    <AddButtonLabel>Add</AddButtonLabel>
                  </ButtonLabelContainer>
                </AddButton>
              </StyledLink>
              <StyledLink to={`/pool/remove?poolId=${pool.poolId}`}>
                <SwapButton>
                  <ButtonLabelContainer>
                    <SwapButtonLabel>Remove</SwapButtonLabel>
                  </ButtonLabelContainer>
                </SwapButton>
              </StyledLink>
            </Col5>
          </>
        ) : (
          <>
            <Col3>
              <TVLLabel>{tvl} VOI</TVLLabel>
            </Col3>
            <Col3>
              <VolumeLabel>{totalVolume} VOI</VolumeLabel>
            </Col3>
            <Col4>
              <APRLabelContainer>
                <APRLabel>{apr}%</APRLabel>
              </APRLabelContainer>
            </Col4>
            <Col5>
              <StyledLink
                to={`/pool/add?poolId=${pool.poolId}`}
                style={{
                  width: "100%",
                }}
              >
                <AddButton>
                  <ButtonLabelContainer>
                    <AddButtonLabel>Add</AddButtonLabel>
                  </ButtonLabelContainer>
                </AddButton>
              </StyledLink>
              <StyledLink to={`/swap?poolId=${pool.poolId}`}>
                <SwapButton>
                  <ButtonLabelContainer>
                    <SwapButtonLabel>Swap</SwapButtonLabel>
                  </ButtonLabelContainer>
                </SwapButton>
              </StyledLink>
            </Col5>
          </>
        )}
      </PoolCardRow>
    </PoolCardRoot>
  );
};

export default PoolCard;
