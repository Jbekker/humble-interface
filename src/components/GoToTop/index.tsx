import React from "react";
import { Button, Fade } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import useScreenSize from "../../hooks/useScreenSize";
import { MOBILE_SCREEN_THRESHOLD } from "../../constants/screenSizes";

interface GoTopTopProps {
  onClick: () => void;
}

const GoToTop: React.FC<GoTopTopProps> = ({ onClick }) => {
  const screenSize = useScreenSize();
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  const styles = {
    button: {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      borderRadius: "50%",
    } as React.CSSProperties,
    icon: {
      color: isDarkTheme ? "#fff" : "rgb(25, 118, 210)", // Set the icon color to white
      margin: "15px",
    } as React.CSSProperties,
  };
  const handleScrollToTop = () => {
    onClick();
    const element = document.getElementById("navbar-root");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
  const isVisible = screenSize.width > MOBILE_SCREEN_THRESHOLD;
  return (
    <Fade in={isVisible}>
      <Button style={styles.button} variant="text" onClick={handleScrollToTop}>
        <ArrowUpwardIcon fontSize="large" style={styles.icon} />
      </Button>
    </Fade>
  );
};

export default GoToTop;
