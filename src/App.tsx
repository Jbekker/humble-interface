import React, { useEffect } from "react";
import { WalletProvider, useInitializeProviders } from "@txnlab/use-wallet";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import store, { RootState } from "./store/store";
import Navbar from "./components/Navbar";
import { routes } from "./routes";
import { getProviderInit } from "./wallets";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styled from "styled-components";
import Layout from "./layouts/Default";
import { getPools } from "./store/poolSlice";
import { UnknownAction } from "@reduxjs/toolkit";
import { getToken, getTokens } from "./store/tokenSlice";
import { getPoolBals } from "./store/poolBalsSlice";
import { getVolume } from "./store/volumeSlice";

const BackgroundLayer = styled.div`
  width: 100%;
  height: 100%;
  top: 0;
`;

const BackgroundLayer2 = styled(BackgroundLayer)`
  background: url(/static/pattern.svg);
  background-repeat: no-repeat;
  background-position-y: bottom;
  background-position-x: right;
`;

interface AppContainerProps {
  children: React.ReactNode;
}
const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  const dispatch = useDispatch();
  const poolsStatus = useSelector((state: RootState) => state.pools.status);
  const tokensStatus = useSelector((state: RootState) => state.tokens.status);
  useEffect(() => {
    dispatch(getPools() as unknown as UnknownAction);
  }, [dispatch]);
  useEffect(() => {
    dispatch(getTokens() as unknown as UnknownAction);
  }, [dispatch]);
  // useEffect(() => {
  //   dispatch(getPoolBals() as unknown as UnknownAction);
  // }, [dispatch]);
  // useEffect(() => {
  //   dispatch(getVolume() as unknown as UnknownAction);
  // }, [dispatch]);
  const [ready, setReady] = React.useState(false);
  // useEffect(() => {
  //   if (poolsStatus === "succeeded") {
  //     (async () => {
  //       await Promise.all([
  //         ...pools.map((pool) => getToken(pool.tokA)),
  //         ...pools.map((pool) => getToken(pool.tokB)),
  //       ]);
  //       setReady(true);
  //     })();
  //   }
  // }, [poolsStatus]);
  useEffect(() => {
    if (poolsStatus === "succeeded" && tokensStatus === "succeeded") {
      setReady(true);
    }
  }, [poolsStatus, tokensStatus]);
  const isLoading = !ready;
  if (isLoading) return;
  return (
    <div
      style={{
        color: isDarkTheme ? "#fff" : "#000",
        transition: "all 0.25s linear",
      }}
    >
      <BackgroundLayer
        className="background-layer"
        style={{
          background: isDarkTheme ? "#41137E" : "#FFFFFF",
        }}
      ></BackgroundLayer>
      <BackgroundLayer className="background-layer">
        {isDarkTheme ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: 291.92,
                height: 291.92,
                left: 80.46,
                top: 49,
                position: "absolute",
                transform: "rotate(16deg)",
                transformOrigin: "0 0",
                opacity: 0.2,
                background: "#D4A0FF",
                boxShadow: "200px 200px 200px ",
                borderRadius: 9999,
                filter: "blur(200px)",
              }}
            />
            <div
              style={{
                width: 291.92,
                height: 291.92,
                left: 918.33,
                top: 278,
                position: "absolute",
                transform: "rotate(-58deg)",
                transformOrigin: "0 0",
                opacity: 0.2,
                background: "#D4A0FF",
                boxShadow: "200px 200px 200px ",
                borderRadius: 9999,
                filter: "blur(200px)",
              }}
            />
            <div
              style={{
                width: 320.4,
                height: 320.4,
                left: 1162.67,
                top: 258,
                position: "absolute",
                transform: "rotate(102deg)",
                transformOrigin: "0 0",
                opacity: 0.8,
                background: "#41137E",
                boxShadow: "200px 200px 200px ",
                borderRadius: 9999,
                filter: "blur(200px)",
              }}
            />
            <div
              style={{
                width: 359.56,
                height: 359.56,
                left: 246.54,
                top: 495.46,
                position: "absolute",
                transform: "rotate(-122deg)",
                transformOrigin: "0 0",
                opacity: 0.5,
                background: "#41137E",
                boxShadow: "200px 200px 200px ",
                borderRadius: 9999,
                filter: "blur(200px)",
              }}
            />
            <div
              style={{
                width: 420.08,
                height: 420.08,
                left: 803.33,
                top: 766,
                position: "absolute",
                transform: "rotate(-17deg)",
                transformOrigin: "0 0",
                opacity: 0.95,
                background: "#41137E",
                boxShadow: "200px 200px 200px ",
                borderRadius: 9999,
                filter: "blur(200px)",
              }}
            />
            <div
              style={{
                width: 227.84,
                height: 227.84,
                left: 512.38,
                top: 734,
                position: "absolute",
                transform: "rotate(80deg)",
                transformOrigin: "0 0",
                opacity: 0.96,
                background: "#41137E",
                boxShadow: "200px 200px 200px ",
                borderRadius: 9999,
                filter: "blur(200px)",
              }}
            />
            <div
              style={{
                width: 277.68,
                height: 277.68,
                left: 722.71,
                top: 890,
                position: "absolute",
                transform: "rotate(123deg)",
                transformOrigin: "0 0",
                opacity: 0.1,
                background: "#F1EAFC",
                boxShadow: "200px 200px 200px ",
                borderRadius: 9999,
                filter: "blur(200px)",
              }}
            />
            <div
              style={{
                width: 234.96,
                height: 234.96,
                left: 1430.67,
                top: 1031,
                position: "absolute",
                transform: "rotate(157deg)",
                transformOrigin: "0 0",
                opacity: 0.2,
                background: "#F1EAFC",
                boxShadow: "200px 200px 200px ",
                borderRadius: 9999,
                filter: "blur(200px)",
              }}
            />
          </div>
        ) : null}
      </BackgroundLayer>
      <BackgroundLayer2 className="background-layer"></BackgroundLayer2>
      <div className="content-layer" style={{ width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const providers = useInitializeProviders(getProviderInit());
  return (
    <WalletProvider value={providers}>
      <Provider store={store}>
        <AppContainer>
          <Router>
            <Layout>
              <Routes>
                {routes.map((el) => (
                  <Route path={el.path} Component={el.Component} />
                ))}
              </Routes>
            </Layout>
          </Router>
        </AppContainer>
      </Provider>
      <ToastContainer />
    </WalletProvider>
  );
};

export default App;
