import { Icon } from "@mui/material";
import React from "react";
import styled from "styled-components";

const SearchRoot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--Spacing-400, 8px);
  flex: 1 0 0;
`;

const InputContainer = styled.div`
  display: flex;
  padding: var(--Spacing-700, 16px) var(--Spacing-600, 12px);
  align-items: center;
  gap: var(--Spacing-400, 8px);
  align-self: stretch;
  /* style */
  border-radius: var(--Radius-300, 8px);
  border: 1.5px solid
    var(
      --Color-Neutral-Stroke-Primary-Static-Contrast,
      rgba(255, 255, 255, 0.5)
    );
  background: var(
    --Color-Comp-Input-Background-Default,
    rgba(255, 255, 255, 0)
  );
`;

const PlaceholderContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1 0 0;
`;

const Placeholder = styled.input`
  /* layout */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  flex: 1 0 0;
  /* type */
  overflow: hidden;
  color: var(--Color-Neutral-Element-Secondary, #f6f6f8);
  font-feature-settings: "clig" off, "liga" off;
  text-overflow: ellipsis;
  font-family: "Plus Jakarta Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 16.8px */
`;

const SearchIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.58341 17.4993C13.9557 17.4993 17.5001 13.9549 17.5001 9.58268C17.5001 5.21043 13.9557 1.66602 9.58341 1.66602C5.21116 1.66602 1.66675 5.21043 1.66675 9.58268C1.66675 13.9549 5.21116 17.4993 9.58341 17.4993Z"
        stroke="white"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M18.3334 18.3327L16.6667 16.666"
        stroke="white"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const StyledIcon = styled(SearchIcon)`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
`;

const IconContainer = styled.div`
  /* layout */
  display: flex;
  width: var(--Size-700, 20px);
  height: var(--Size-700, 20px);
  justify-content: center;
  align-items: center;
`;

interface SearchProps {
  onChange: (input: string) => void;
}

const Search: React.FC<SearchProps> = ({ onChange }) => {
  return (
    <SearchRoot>
      <InputContainer>
        <IconContainer>
          <StyledIcon />
        </IconContainer>
        <PlaceholderContainer>
          <Placeholder
            onChange={(e) => {
              onChange(e.target.value);
            }}
          />
        </PlaceholderContainer>
      </InputContainer>
    </SearchRoot>
  );
};

export default Search;
