import { ChainId } from "../../api/utils";
import { faker } from "@faker-js/faker";
import { Web3Provider } from "@ethersproject/providers";
import { Signer } from "@ethersproject/abstract-signer";

interface MockUseWalletOverrides {
  addressToUse: string;
  chainIdToUse: number;
  chainNameToUse: string;
  providerToUse: Partial<Web3Provider>;
  signerToUse: Partial<Signer>;
}

interface MockWallet {
  address: string;
  chain: {
    id: number;
    name: string;
  };
  provider: Web3Provider;
  signer?: Signer;
}

export const getMockWallet = (
  overrides?: Partial<MockUseWalletOverrides>
): MockWallet => {
  const values: MockUseWalletOverrides = {
    addressToUse: faker.finance.ethereumAddress(),
    chainIdToUse: ChainId.GOERLI_CHAIN_ID,
    chainNameToUse: "Goerli",
    providerToUse: {
      getNetwork: () =>
        Promise.resolve({
          chainId: ChainId.GOERLI_CHAIN_ID,
          name: "Goerli",
        }),
    },
    signerToUse: {
      getChainId: () => Promise.resolve(ChainId.GOERLI_CHAIN_ID),
    },
    ...overrides,
  };

  return {
    chain: {
      id: values.chainIdToUse,
      name: values.chainNameToUse,
    },
    address: values.addressToUse,
    provider: values.providerToUse as Web3Provider,
    signer: values.signerToUse as Signer,
  };
};

/* Usage:

To be able to override specific wallet values in individual tests:
  use `jest.mock("<file path>/features/common/Auth")` at the beginning
  of the test file,
  and use `(useWallet as jest.Mock).mockReturnValue(getMockWallet())`
  before each test, or in the individual test.
  [note getMockWallet accept optional overrides]

To use the default wallet values for all tests in a file,
  use
    `jest.mock("<file path>/features/common/Auth", () => ({
       useWallet: () => mockWallet,
     }));`
  at the beginning of the test file.

Note:
    we are unable to export a default mock implementation
    due to CRA using `resetMocks: true` which breaks the expected
    jest manual mock behavior by resetting the exported mock before each test.
    see https://github.com/facebook/create-react-app/issues/9935
*/

export const mockWallet = {
  chain: {
    id: ChainId.GOERLI_CHAIN_ID,
    name: "Goerli",
  },
  address: faker.finance.ethereumAddress(),
  provider: {
    getNetwork: () =>
      Promise.resolve({
        chainId: ChainId.GOERLI_CHAIN_ID,
        name: "Goerli",
      }),
  },
  signer: {
    getChainId: () => Promise.resolve(ChainId.GOERLI_CHAIN_ID),
  },
};

export const useWallet = jest.fn();
