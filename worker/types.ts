export type TransactionCategory = "external" | "internal" | "token";

export type TransactionType = "external" | "internal" | "erc20" | "erc721" | "erc1155";

export type Transaction = {
  id: string;
  chain_id: string;
  category: TransactionCategory;
  transaction_type: TransactionType;
  transaction_hash: string;
  block_number: number;
  date_time: string;
  from_address: string;
  to_address: string;
  asset_contract_address: string | null;
  asset_symbol_name: string;
  value_amount: string | number;
  gas_fee_eth: string | number;
  token_id: string | null;
};
