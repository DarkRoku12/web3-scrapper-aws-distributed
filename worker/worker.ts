import "./env-loader";
import * as DuckDB from "./duck-db";
import * as Fetch from "./fetch";
import * as Parquet from "./parquet";
import * as Types from "./types";

function assert_env( key: string ) 
{
  const value = process.env[key];
  if ( !value ) throw new Error( `Missing environment variable: ${key}` );
  return value;
}

function genTestTransactions()
{
  const transactions: Array<Types.Transaction> = [];

  for ( let i = 0; i < 10; i++ )
  {
    transactions.push( {
      id: i.toString().padStart( 4, "0" ),
      chain_id: "1",
      category: "token",
      transaction_type: "erc20",
      transaction_hash: `0x${i.toString( 16 )}`,
      block_number: i,
      date_time: new Date().toISOString(),
      from_address: `0xFrom${i}`,
      to_address: `0xTo${i}`,
      asset_contract_address: `0xAsset${i}`,
      asset_symbol_name: `Symbol${i}`,
      value_amount: Math.random() * 10000,
      gas_fee_eth: Math.random() * 100,
      token_id: `Token${i}`
    } );
  }

  return transactions;
}

export async function extract()
{
  console.log( "[task] Extracting transaction parquets" );

  const parquetBucket = assert_env( "AWS_PARQUET_BUCKET" );
  const chainId = assert_env( "CHAIN_ID" );
  const wallet = assert_env( "WALLET" );
  let blockFrom = Number( assert_env( "FROM_BLOCK" ) );
  let blockTo = Number( assert_env( "TO_BLOCK" ) );


  const base_url = process.env.TARGET_URL || "http://localhost:7010/assets";
  const url = `${base_url}/${chainId}/${wallet}/${blockFrom}/${blockTo}`;

  try
  {
    const result = await Fetch.get<Types.Transaction[]>( url );
    const fname = `${blockFrom}-${blockTo}.parquet`;
    const out = await Parquet.create( { transactions: result, tempFilePath: `${chainId}-${wallet}-${fname}` } );
    const upload = await Parquet.upload( { bucket: parquetBucket, filename: `${chainId}/${wallet}/${fname}`, tempFilePath: out.path } );
    console.log( "Upload result:", upload );
  }
  catch ( error )
  {
    console.error( "Error:", error );
  }
}

export async function save()
{
  console.log( "[task] Saving transactions csv" );

  const result = await DuckDB.generateCsv( {
    parquetBucket: assert_env( "AWS_PARQUET_BUCKET" ),
    csvBucket: assert_env( "AWS_CSV_BUCKET" ),
    wallet: assert_env( "WALLET" ),
    chainId: assert_env( "CHAIN_ID" ),
  } );

  console.log( "Result:", result );
}

const task = String( process.env.TASK || "" ).toLowerCase().trim();

if ( task == "extract" )
{
  extract();
}
else if ( task == "save" )
{
  save();
}
else
{
  console.error( "Unknown task:", { task } );
  process.exit( 12 );
}