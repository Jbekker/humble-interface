import { useWallet } from "@txnlab/use-wallet-react";

function WalletMenu() {
  const { wallets, activeWallet, activeAccount } = useWallet();

  return (
    <div>
      <h2>Wallets</h2>
      <ul>
        {wallets.map((wallet) => (
          <li key={wallet.id}>
            <button onClick={() => wallet.connect()}>
              {wallet.metadata.name}
            </button>
          </li>
        ))}
      </ul>

      {activeWallet && (
        <div>
          <h2>Active Wallet</h2>
          <p>{activeWallet.metadata.name}</p>
          <h2>Active Account</h2>
          <p>{activeAccount?.address}</p>
          <button onClick={() => activeWallet.disconnect()}>Disconnect</button>
        </div>
      )}
    </div>
  );
}

export default WalletMenu;
