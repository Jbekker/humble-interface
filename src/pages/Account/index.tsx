import React, { useContext, useEffect, useMemo } from "react";
import Layout from "../../layouts/Default";
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Chip,
  Container,
  Grid,
  Stack,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import NFTCard from "../../components/NFTCard";
import Section from "../../components/Section";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import axios from "axios";
import { stringToColorCode } from "../../utils/string";
import styled from "styled-components";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "react-toastify";
import { useWallet } from "@txnlab/use-wallet";
import SendIcon from "@mui/icons-material/Send";
import { getAlgorandClients } from "../../wallets";
import { arc72, CONTRACT, abi, arc200 } from "ulujs";
import TransferModal from "../../components/modals/TransferModal";
import ListSaleModal from "../../components/modals/ListSaleModal";
import algosdk from "algosdk";
import { ListingBoxCost, ctcInfoMp206 } from "../../constants/mp";
//import { MarketplaceContext } from "../../store/MarketplaceContext";
import { decodeRoyalties } from "../../utils/hf";
import NFTListingTable from "../../components/NFTListingTable";
import { ListingI, Token } from "../../types";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { getPrices } from "../../store/dexSlice";
import { UnknownAction } from "@reduxjs/toolkit";
import { CTCINFO_LP_WVOI_VOI } from "../../constants/dex";

const { algodClient, indexerClient } = getAlgorandClients();

const ExternalLinks = styled.ul`
  & li {
    Number(margin-top: 10px;
  }
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AccountLabel = styled.div`
  font-family: Nohemi;
  font-size: 16px;
  font-weight: 500;
  line-height: 36px;
  letter-spacing: 0em;
  text-align: left;
  color: #717579;
`;

const AccountValue = styled.div`
  font-family: Inter;
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  letter-spacing: 0px;
  text-align: center;
