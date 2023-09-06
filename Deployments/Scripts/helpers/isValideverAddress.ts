import { Address, ProviderRpcClient } from 'everscale-inpage-provider';
/**
 * Checks if the event address valid and in pending status to call the saveWithdraw function in EMM network
 * @param address The event contract address on Everscale
 * @returns returns either an boolean representing the provided event address is valid or no or 1 if the event contract status was not pending (1) and 2 if the event contract address and type were incompatible
 */
export default async function isValidEverAddress(
  provider: ProviderRpcClient,
  address: string
): Promise<boolean> {
  // checking the length
  if (address.length < 66 || address.length > 66) {
    return false;
  }
  if (address.substring(0, 2) != '0:') {
    return false;
  }

  try {
    await provider.getBalance(new Address(address));

    return true;
  } catch (err) {
    return false;
  }
}
