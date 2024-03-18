import styled from "@emotion/styled";
import React, { FC } from "react";
import { RootState } from "../../store/store";
import { useSelector } from "react-redux";
import { Box } from "@mui/material";

const FooterRoot = styled.footer`
  display: flex;
  width: 100%;
  height: 52px;
  min-width: 420px;
  justify-content: space-between;
  align-items: flex-start;
  flex-shrink: 0;
  background: var(--Color-Brand-Primary, #41137e);
`;

const Footer: FC = () => {
  /* Theme */
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  return (
    <Box>
      <FooterRoot />
    </Box>
  );
};

export default Footer;
