import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../layouts/Default";
import Section from "../../components/Section";
import { Grid, Skeleton } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import axios from "axios";
//import { MarketplaceContext } from "../../store/MarketplaceContext";
import NftCard from "../../components/NFTCard";
import { decodePrice, decodeTokenId, getRankings } from "../../utils/mp";
import styled from "styled-components";
import NFTCollectionTable from "../../components/NFTCollectionTable";
import NFTSalesTable from "../../components/NFTSalesTable";
import NFTSaleActivityTable from "../../components/NFTSaleActivityTable";
import RankingList from "../../components/RankingList";
import ToggleButtons from "../../components/RankingFilterToggleButtons";
import { Stack } from "@mui/material";
import { getTokens, updateToken } from "../../store/tokenSlice";
import { UnknownAction } from "@reduxjs/toolkit";
import { getCollections } from "../../store/collectionSlice";
import {
  CollectionI,
  ListedToken,
  ListingI,
  RankingI,
  Token,
  TokenI,
} from "../../types";
import { getSales } from "../../store/saleSlice";
import { getPrices } from "../../store/dexSlice";
import { CTCINFO_LP_WVOI_AUSD } from "../../constants/dex";
//import { CTCINFO_LP_WVOI_VOI } from "../../constants/dex";

const SectionHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 45px;
  & h2.dark {
    color: #fff;
  }
  & h2.light {
    color: #93f;
  }
`;

const SectionTitle = styled.h2`
  /*color: #93f;*/
  text-align: center;
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: Nohemi;
  font-size: 40px;
  font-style: normal;
  font-weight: 700;
  line-height: 100%; /* 40px */
`;

const SectionMoreButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  & a {
    text-decoration: none;
  }
  & button.button-dark {
    border: 1px solid #fff;
  }
  & button.button-dark::after {
    background: url("/arrow-narrow-up-right-dark.svg") no-repeat;
  }
  & div.button-text-dark {
    color: #fff;
  }
  & button.button-light {
    border: 1px solid #93f;
  }
  & button.button-light::after {
    background: url("/arrow-narrow-up-right-light.svg") no-repeat;
  }
  & div.button-text-light {
    color: #93f;
  }
`;

const SectionMoreButton = styled.button`
  /* Layout */
  display: flex;
  padding: 12px 20px;
  justify-content: center;
  align-items: center;
  gap: 6px;
  /* Style */
  border-radius: 100px;
  /* Shadow/XSM */
  box-shadow: 0px 1px 2px 0px rgba(16, 24, 40, 0.04);
  /* Style/Extra */
  background-color: transparent;
  &::after {
    content: "";
    width: 20px;
    height: 20px;
    position: relative;
    display: inline-block;
  }
`;

const SectionMoreButtonText = styled.div`
  /* Text Button/Semibold Large */
  font-family: "Inter", sans-serif;
  font-size: 15px;
  font-style: normal;
  font-weight: 600;
  line-height: 22px; /* 146.667% */
  letter-spacing: 0.1px;
  cursor: pointer;
`;

