/**
 * deployRootParams params required to deploy the token root contract
 * @dev amount must be principals and not a "BigNumber" !!
 */
export interface deployRootParams {
  initialSupplyTo: string;
  rootOwner: string;
  name: string;
  symbol: string;
  decimals: number;
  disableMint: boolean;
  disableBurnByRoot: boolean;
  pauseBurn: boolean;
  initialSupply: number;
}
