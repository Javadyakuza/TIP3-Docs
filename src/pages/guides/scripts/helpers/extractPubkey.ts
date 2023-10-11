import { ProviderRpcClient, Address, FullContractState } from 'everscale-inpage-provider';
export async function extractPubkey(
  provider: ProviderRpcClient,
  senderAddress: Address
): Promise<string> {
  // Fetching the user public key
  const accountFullState: FullContractState = (
    await provider.getFullContractState({ address: senderAddress })
  ).state!;
  const senderPublicKey: string = await provider.extractPublicKey(accountFullState.boc);

  return senderPublicKey;
}