const SectionBanners = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 45px;
`;

function shuffleArray<T>(array: T[]): T[] {
  // Create a copy of the original array to avoid mutating the original array
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    // Generate a random index between 0 and i
    const randomIndex = Math.floor(Math.random() * (i + 1));
    // Swap elements between randomIndex and i
    [shuffledArray[i], shuffledArray[randomIndex]] = [
      shuffledArray[randomIndex],
      shuffledArray[i],
    ];
  }
  return shuffledArray;
}

export const Activity: React.FC = () => {
  /* Dispatch */
  const dispatch = useDispatch();
  /* Dex */
  const prices = useSelector((state: RootState) => state.dex.prices);
  const dexStatus = useSelector((state: RootState) => state.dex.status);
  useEffect(() => {
    dispatch(getPrices() as unknown as UnknownAction);
  }, [dispatch]);
  const exchangeRate = useMemo(() => {
    if (!prices || dexStatus !== "succeeded") return 0;
    const voiPrice = prices.find((p) => p.contractId === CTCINFO_LP_WVOI_AUSD);
    if (!voiPrice) return 0;
    return voiPrice.rate;
  }, [prices, dexStatus]);
  /* Tokens */
  const tokens = useSelector((state: any) => state.tokens.tokens);
  const tokenStatus = useSelector((state: any) => state.tokens.status);
  useEffect(() => {
    dispatch(getTokens() as unknown as UnknownAction);
  }, [dispatch]);

  /* Collections */
  const collections = useSelector(
    (state: any) => state.collections.collections
  );
  const collectionStatus = useSelector(
    (state: any) => state.collections.status
  );
  useEffect(() => {
    dispatch(getCollections() as unknown as UnknownAction);
  }, [dispatch]);
  /* Sales */
  const sales = useSelector((state: any) => state.sales.sales);
  const salesStatus = useSelector((state: any) => state.sales.status);
  useEffect(() => {
    dispatch(getSales() as unknown as UnknownAction);
  }, [dispatch]);

  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );

  /* Router */
  const navigate = useNavigate();

  /* Toggle Buttons */
  const [selectedOption, setSelectedOption] = useState<string | null>("all");

  const handleOptionChange = (
    event: React.MouseEvent<HTMLElement>,
    newOption: string | null
  ) => {
    if (newOption !== null) {
      setSelectedOption(newOption);
    }
  };

  /* NFT Navigator Listings */
  const [listings, setListings] = React.useState<any>(null);
  React.useEffect(() => {
    try {
      const res = axios
        .get(
          "https://mainnet-idx.nftnavigator.xyz/nft-indexer/v1/mp/listings",
          {
            params: {
              active: true,
            },
          }
        )
        .then(({ data }) => {
          setListings(data.listings);
        });
    } catch (e) {
      console.log(e);
    }
  }, []);

  const listedNfts = useMemo(() => {
    if (tokenStatus !== "succeeded") return [];
    const listedNfts: ListedToken[] =
      tokens
        ?.filter((nft: TokenI) => {
          return listings?.some(
            (listing: ListingI) =>
              `${listing.collectionId}` === `${nft.contractId}` &&
              `${listing.tokenId}` === `${nft.tokenId}`
          );
        })
        ?.map((nft: TokenI) => {
          const listing = listings.find(
            (l: ListingI) =>
              `${l.collectionId}` === `${nft.contractId}` &&
              `${l.tokenId}` === `${nft.tokenId}`
          );
          return {
            ...nft,
            listing,
          };
        }) || [];
    listedNfts.sort(
      (a: any, b: any) => b.listing.createTimestamp - a.listing.createTimestamp
    );
    return listedNfts;
  }, [tokenStatus, tokens, listings]);

  const listedCollections = useMemo(() => {
    if (collectionStatus !== "succeeded") return [];
    const listedCollections =
      collections
        ?.filter((c: any) => {
          return listedNfts?.some(
            (nft: any) => `${nft.contractId}` === `${c.contractId}`
          );
        })
        .map((c: any) => {
          return {
            ...c,
            tokens: listedNfts?.filter(
              (nft: any) => `${nft.contractId}` === `${c.contractId}`
            ),
          };
        }) || [];
    listedCollections.sort(
      (a: any, b: any) =>
        b.tokens[0].listing.createTimestamp -
        a.tokens[0].listing.createTimestamp
    );
    return listedCollections;
  }, [collectionStatus, collections, listedNfts]);

  const rankings: any = useMemo(() => {
    if (
      !sales ||
      !listings ||
      salesStatus !== "succeeded" ||
      collectionStatus !== "succeeded" ||
      tokenStatus !== "succeeded"
    )
      return new Map();
    return getRankings(tokens, collections, sales, listings, exchangeRate);
  }, [sales, tokens, collections, listings]);

  const isLoading = useMemo(
    () =>
      !listings ||
      !listedNfts ||
      !listedCollections ||
      !rankings ||
      tokenStatus !== "succeeded" ||
      collectionStatus !== "succeeded" ||
      salesStatus !== "succeeded",
    [
      listings,
      listedNfts,
      listedCollections,
      rankings,
      tokenStatus,
      collectionStatus,
      salesStatus,
    ]
  );

  return (
    <Layout>
      {!isLoading ? (
        <div>
          {/* Activity */}
          <SectionHeading>
            <SectionTitle className={isDarkTheme ? "dark" : "light"}>
              Activity
            </SectionTitle>
          </SectionHeading>
          <NFTSaleActivityTable
            sales={sales}
            tokens={tokens}
            collections={collections}
          />
        </div>
      ) : (
        <div>
          <SectionHeading>
            <Skeleton variant="rounded" width={240} height={40} />
            <Skeleton variant="rounded" width={120} height={40} />
          </SectionHeading>
          <Grid container spacing={2} sx={{ mt: 5 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={3}>
                <Skeleton
                  sx={{ borderRadius: 10 }}
                  variant="rounded"
                  width="100%"
                  height={469}
                />
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={2} sx={{ mt: 5 }}>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="rounded" width="100%" height={240} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Skeleton variant="rounded" width="100%" height={240} />
            </Grid>
          </Grid>
        </div>
      )}
    </Layout>
  );
};
