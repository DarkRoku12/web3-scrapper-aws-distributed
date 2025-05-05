import crypto from "node:crypto";

type TransactionCategory = "external" | "internal" | "token";

type TransactionType = "external" | "internal" | "erc20" | "erc721" | "erc1155";

export type TransactionEntry = {
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
  value_amount: string;
  gas_fee_eth: string;
  token_id: string | null;
};

export type InTransactionGeneration = {
  chainId: string;
  wallet: string;
  blockFrom: number;
  blockTo: number;
  count?: number;
};

/**
 * Generate a deterministic hash based on input parameters and salt
 */
function generateDeterministicHash( inputs: any[], salt: string ): string
{
  const inputString = inputs.join( "" ) + salt;
  return crypto.createHash( "sha256" ).update( inputString ).digest( "hex" );
}

/**
 * Generate a deterministic hex address
 */
function generateAddress( seed: string ): string
{
  const hash = crypto.createHash( "sha256" ).update( seed ).digest( "hex" );
  return "0x" + hash.substring( 0, 40 );
}

/**
 * Generate a date between blockFrom and blockTo with deterministic randomness
 */
function generateDateTime( blockFrom: number, blockTo: number, index: number ): string
{
  // Assume blocks are 15 seconds apart on average
  const startTime = new Date( "2023-01-01" ).getTime();
  const blockSpan = blockTo - blockFrom;

  // Use index to deterministically pick a point in the range
  const blockOffset = Math.floor( ( index / 1000 ) * blockSpan );
  const timestamp = startTime + ( blockFrom + blockOffset ) * 15000;

  return new Date( timestamp ).toISOString();
}

/**
 * Generate a list of cryptocurrency symbols
 */
function getAssetSymbols(): string[]
{
  return ["ETH", "USDT", "USDC", "DAI", "LINK", "WETH", "MATIC", "BNB", "SHIB", "UNI", "AAVE"];
}

/**
 * Generate a deterministic decimal string
 */
function generateDecimalValue( seed: string, max: number, decimals: number ): string
{
  const hash = crypto.createHash( "md5" ).update( seed ).digest( "hex" );
  const value = parseInt( hash.substring( 0, 8 ), 16 ) / Math.pow( 2, 32 );
  const amount = ( value * max ).toFixed( decimals );
  return amount;
}

/**
 * Generate transactions based on input parameters
 */
export function generate( params: InTransactionGeneration ): TransactionEntry[]
{
  const { chainId, wallet, blockFrom, blockTo, count = 1000 } = params;

  const transactions: TransactionEntry[] = [];
  const externalCount = count * 0.25; // 25% external
  const internalCount = count * 0.25; // 25% internal
  const tokenCount = count * 0.5; // 50% token transactions

  // Note: Token distribution is handled through inline calculations.
  const symbols = getAssetSymbols();

  // Generate all transactions
  for ( let i = 0; i < count; i++ )
  {
    // Deterministic inputs
    const seed = `${chainId}-${wallet}-${blockFrom}-${blockTo}-${i}`;
    const txHash = "0x" + generateDeterministicHash( [seed], "tx" );

    // Determine transaction type based on index
    let category: TransactionCategory;
    let txType: TransactionType;

    if ( i < externalCount )
    {
      category = "external";
      txType = "external";
    } else if ( i < externalCount + internalCount )
    {
      category = "internal";
      txType = "internal";
    } else
    {
      category = "token";
      // Calculate position within token range
      const tokenPosition = ( i - externalCount - internalCount ) / tokenCount;

      if ( tokenPosition < 0.6 )
      {
        txType = "erc20";
      } else if ( tokenPosition < 0.9 )
      {
        txType = "erc721";
      } else
      {
        txType = "erc1155";
      }
    }

    // Generate block number within range
    const blockRange = blockTo - blockFrom;
    const blockOffset = Math.floor( ( i / count ) * blockRange );
    const blockNumber = blockFrom + blockOffset;

    // Generate addresses
    const fromAddress = i % 3 === 0 ? wallet : generateAddress( `${seed}-from` );
    const toAddress = i % 5 === 0 ? wallet : generateAddress( `${seed}-to` );

    // Asset details
    let assetContractAddress: string | null = null;
    let assetSymbol = "ETH";
    let tokenId: string | null = null;

    if ( category === "token" )
    {
      assetContractAddress = generateAddress( `${seed}-contract` );
      const symbolIndex = parseInt( txHash.slice( -2 ), 16 ) % symbols.length;
      assetSymbol = symbols[symbolIndex];

      if ( txType === "erc721" || txType === "erc1155" )
      {
        tokenId = BigInt( "0x" + txHash.slice( -12 ) ).toString();
      }
    }

    // Generate values
    const valueAmount = generateDecimalValue( `${seed}-value`, txType === "external" ? 10.0 : 1000.0, 8 );
    const gasFee = generateDecimalValue( `${seed}-gas`, 0.05, 8 );

    // Generate date time
    const dateTime = generateDateTime( blockFrom, blockTo, i );

    // Create transaction entry
    const transaction: TransactionEntry = {
      id: `${txHash}-${i}`,
      chain_id: chainId,
      category,
      transaction_type: txType,
      transaction_hash: txHash,
      block_number: blockNumber,
      date_time: dateTime,
      from_address: fromAddress,
      to_address: toAddress,
      asset_contract_address: assetContractAddress,
      asset_symbol_name: assetSymbol,
      value_amount: valueAmount,
      gas_fee_eth: gasFee,
      token_id: tokenId
    };

    transactions.push( transaction );
  }

  return transactions;
}
