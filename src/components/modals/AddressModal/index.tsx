import React, { useState } from "react";
import { Modal, Button, TextField, CircularProgress } from "@mui/material";

interface BaseModalPRops {
  open: boolean;
  loading: boolean;
  handleClose: () => void;
  onSave: (address: string) => Promise<void>;
  title?: string;
  buttonText?: string;
}

const BaseModal: React.FC<BaseModalPRops> = ({
  open,
  loading,
  handleClose,
  onSave,
  title = "Enter Address",
  buttonText = "Send",
}) => {
  const [address, setAddress] = useState("");

  const handleSave = async () => {
    await onSave(address);
    setAddress(""); // Clearing input after save
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="address-modal-title"
      aria-describedby="address-modal-description"
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "white",
          padding: "20px",
          minHeight: "200px",
          minWidth: "300px",
        }}
      >
        <h2 id="address-modal-title">{title}</h2>

        {!loading ? (
          <>
            <TextField
              id="address-input"
              label="Address"
              variant="outlined"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button
              size="large"
              sx={{ mt: 3 }}
              fullWidth
              variant="contained"
              onClick={handleSave}
            >
              {buttonText}
            </Button>
            <Button
              size="large"
              fullWidth
              variant="outlined"
              onClick={handleClose}
            >
              Cancel
            </Button>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              padding: "20px",
            }}
          >
            <CircularProgress size={200} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BaseModal;