`;

export const Account: React.FC = () => {
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

  const { id } = useParams();
  const navigate = useNavigate();

  const idArr = id?.indexOf(",") !== -1 ? id?.split(",") || [] : [id];

  /* Selection */
  const [selected, setSelected] = React.useState(-1);
  const [selected2, setSelected2] = React.useState<string>("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");

  /* Wallet */
  const {
    activeAccount,
    providers,
    connectedAccounts,
    signTransactions,
    sendTransactions,
  } = useWallet();

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

  /* NFT Navigator Listings */
  const [listings, setListings] = React.useState<any>(null);
  React.useEffect(() => {
    try {
      const res = axios
        .get("https://arc72-idx.nftnavigator.xyz/nft-indexer/v1/mp/listings", {
          params: {
            active: true,
            seller: idArr,
          },
        })
        .then(({ data }) => {
          setListings(data.listings);
        });
    } catch (e) {
      console.log(e);
    }
  }, []);

  const normalListings = useMemo(() => {
    if (!listings || !exchangeRate) return [];
    return listings.map((listing: ListingI) => {
      return {
        ...listing,
        normalPrice:
          listing.currency === 0 ? listing.price : listing.price * exchangeRate,
      };
    });
  }, [listings, exchangeRate]);

  /* NFT Navigator Collections */
  const [collections, setCollections] = React.useState<any>(null);
  React.useEffect(() => {
    try {
      (async () => {
        const {
          data: { collections: res },
        } = await axios.get(
          "https://arc72-idx.voirewards.com/nft-indexer/v1/collections"
        );
        const collections = [];
        for (const c of res) {
          const t = c.firstToken;
          if (!!t) {
            const tm = JSON.parse(t.metadata);
            collections.push({
              ...c,
              firstToken: {
                ...t,
                metadata: tm,
              },
            });
          }
        }
        setCollections(collections);
      })();
    } catch (e) {
      console.log(e);
    }
  }, [listings]);

  /* NFT Navigator NFTs */
  const [nfts, setNfts] = React.useState<Token[]>([] as Token[]);
  React.useEffect(() => {
    try {
      (async () => {
        const {
          data: { tokens: res },
        } = await axios.get(
          `https://arc72-idx.voirewards.com/nft-indexer/v1/tokens`,
          {
            params: {
              owner: idArr,
            },
          }
        );
        const nfts = [];
        for (const t of res) {
          const tm = JSON.parse(t.metadata);
          const royalties = decodeRoyalties(tm.royalties);
          nfts.push({
            ...t,
            metadata: tm,
            royalties,
          });
        }
        nfts.sort((a, b) => (a.contractId === 29105406 ? -1 : 1));
        setNfts(nfts);
      })();
    } catch (e) {
      console.log(e);
    }
  }, []);

  const listedNfts = useMemo(() => {
    const listedNfts =
      nfts
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
  }, [nfts, listings]);

  const listedCollections = useMemo(() => {
    const listedCollections =
      collections
        ?.filter((c: any) => {
          return listedNfts?.some(
            (nft: any) => `${nft.contractId}` === `${c.contractId}`
          );
        })
        ?.map((c: any) => {
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
  }, [collections, listedNfts]);

  const isLoading = useMemo(
    () =>
      !collections || !nfts || !listings || !listedNfts || !listedCollections,
    [collections, nfts, listings, listedNfts, listedCollections]
  );

  /* Transaction */

  const [open, setOpen] = React.useState(false);
  const [isTransferring, setIsTransferring] = React.useState(false);
  const [openListSale, setOpenListSale] = React.useState(false);
  const [isListing, setIsListing] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState(0);

  const [nft, setNft] = React.useState<any>(null);
  useEffect(() => {
    if (selected === -1) return;
    const nft: Token = nfts[selected];
    const royalties = decodeRoyalties(nft.metadata.royalties);
    setNft({
      ...nft,
      royalties,
    });
  }, [nfts, selected]);

  const handleListSale = async (price: string, currency: string) => {
    const listedNft = nft?.listing
      ? nft
      : listedNfts.find(
          (el: any) =>
            el.contractId === nfts[selected].contractId &&
            el.tokenId === nfts[selected].tokenId
        );
    const priceN = Number(price);
    const currencyN = Number(currency);
    try {
      if (isNaN(priceN)) {
        throw new Error("Invalid price");
      }
      if (isNaN(currencyN)) {
        throw new Error("Invalid currency");
      }
      if (!activeAccount) {
        throw new Error("No active account");
      }
      setIsListing(true);

      const contractId = nft?.contractId || 0;
      const tokenId = nft?.tokenId || 0;

      if (!contractId || !tokenId) {
        throw new Error("Invalid contractId or tokenId");
      }

      const ciArc72 = new arc72(contractId, algodClient, indexerClient, {
        acc: { addr: activeAccount?.address || "", sk: new Uint8Array(0) },
      });
      const arc72_ownerOfR = await ciArc72.arc72_ownerOf(tokenId);
      if (!arc72_ownerOfR.success) {
        throw new Error("arc72_ownerOf failed in simulate");
      }
      const arc72_ownerOf = arc72_ownerOfR.returnValue;

      const builder = {
        arc200: new CONTRACT(
          currencyN,
          algodClient,
          indexerClient,
          abi.arc200,
          {
            addr: activeAccount?.address || "",
            sk: new Uint8Array(0),
          },
          true,
          false,
          true
        ),
        arc72: new CONTRACT(
          contractId,
          algodClient,
          indexerClient,
          abi.arc72,
          {
            addr: arc72_ownerOf,
            sk: new Uint8Array(0),
          },
          true,
          false,
          true
        ),
        mp: new CONTRACT(
          ctcInfoMp206,
          algodClient,
          indexerClient,
          {
            name: "mp",
            desc: "mp",
            methods: [
              // a_sale_deleteListing(ListingId)
              {
                name: "a_sale_deleteListing",
                args: [
                  {
                    type: "uint256",
                    name: "listingId",
                  },
                ],
                returns: {
                  type: "void",
                },
              },
              // a_sale_listNet(CollectionId, TokenId, ListPrice, EndTime, RoyaltyPoints, CreatePoints1, CreatorPoint2, CreatorPoint3, CreatorAddr1, CreatorAddr2, CreatorAddr3)ListId
              {
                name: "a_sale_listNet",
                args: [
                  {
                    name: "collectionId",
                    type: "uint64",
                  },
                  {
                    name: "tokenId",
                    type: "uint256",
                  },
                  {
                    name: "listPrice",
                    type: "uint64",
                  },
                  {
                    name: "endTime",
                    type: "uint64",
                  },
                  {
                    name: "royalty",
                    type: "uint64",
                  },
                  {
                    name: "createPoints1",
                    type: "uint64",
                  },
                  {
                    name: "creatorPoint2",
                    type: "uint64",
                  },
                  {
                    name: "creatorPoint3",
                    type: "uint64",
                  },
                  {
                    name: "creatorAddr1",
                    type: "address",
                  },
                  {
                    name: "creatorAddr2",
                    type: "address",
                  },
                  {
                    name: "creatorAddr3",
                    type: "address",
                  },
                ],
                returns: {
                  type: "uint256",
                },
              },
              {
                name: "a_sale_listSC",
                args: [
                  {
                    name: "collectionId",
                    type: "uint64",
                  },
                  {
                    name: "tokenId",
                    type: "uint256",
                  },
                  {
                    name: "paymentTokenId",
                    type: "uint64",
                  },
                  {
                    name: "listPrice",
                    type: "uint256",
                  },
                  {
                    name: "endTime",
                    type: "uint64",
                  },
                  {
                    name: "royalty",
                    type: "uint64",
                  },
                  {
                    name: "createPoints1",
                    type: "uint64",
                  },
                  {
                    name: "creatorPoint2",
                    type: "uint64",
                  },
                  {
                    name: "creatorPoint3",
                    type: "uint64",
                  },
                  {
                    name: "creatorAddr1",
                    type: "address",
                  },
                  {
                    name: "creatorAddr2",
                    type: "address",
                  },
                  {
                    name: "creatorAddr3",
                    type: "address",
                  },
                ],
                returns: {
                  type: "uint256",
                },
              },
            ],
            events: [],
          },
          {
            addr: arc72_ownerOf,
            sk: new Uint8Array(0),
          },
          true,
          false,
          true
        ),
      };
      const ciArc200 = new arc200(currencyN, algodClient, indexerClient);
      const ci = new CONTRACT(
        ctcInfoMp206,
        algodClient,
        indexerClient,
        {
          name: "",
          desc: "",
          methods: [
            {
              name: "custom",
              args: [],
              returns: {
                type: "void",
              },
            },
          ],
          events: [],
        },
        {
          addr: arc72_ownerOf,
          sk: new Uint8Array(0),
        }
      );
      // VOI Sale
      if (currencyN === 0) {
        const customPaymentAmount = [ListingBoxCost];
        const buildP = [
          builder.mp.a_sale_listNet(
            contractId, // CollectionId
            tokenId, // TokenId
            priceN * 1e6, // ListPrice
            Number.MAX_SAFE_INTEGER, // EndTime
            Math.min(nft?.royalties?.royaltyPoints || 0, 9500), // RoyaltyPoints
            nft?.royalties?.creator1Points || 0, // CreatePoints1
            nft?.royalties?.creator2Points || 0, // CreatePoints1
            nft?.royalties?.creator3Points || 0, // CreatePoints1
            nft?.royalties?.creator1Address ||
              "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ", // CreatePoints1
            nft?.royalties?.creator2Address ||
              "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ", // CreatePoints1
            nft?.royalties?.creator3Address ||
              "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ" // CreatePoints1
          ),
          builder.arc72.arc72_approve(
            algosdk.getApplicationAddress(ctcInfoMp206), // Address
            tokenId // TokenId
          ),
        ];
        if (listedNft) {
          buildP.push(
            builder.mp.a_sale_deleteListing(listedNft.listing.mpListingId)
          );
        }
        const customTxns = (await Promise.all(buildP)).map(({ obj }) => obj);
        ci.setAccounts([
          "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ", // mp206 D
        ]);
        ci.setFee(2000);
        ci.setPaymentAmount(
          customPaymentAmount.reduce((acc, val) => acc + val, 0)
        );
        ci.setExtraTxns(customTxns);
        if (contractId === 29088600) {
          ci.setOptins([29103397]);
        }
        const customR = await ci.custom();
        if (!customR.success) {
          throw new Error("failed in simulate");
        }
        await signTransactions(
          customR.txns.map(
            (txn: string) => new Uint8Array(Buffer.from(txn, "base64"))
          )
        ).then(sendTransactions);
      }
      // VIA Sale
      else {
        // ------------------------------------------d
        // Setup recipient accounts
        // ------------------------------------------d
        do {
          const ciMp = new CONTRACT(
            ctcInfoMp206,
            algodClient,
            indexerClient,
            {
              name: "",
              desc: "",
              methods: [
                {
                  name: "manager",
                  args: [],
                  returns: {
                    type: "address",
                  },
                },
              ],
              events: [],
            },
            {
              addr: activeAccount?.address || "",
              sk: new Uint8Array(0),
            }
          );
          const ci = new CONTRACT(
            currencyN,
            algodClient,
            indexerClient,
            {
              name: "",
              desc: "",
              methods: [
                {
                  name: "custom",
                  args: [],
                  returns: {
                    type: "void",
                  },
                },
              ],
              events: [],
            },
            {
              addr: arc72_ownerOf,
              sk: new Uint8Array(0),
            }
          );
          const managerR = await ciMp.manager();
          if (!managerR.success) {
            throw new Error("manager failed in simulate");
          }
          const manager = managerR.returnValue;
          const candidates = [
            manager,
            activeAccount?.address || "",
            nft?.royalties?.creator1Address,
            nft?.royalties?.creator2Address,
            nft?.royalties?.creator3Address,
          ];
          const addrs = [];
          for (const addr of candidates) {
            const hasBalanceR = await ciArc200.hasBalance(addr);
            console.log({ addr, hasBalanceR });

            if (!hasBalanceR.success) {
              throw new Error("hasBalance failed in simulate");
            }
            const hasBalance = hasBalanceR.returnValue;
            if (hasBalance === 0) {
              addrs.push(addr);
            }
          }
          const uniqAddrs = Array.from(new Set(addrs));
          if (uniqAddrs.length === 0) {
            break;
          }
          for (let i = 0; i < uniqAddrs.length; i++) {
            const addr = uniqAddrs[i];
            const buildP = [addr].map((addr) =>
              builder.arc200.arc200_transfer(addr, 0)
            );
            const customTxns = (await Promise.all(buildP)).map(
              ({ obj }) => obj
            );
            ci.setFee(1000);
            ci.setPaymentAmount(28500);
            ci.setExtraTxns(customTxns);
            const customR = await ci.custom();
            if (!customR.success) {
              throw new Error("failed in simulate");
            }
            await toast.promise(
              signTransactions(
                customR.txns.map(
                  (txn: string) => new Uint8Array(Buffer.from(txn, "base64"))
                )
              ).then(sendTransactions),
              {
                pending: `Transaction signature pending setup recipient account (${
                  i + 1
                }/${uniqAddrs.length})`,
                success: "Recipient account setup successful",
                error: "Recipient account setup failed",
              }
            );
          }
        } while (0);
        // ------------------------------------------d

        const customPaymentAmount = [ListingBoxCost];
        const buildP = [
          builder.mp.a_sale_listSC(
            contractId,
            tokenId,
            currencyN,
            priceN * 1e6,
            Number.MAX_SAFE_INTEGER,
            Math.min(nft?.royalties?.royaltyPoints || 0, 9500), // RoyaltyPoints
            nft?.royalties?.creator1Points || 0, // CreatePoints1
            nft?.royalties?.creator2Points || 0, // CreatePoints1
            nft?.royalties?.creator3Points || 0, // CreatePoints1
            nft?.royalties?.creator1Address ||
              "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ", // CreatePoints1
            nft?.royalties?.creator2Address ||
              "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ", // CreatePoints1
            nft?.royalties?.creator3Address ||
              "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ" // CreatePoints1
          ),
          builder.arc72.arc72_approve(
            algosdk.getApplicationAddress(ctcInfoMp206),
            tokenId
          ),
        ];
        if (listedNft) {
          buildP.push(
            builder.mp.a_sale_deleteListing(listedNft.listing.mpListingId)
          );
        }
        const customTxns = (await Promise.all(buildP)).map(({ obj }) => obj);
        ci.setAccounts([
          "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
        ]);
        ci.setFee(2000);
        ci.setExtraTxns(customTxns);
        if (contractId === 29088600) {
          ci.setOptins([29103397]);
        }
        ci.setPaymentAmount(
          customPaymentAmount.reduce((acc, val) => acc + val, 0)
        );
        const customR = await ci.custom();
        if (!customR.success) {
          throw new Error("failed in simulate");
        }
        await toast.promise(
          signTransactions(
            customR.txns.map(
              (txn: string) => new Uint8Array(Buffer.from(txn, "base64"))
            )
          ).then(sendTransactions),
          {
            pending: `Transaction signature pending... ${((str) =>
              str[0].toUpperCase() + str.slice(1))(
              activeAccount.providerId
            )} will prompt you to sign the transaction.`,
            success: "List successful!",
            error: "List failed",
          }
        );
      }
    } catch (e: any) {
      console.log(e);
      toast.error(e.message);
    } finally {
      setIsListing(false);
      setOpenListSale(false);
      setSelected(-1);
    }
  };

  const handleDeleteListing = async (listingId: number) => {
    try {
      const ci = new CONTRACT(
        ctcInfoMp206,
        algodClient,
        indexerClient,
        {
          name: "",
          desc: "",
          methods: [
            {
              name: "a_sale_deleteListing",
              args: [
                {
                  type: "uint256",
                  name: "listingId",
                },
              ],
              returns: {
                type: "void",
              },
            },
          ],
          events: [],
        },
        {
          addr: activeAccount?.address || "",
          sk: new Uint8Array(0),
        }
      );
      ci.setFee(3000);
      const a_sale_deleteListingR = await ci.a_sale_deleteListing(listingId);
      if (!a_sale_deleteListingR.success) {
        throw new Error("a_sale_deleteListing failed in simulate");
      }
      const txns = a_sale_deleteListingR.txns;
      await signTransactions(
        txns.map((txn: string) => new Uint8Array(Buffer.from(txn, "base64")))
      ).then(sendTransactions);
      toast.success("Unlist successful!");
    } catch (e: any) {
      console.log(e);
      toast.error(e.message);
    } finally {
      setSelected2("");
    }
  };

  const handleTransfer = async (addr: string, amount: string) => {
    try {
      const amountN = Number(amount);
      // TODO validate address
      if (!addr) {
        throw new Error("Address is required");
      }
      if (isNaN(amountN)) {
        throw new Error("Invalid amount");
      }
      if (!activeAccount) {
        throw new Error("No active account");
      }
      setIsTransferring(true);
      const nft: any = nfts[selected];
      const { contractId, tokenId } = nft;
      const ci = new arc72(contractId, algodClient, indexerClient, {
        acc: { addr: activeAccount?.address || "", sk: new Uint8Array(0) },
      });
      const builder: any = {
        arc72: new CONTRACT(
          contractId,
          algodClient,
          indexerClient,
          abi.arc72,
          { addr: activeAccount?.address || "", sk: new Uint8Array(0) },
          undefined,
          undefined,
          true
        ),
      };
      const arc72_ownerOfR = await ci.arc72_ownerOf(tokenId);
      if (!arc72_ownerOfR.success) {
        throw new Error("arc72_ownerOf failed in simulate");
      }
      const arc72_ownerOf = arc72_ownerOfR.returnValue;
      //if (arc72_ownerOf !== activeAccount?.address) {
      //  throw new Error("arc72_ownerOf not connected");
      //}
      const customTxn = (
        await Promise.all([
          builder.arc72.arc72_transferFrom(
            activeAccount?.address || "",
            addr,
            BigInt(tokenId)
          ),
        ])
      ).map(({ obj }) => obj);
      const ciCustom = new CONTRACT(
        contractId,
        algodClient,
        indexerClient,
        {
          name: "",
          desc: "",
          methods: [
            {
              name: "custom",
              args: [],
              returns: {
                type: "void",
              },
            },
          ],
          events: [],
        },
        { addr: activeAccount?.address || "", sk: new Uint8Array(0) }
      );
      ciCustom.setExtraTxns(customTxn);
      // ------------------------------------------
      // Add payment if necessary
      //   Aust arc72 pays for the box cost if the ctcAddr balance - minBalance < box cost
      const BalanceBoxCost = 28500;
      const accInfo = await algodClient
        .accountInformation(algosdk.getApplicationAddress(contractId))
        .do();
      const availableBalance = accInfo.amount - accInfo["min-balance"];
      const extraPaymentAmount =
        availableBalance < BalanceBoxCost
          ? BalanceBoxCost // Pay whole box cost instead of partial cost, BalanceBoxCost - availableBalance
          : 0;
      ciCustom.setPaymentAmount(extraPaymentAmount);
      const transfers = [];
      if (amountN > 0) {
        transfers.push([Math.floor(amountN * 1e6), addr]);
      }
      ciCustom.setTransfers(transfers);
      // ------------------------------------------
      const customR = await ciCustom.custom();
      if (!customR.success) {
        throw new Error("custom failed in simulate");
      }
      const txns = customR.txns;
      const res = await signTransactions(
        txns.map((txn: string) => new Uint8Array(Buffer.from(txn, "base64")))
      ).then(sendTransactions);
      toast.success(`NFT Transfer successful! Page will reload momentarily.`);
      if (connectedAccounts.map((a) => a.address).includes(addr)) {
        setNfts([
          ...nfts.slice(0, selected),
          { ...nft, owner: addr },
          ...nfts.slice(selected + 1),
        ]);
      } else {
        setNfts([...nfts.slice(0, selected), ...nfts.slice(selected + 1)]);
      }
      setTimeout(() => {
        window.location.reload();
      }, 4000);
    } catch (e: any) {
      console.log(e);
      toast.error(e.message);
    } finally {
      setIsTransferring(false);
      setOpen(false);
      setSelected(-1);
    }
  };

  console.log({
    nfts,
    listedNfts,
    listedCollections,
    collections,
    isLoading,
    nft,
  });

  return !isLoading ? (
    <Layout>
      <Container
        maxWidth="xl"
        sx={{
          color: isDarkTheme ? "#fff" : "#000",
        }}
      >
        <Stack spacing={2} direction="row">
          <Avatar
            sx={{
              background: `linear-gradient(45deg, ${stringToColorCode(
                String(id)
              )}, ${isDarkTheme ? "#000" : "#fff"})`,
              width: "145px",
              height: "145px",
            }}
          >
            {String(id).slice(0, 1)}
          </Avatar>
          <Grid container spacing={2}>
            {id?.split(",")?.map((id) => (
              <Grid item xs={12} key={id}>
                <Stack
                  gap={0.1}
                  sx={{
                    p: 1,
                  }}
                >
                  <AccountLabel>Account</AccountLabel>
                  <Stack direction="row" gap={1}>
                    <AccountValue>
                      {String(id).slice(0, 4)}...{String(id).slice(-4)}
                    </AccountValue>
                    <ContentCopyIcon
                      onClick={() => {
                        handleCopy(String(id))();
                      }}
                    />
                  </Stack>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Stack>
        <ButtonGroup>
          {["Collected", "Listed"].map((el: string, i: number) => (
            <Button
              variant={i === activeTab ? "contained" : "outlined"}
              onClick={() => {
                setActiveTab(i);
              }}
            >
              {el}
            </Button>
          ))}
        </ButtonGroup>
        {activeTab === 0 && nfts ? (
          <>
            <Typography variant="h4" sx={{ mt: 3 }}>
              Collected <small>{nfts?.length}</small>
            </Typography>
            <Stack
              sx={{
                mt: 3,
                justifyContent: "center",
                alignItems: "center",
              }}
              spacing={2}
              direction="row"
            >
              {selected >= 0 ? (
                <>
                  <ButtonGroup>
                    <Button
                      onClick={() => {
                        navigate(
                          `/collection/${nfts[selected].contractId}/token/${nfts[selected].tokenId}`
                        );
                      }}
                    >
                      View
                    </Button>
                    <Button
                      size="large"
                      variant="outlined"
                      onClick={async () => {
                        try {
                          // get account available balance
                          const accInfo = await algodClient
                            .accountInformation(activeAccount?.address || "")
                            .do();
                          const availableBalance =
                            accInfo.amount - accInfo["min-balance"];
                          // check that available balance is greater than or equal to 0.1235
                          if (availableBalance < 123500) {
                            throw new Error(
                              `Insufficient balance (${
                                (availableBalance - 123500) / 1e6
                              } VOI). Please fund your account.`
                            );
                          }

                          setOpenListSale(true);
                        } catch (e: any) {
                          console.log(e);
                          toast.error(e.message);
                        }
                      }}
                    >
                      List For Sale
                    </Button>
                    <Button
                      size="large"
                      variant="outlined"
                      onClick={() => {
                        setOpen(true);
                      }}
                    >
                      Transfer
                    </Button>
                    {/*<Link
                      to={`https://nftnavigator.xyz/collection/${nfts[selected].contractId}/token/${nfts[selected].tokenId}`}
                      target="_blank"
                    >
                      <Button size="large">View in NFT Navigator</Button>
                    </Link>*/}
                    <Button
                      onClick={() => {
                        setSelected(-1);
                      }}
                    >
                      Clear
                    </Button>
                  </ButtonGroup>
                </>
              ) : null}
            </Stack>
            {nfts ? (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {nfts?.map((nft: any, index: number) => {
                  return (
                    <Grid
                      item
                      xs={6}
                      sm={4}
                      md={3}
                      lg={2}
                      key={`${nft.contractId}-${nft.tokenId}`}
                    >
                      <img
                        style={{
                          width: "100%",
                          cursor: "pointer",
                          borderRadius: 10,
                          border:
                            selected === index
                              ? "5px solid rgb(139, 44, 195)"
                              : isDarkTheme
                              ? "5px solid rgb(22, 23, 23)"
                              : "5px solid #fff",
                        }}
                        src={nft.metadata.image}
                        alt={nft.metadata.name}
                        onClick={() => {
                          if (idArr.includes(activeAccount?.address || "")) {
                            if (selected === index) {
                              setSelected(-1);
                            } else {
                              setSelected(index);
                            }
                          } else {
                            navigate(
                              `/collection/${nft.contractId}/token/${nft.tokenId}`
                            );
                          }
                        }}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            ) : null}
          </>
        ) : null}
        {activeTab === 1 ? (
          <>
            <Stack
              spacing={2}
              direction="row"
              sx={{ mt: 4, justifyContent: "space-between" }}
            >
              <Typography variant="h4" sx={{ mt: 3 }}>
                Listed <small>{listedNfts.length}</small>
              </Typography>
              <Stack
                sx={{
                  mt: 3,
                  justifyContent: "center",
                  alignItems: "center",
                }}
                spacing={2}
                direction="row"
              >
                {selected2 !== "" ? (
                  <>
                    <ButtonGroup>
                      {viewMode === "grid" ? (
                        <Button
                          onClick={() => {
                            const nft = listedNfts.find(
                              (el: any) =>
                                `${el.listing.mpContractId}-${el.listing.mpListingId}` ===
                                selected2
                            );
                            navigate(
                              `/collection/${nft.contractId}/token/${nft.tokenId}`
                            );
                          }}
                        >
                          <VisibilityIcon />
                        </Button>
                      ) : null}
                      <Button
                        onClick={async () => {
                          try {
                            // get account available balance
                            const accInfo = await algodClient
                              .accountInformation(activeAccount?.address || "")
                              .do();
                            const availableBalance =
                              accInfo.amount - accInfo["min-balance"];
                            // check that available balance is greater than or equal to 0.1235
                            if (availableBalance < 123500) {
                              throw new Error(
                                `Insufficient balance (${
                                  (availableBalance - 123500) / 1e6
                                } VOI). Please fund your account.`
                              );
                            }
                            const nft = listedNfts.find(
                              (el: any) =>
                                `${el.listing.mpContractId}-${el.listing.mpListingId}` ===
                                selected2
                            );
                            const royalties = decodeRoyalties(
                              nft.metadata.royalties
                            );
                            console.log({ ...nft, royalties });
                            setNft({
                              ...nft,
                              royalties,
                            });
                            setOpenListSale(true);
                          } catch (e: any) {
                            console.log(e);
                            toast.error(e.message);
                          }
                        }}
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        onClick={() => {
                          const nft = listedNfts.find(
                            (el: any) =>
                              `${el.listing.mpContractId}-${el.listing.mpListingId}` ===
                              selected2
                          );
                          handleDeleteListing(nft.listing.mpListingId);
                        }}
                      >
                        <DeleteIcon />
                      </Button>
                      {/*<Button
                        onClick={() => {
                          setSelected2("");
                        }}
                      >
                        Clear
                      </Button>*/}
                    </ButtonGroup>
                  </>
                ) : null}
              </Stack>
              <ToggleButtonGroup
                sx={{ display: { xs: "none", sm: "flex" } }}
                color="primary"
                value={viewMode}
                exclusive
                onChange={() => {
                  setViewMode(viewMode === "list" ? "grid" : "list");
                }}
                aria-label="Platform"
              >
                <ToggleButton value="list">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="grid">
                  <GridViewIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            {viewMode === "list" && nfts && listings && collections ? (
              <Box sx={{ mt: 4 }}>
                <NFTListingTable
                  enableSelect={idArr.includes(activeAccount?.address || "")}
                  onSelect={(x: string) => {
                    if (x === selected2) {
                      setSelected2("");
                    } else {
                      setSelected2(x);
                    }
                  }}
                  selected={selected2}
                  tokens={nfts}
                  listings={normalListings}
                  collections={collections}
                  columns={["image", "token", "price"]}
                />
              </Box>
            ) : null}
            {viewMode == "grid" ? (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {listedNfts?.map((nft: any, index: number) => {
                  const pk = `${nft.listing.mpContractId}-${nft.listing.mpListingId}`;
                  return nft ? (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={nft.id}>
                      <img
                        style={{
                          width: "100%",
                          cursor: "pointer",
                          borderRadius: 10,
                          border:
                            selected2 === pk
                              ? "5px solid rgb(139, 44, 195)"
                              : isDarkTheme
                              ? "5px solid rgb(22, 23, 23)"
                              : "5px solid #fff",
                        }}
                        src={nft.metadata.image}
                        alt={nft.metadata.name}
                        onClick={() => {
                          if (
                            id?.indexOf(activeAccount?.address || "") !== -1
                          ) {
                            if (selected2 === pk) {
                              setSelected2("");
                            } else {
                              setSelected2(pk);
                            }
                          } else {
                            navigate(
                              `/collection/${nft.contractId}/token/${nft.tokenId}`
                            );
                          }
                        }}
                      />
                    </Grid>
                  ) : null;
                })}
              </Grid>
            ) : null}
          </>
        ) : null}
        {/*<Typography
          sx={{ mt: 5, color: isDarkTheme ? "#fff" : "#000" }}
          variant="h6"
        >
          External Links
        </Typography>
        <ExternalLinks
          style={{
            listStyle: "none",
          }}
        >
          <li>
            <StyledLink
              target="_blank"
              to={`https://nftnavigator.xyz/portfolio/${id}`}
              style={{ color: isDarkTheme ? "#fff" : "#000" }}
            >
              <img
                src="https://nftnavigator.xyz/_app/immutable/assets/android-chrome-192x192.44ed2806.png"
                style={{
                  height: "24px",
                  width: "24px",
                  borderRadius: "5px",
                }}
              />{" "}
              NFT Navigator
            </StyledLink>
          </li>
              </ExternalLinks>*/}
      </Container>
      <TransferModal
        title="Transfer NFT"
        loading={isTransferring}
        open={open}
        handleClose={() => setOpen(false)}
        onSave={handleTransfer}
      />
      {nft ? (
        <ListSaleModal
          title="List NFT for Sale"
          loading={isListing}
          open={openListSale}
          handleClose={() => setOpenListSale(false)}
          onSave={handleListSale}
          nft={nft}
        />
      ) : null}
    </Layout>
  ) : null;
};
