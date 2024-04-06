import React, { useCallback, useEffect, useMemo } from "react";
import Layout from "../../layouts/Default";
import {
  Avatar,
  Container,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import axios from "axios";
import styled from "styled-components";
import IconAlarm from "static/icon-alarm.svg";
import ButtonBuy from "static/button-buy.svg";
import ButtonOffer from "static/button-offer.svg";
import ButtonBid from "static/button-bid.svg";
import { stringToColorCode } from "../../utils/string";

import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "react-toastify";

import { useWallet } from "@txnlab/use-wallet";

import algosdk from "algosdk";
//import { MarketplaceContext } from "../../store/MarketplaceContext";
import { decodePrice, decodeTokenId } from "../../utils/mp";
import NftCard from "../../components/NFTCard";
import BuySaleModal from "../../components/modals/BuySaleModal";

import { CONTRACT, arc72, arc200 } from "ulujs";
import { getAlgorandClients } from "../../wallets";
import { ctcInfoMp206 } from "../../constants/mp";

import VoiIcon from "static/crypto-icons/voi/0.svg";
import ViaIcon from "static/crypto-icons/voi/6779767.svg";

import XIcon from "static/icon/icon-x.svg";
import DiscordIcon from "static/icon/icon-discord.svg";
import LinkIcon from "static/icon/icon-link.svg";
import NFTTabs from "../../components/NFTTabs";
import { NFTInfo } from "../../components/NFTInfo";
import { NFTMore } from "../../components/NFTMore";
import { getPrices } from "../../store/dexSlice";
import { UnknownAction } from "@reduxjs/toolkit";
import { CTCINFO_LP_WVOI_VOI } from "../../constants/dex";
import { decodeRoyalties } from "../../utils/hf";

const CryptoIcon = styled.img`
  width: 16px;
  height: 16px;
`;

const ProjectIcon = styled.img`
  width: 32px;
  height: 31px;
  cursor: pointer;
`;

const ProjectLinkContainer = styled.div`
  margin-top: 27px;
  display: flex;
  align-items: flex-start;
  gap: 7px;
  color: #68727d;
  & .project-link-label-dark {
    color: #fff;
  }
  & .project-link-label-light {
    color: #000;
  }
`;

const ProjectLinkLabelContainer = styled.div`
  display: flex;
  width: 91px;
  height: 31px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 8px;
`;

const ProjectLinkLabel = styled.div`
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: Inter;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 12px; /* 85.714% */
  width: 339px;
`;

const AvatarWithName = styled(Stack)`
  dsplay: flex;
  align-items: center;
  color: #68727d;
  & .owner-name {
    cursor: pointer;
    color: #68727d;
    font-family: Inter;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 140%; /* 22.4px */
  }
`;

const OwnerValue = styled.div`
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "Advent Pro";
  font-size: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: 12px; /* 85.714% */
`;

const OwnerLabel = styled.div`
  color: #68727d;
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: Inter;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 12px; /* 85.714% */
`;

const AvatarWithOwnerName = styled(AvatarWithName)`
  & .owner-value-dark {
    color: #fff;
  }
  & .owner-value-light {
    color: #000;
  }
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NFTName = styled.div`
  color: #000;
  font-feature-settings: "clig" off, "liga" off;
  font-family: "Advent Pro";
  font-size: 30px;
  font-style: normal;
  font-weight: 700;
  line-height: 36px; /* 120% */
`;

const PriceDisplay = styled(Stack)`
  gap: 8px;
  & .price-label-dark {
    color: #68727d;
  }
  & .price-label-light {
    color: #000;
  }
  & .price-label {
    leading-trim: both;
    text-edge: cap;
    font-feature-settings: "clig" off, "liga" off;
    font-family: Inter;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 12px; /* 85.714% */
  }
  & .price-value {
    font-family: Advent Pro;
    font-size: 24px;
    font-weight: 700;
    line-height: 32px;
    letter-spacing: 0em;
    text-align: left;
  }
`;

const BuyButton = styled.img`
  cursor: pointer;
`;

const OfferButton = styled(BuyButton)``;

const BidButton = styled(BuyButton)``;

const AuctionContainer = styled(Stack)`
  padding: 16px;
  border-radius: 16px;
  border: 1px;
  gap: 8px;
  justify-content: space-between;
  border: 1px solid #eaebf0;
  align-items: center;
  & .auction-left {
    padding: 8px;
    & .auction-label {
      font-family: Inter;
      font-size: 16px;
      font-weight: 500;
      line-height: 22px;
      letter-spacing: 0em;
      text-align: left;
      color: #68727d;
    }
    & .auction-value {
      font-family: Inter;
      font-size: 24px;
      font-weight: 700;
      line-height: 22px;
      letter-spacing: 0em;
      text-align: left;
    }
  }
  & .auction-right {
    display: flex;
    flex-direction: column;
    gap: 10px;
    & .alarm-container {
      align-items: center;
      & .time-remaining {
        font-family: Advent Pro;
        font-size: 14px;
        font-weight: 700;
        line-height: 12px;
        letter-spacing: 0em;
        text-align: left;
      }
    }
  }
`;

const MoreFrom = styled.h3`
  font-family: Advent Pro;
  font-size: 36px;
  font-weight: 700;
  line-height: 40px;
  letter-spacing: 0em;
  text-align: left;
  margin-top: 48px;
`;

const TokenSkeleton: React.FC = () => (
  <Container sx={{ mt: 5 }}>
    <Grid
      sx={{
        border: "1px",
        alignItems: "center",
      }}
      container
      spacing="60px"
    >
      <Grid item xs={12} md={6}>
        <Skeleton
          variant="rounded"
          height={459}
          width={459}
          sx={{
            maxWidth: "100%",
            maxHeight: "100%",
            borderRadius: "16px",
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Stack gap={2}>
          <Skeleton variant="text" height={24} width={100} />
          <Skeleton variant="text" height={24} width={75} />
          <Skeleton variant="text" height={24} width={150} />
          <Skeleton variant="text" height={24} width={25} />
          <Skeleton variant="text" height={24} width={150} />
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <Skeleton variant="text" height={48} width={200} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(() => (
            <Grid item xs={6} sm={4} md={3}>
              <Skeleton
                variant="rounded"
                height={400}
                width="100%"
                sx={{
                  borderRadius: "16px",
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  </Container>
);

export const Token: React.FC = () => {
  const { activeAccount } = useWallet();
  const dispatch = useDispatch();
  /* Dex */
  const prices = useSelector((state: RootState) => state.dex.prices);
  const dexStatus = useSelector((state: RootState) => state.dex.status);
  useEffect(() => {
    dispatch(getPrices() as unknown as UnknownAction);
  }, [dispatch]);
  const exchangeRate = useMemo(() => {
    if (!prices || dexStatus !== "succeeded") return 0;
    const voiPrice = prices.find((p) => p.contractId === CTCINFO_LP_WVOI_VOI);
    if (!voiPrice) return 0;
    return voiPrice.rate;
  }, [prices, dexStatus]);
  /* Router */
  const { id, tid } = useParams();
  const navigate = useNavigate();
  /* Copy to clipboard */
  const [copiedText, copy] = useCopyToClipboard();
  const handleCopy = (text: string) => () => {
    copy(text)
      .then(() => {
        toast.success("Copied to clipboard!");
      })
      .catch((error) => {
        toast.error("Failed to copy to clipboard!");
      });
  };
  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );

  const [collection, setCollection] = React.useState<any>(null);
  React.useEffect(() => {
    try {
      (async () => {
        const {
          data: { tokens: res },
        } = await axios.get(
          `https://arc72-idx.voirewards.com/nft-indexer/v1/tokens?contractId=${id}`
        );
        const nfts = [];
        for (const t of res) {
          const tm = JSON.parse(t.metadata);
          nfts.push({
            ...t,
            metadata: tm,
          });
        }
        setCollection(nfts);
      })();
    } catch (e) {
      console.log(e);
    }
  }, [id]);

  const [listings, setListings] = React.useState<any>(null);
  useEffect(() => {
    try {
      (async () => {
        const {
          data: { listings: res },
        } = await axios.get(
          `https://arc72-idx.nftnavigator.xyz/nft-indexer/v1/mp/listings`,
          {
            params: {
              collectionId: id,
              //tokenId: tid,
              active: true,
            },
          }
        );
        setListings(res);
      })();
    } catch (e) {
      console.log(e);
    }
  }, [id]);

  const [collectionInfo, setCollectionInfo] = React.useState<any>(null);
  useEffect(() => {
    try {
      axios
        .get(`https://test-voi.api.highforge.io/projects/info/${id}`)
        .then((res: any) => res.data)
        .then(setCollectionInfo);
    } catch (e) {
      console.log(e);
    }
  }, [id]);

  const [nft, setNft] = React.useState<any>(null);
  useEffect(() => {
    if (!collection || !tid || !listings) return;
    (async () => {
      const nft = collection.find((el: any) => el.tokenId === Number(tid));
      const listing = [...listings]
        .filter(
          (l: any) =>
            `${l.collectionId}` === `${id}` &&
            `${l.tokenId}` === `${tid}` &&
            `${l.seller}` === `${nft.owner}`
        )
        .sort((a: any, b: any) => b.createTimestamp - a.createTimestamp)
        .pop();
      // check listing
      let validListing = false;
      if (listing) {
        const { algodClient, indexerClient } = getAlgorandClients();
        const ci = new CONTRACT(
          listing.mpContractId,
          algodClient,
          indexerClient,
          {
            name: "",
            desc: "",
            methods: [
              {
                name: "v_sale_listingByIndex",
                args: [
                  {
                    type: "uint256",
                  },
                ],
                readonly: true,
                returns: {
                  type: "(uint64,uint256,address,(byte,byte[40]),uint64,uint64,uint64,uint64,uint64,uint64,address,address,address)",
                },
              },
            ],
            events: [],
          },
          { addr: activeAccount?.address || "", sk: new Uint8Array(0) }
        );
        const v_sale_listingByIndexR = await ci.v_sale_listingByIndex(
          listing.mpListingId
        );
        console.log({ listing, v_sale_listingByIndexR });
        if (v_sale_listingByIndexR.success) {
          validListing = true;
        }
      }
      const royalties = decodeRoyalties(nft.metadata.royalties);
      setNft({
        ...nft,
        listing: validListing ? listing : undefined,
        royalties,
      });
    })();
  }, [id, tid, collection, listings]);

  const listedNfts = useMemo(() => {
    const listedNfts =
      collection
        ?.filter((nft: any) => {
          return listings?.some(
            (listing: any) =>
              `${listing.collectionId}` === `${nft.contractId}` &&
              `${listing.tokenId}` === `${nft.tokenId}`
          );
        })
        ?.map((nft: any) => {
          const listing = listings.find(
            (l: any) =>
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
  }, [collection, listings]);

  const moreNfts = useMemo(() => {
    if (!nft) return [];
    return listedNfts?.filter((el: any) => el.tokenId !== nft.tokenId);
  }, [nft, listedNfts]);

  const isLoading = React.useMemo(
    () => !nft || !listings || !collectionInfo,
    [nft, listings, collectionInfo]
  );

  return (
    <Layout>
      {!isLoading ? (
        <Container sx={{ pt: 5 }}>
          <Stack style={{ gap: "64px" }}>
            <NFTInfo
              nft={nft}
              collection={collection}
              collectionInfo={collectionInfo}
              loading={isLoading}
              exchangeRate={exchangeRate}
            />
            <NFTTabs nft={nft} loading={isLoading} />
            <NFTMore
              title={`More from ${
                collectionInfo?.project?.title ||
                nft.metadata.name.replace(/[#0123456789 ]*$/, "")
              }`}
              nfts={moreNfts}
              onClick={(el) => {
                const nft = listedNfts.find(
                  (el2: any) =>
                    el2.contractId === el.contractId &&
                    el2.tokenId === el.tokenId
                );
                setNft(nft);
                navigate(`/collection/${nft.contractId}/token/${nft.tokenId}`);
              }}
            />
          </Stack>
        </Container>
      ) : (
        <TokenSkeleton />
      )}
    </Layout>
  );
};
