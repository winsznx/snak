import { createConfig, http } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const wcId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(wcId
      ? [
          walletConnect({
            projectId: wcId,
            metadata: {
              name: "Snak",
              description: "Sats-staked snake battle royale.",
              url: "https://snak.timjosh507.workers.dev",
              icons: [],
            },
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: {
    [celoAlfajores.id]: http(),
    [celo.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

const ZERO = "0x0000000000000000000000000000000000000000" as const;

export const SNAK_ADDRESS = (process.env.NEXT_PUBLIC_SNAK_ADDRESS ?? ZERO) as `0x${string}`;
export const CUSD_ADDRESS = (process.env.NEXT_PUBLIC_CUSD_ADDRESS ?? ZERO) as `0x${string}`;
export const ACTIVE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? celo.id);
export const isSnakDeployed = SNAK_ADDRESS !== ZERO;
