# 🎓 VeriDegree

VeriDegree is a decentralized, privacy-preserving academic credential verification ecosystem. It leverages the Algorand blockchain to issue tamper-proof Soulbound Tokens (SBTs) representing degrees, IPFS for decentralized metadata storage, and Zero-Knowledge Proofs (zk-SNARKs) to allow students to prove their qualifications without revealing sensitive data like exact grades or CGPA.

## 📂 Project Structure

```text
veridegree/
├── src/
│   ├── app/                # Next.js App Router Pages & API Routes
│   │   └── api/            # Server-side logic (SBT Minting, AI Sanitization)
│   ├── components/         # Reusable UI components (Framer Motion)
│   ├── circuits/           # Circom ZK-SNARK source files
│   ├── lib/                # Shared utilities (Algorand, IPFS, Wallet)
│   └── styles/             # Global CSS & Tailwind configuration
├── public/                 # Static assets & compiled ZK artifacts (.wasm, .zkey)
└── tailwind.config.ts      # UI Design System tokens
```

## 🌟 Key Features

- **Cyber-Gold Premium UI:** A stunning, multi-million dollar aesthetic featuring glassmorphism, deep dark/gold gradients, and smooth micro-interactions powered by Framer Motion.
- **Immutable Credentials (SBTs):** Degrees are minted as Algorand Standard Assets (ASAs) with the `defaultFrozen` flag set to true, making them non-transferable "Soulbound" tokens tied permanently to the student's wallet.
- **BlindHire AI:** Integrated Google Gemini API to automatically sanitize uploaded resumes, stripping Personally Identifiable Information (PII) to ensure 100% bias-free recruitment based purely on extracted skills and experience.
- **Decentralized Storage:** Sensitive degree details (including Enrollment IDs) are converted to JSON metadata and pinned to IPFS (via Pinata) ensuring permanent, immutable storage.
- **Privacy-Preserving Verification (ZK-Proofs):** Students generate cryptographic proofs (using Circom & SnarkJS) via WebAssembly to prove their CGPA crosses a specific threshold without exposing the actual number to recruiters.
- **Talent-Fi Micro-Economy:** Recruiters pay a 5 ALGO "Talent Bounty" via Algorand Atomic Transfers (grouped transactions) to unlock a verified candidate's direct contact details, splitting the reward between the candidate and the university.

## 🛠️ Technology Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Framer Motion
- **AI Integration:** Google Gemini API (`@google/generative-ai`)
- **Blockchain Integration:** Algorand SDK (`algosdk` v3), Algorand Testnet
- **Wallet Connection:** `@blockshake/defly-connect` (Defly Wallet API)
- **Decentralized Storage:** IPFS integration via Pinata API
- **Zero-Knowledge Engineering:** `circom`, `circomlib`, `snarkjs` (Groth16 zk-SNARKs via WebAssembly)

## 🏗️ Architecture & Workflow

1.  **University Portal (Issuance):** An authenticated University admin enters the student's details, CGPA, and Enrollment ID. This metadata is uploaded to IPFS.
2.  **Algorand Minting:** The University mints a Soulbound Token using the IPFS URI, configuring themselves as the `clawback` and `manager` address.
3.  **Student Dashboard (Claiming & AI Profile):** The student receives the Asset ID and signs a 0-value "Opt-in" transaction. They can also use "BlindHire AI" to generate a bias-free, sanitised skills profile from their resume.
4.  **Finalizing Transfer (Clawback):** The University executes a Clawback transaction (`assetSender`) to bypass the SBT freeze and push the token to the student.
5.  **ZK-Proof Generation:** When requested by a recruiter, the student generates a ZK-Proof in their browser. `snarkjs` uses the private CGPA and public threshold to output a downloadable `.json` proof.
6.  **Public Verifier & Talent-Fi:** A recruiter verifies the QR code/SBT. If the ZK-Proof is valid, they use an Algorand Atomic Transfer to pay a 5 ALGO bounty to unlock the candidate's hidden contact details.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- An Algorand wallet (Defly Wallet recommended) configured for the Testnet
- A Pinata account for IPFS uploads (API Key & Secret)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/veridegree.git
    cd veridegree
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root directory and add your keys (Pinata for IPFS, Gemini for AI, NextAuth for sessions):

    ```env
    NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
    NEXT_PUBLIC_PINATA_SECRET_API_KEY=your_pinata_secret_api_key

    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=your_nextauth_jwt_secret

    GEMINI_API_KEY=your_google_ai_studio_api_key
    ```

    > [!IMPORTANT]
    > **Gemini Model Info**: The project is optimized to use `gemini-flash-latest` (Gemini 2.0 Flash Lite/Latest) for the BlindHire AI feature. If you encounter `429 Too Many Requests` or `404 Not Found` errors, ensure your API key has available quota for this specific model in [Google AI Studio](https://aistudio.google.com/).

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  **Access the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Zero-Knowledge Circuits

The ZK circuits are written in `circom` and located in `src/circuits/cgpa_verify.circom`. The necessary compiled artifacts (`cgpa_verify.wasm`, `cgpa_verify_0001.zkey`, and `verification_key.json`) are pre-generated and stored in `public/zk/` for immediate use by the frontend `snarkjs` implementation.

## 📄 License

This project is licensed under the MIT License.
