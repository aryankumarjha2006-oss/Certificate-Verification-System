# Member 1 Blockchain Admin / Issuer Demo Frontend

This is a **Blockchain Admin / Issuer Dashboard** strictly for demonstrating the functionality of the smart contracts developed by Member 1 for the Certificate Verification System.

It interacts with the REAL deployed smart contracts on a local Hardhat network.

## Architecture

This frontend is completely isolated from Member 2's application.
- **Frontend Framework:** React + Vite
- **Blockchain Interaction:** `ethers.js` (v6)
- **Styling:** Vanilla CSS

## Manual Steps Needed to Run the Frontend

### 1. Start Local Blockchain Node
Open a terminal in the `member-1-blockchain-core` root and run:
```bash
npx hardhat node
```

### 2. Deploy Contracts
In a second terminal in the `member-1-blockchain-core` root, deploy the contracts:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Important:** Note the deployed addresses. They must match the ones in `frontend/src/services/blockchain.js`. (The code currently has placeholders for addresses deployed on the first run).

### 3. Configure MetaMask
- Open MetaMask in your browser.
- Go to Settings -> Networks -> Add Network manually.
- Network Name: Hardhat Local
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `GO`

Import one of the Private Keys displayed in the terminal where you ran `npx hardhat node`. Do **not** use real funds or real private keys on this network!

### 4. Start the Frontend
In a new terminal in the `member-1-blockchain-core/frontend` directory:
```bash
npm install
npm run dev
```

### 5. Open Dashboard
Open `http://localhost:5173` in your browser. Click "Connect Wallet" using MetaMask.

## Features Included
- Register Institutions (Platform Admin)
- Authorize Issuers (Institution Wallet)
- Issue Certificates
- Verify Certificate Hash
- Revoke Certificates
- View Live On-Chain Activity (Event listener)

## Important Distinction for Member 2
This frontend is **ONLY** a blockchain demonstration/admin interface for Member 1. It does **not** connect to Member 2's backend. Member 2 is responsible for the complete user portal, PDF generation, QR codes, student login, and the public production-ready verification portal.
