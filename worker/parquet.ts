import * as S3 from "./s3";
import * as Fs from "fs";
import * as Path from "path";
import * as Parquet from "@dsnp/parquetjs";
import { Transaction } from "./types";

export type UploadParquet = {
  bucket: string;
  filename: string;
  tempFilePath: string;
};

export type CreateParquet = {
  transactions: Array<Transaction>;
  tempFilePath: string;
};

export async function upload( input: UploadParquet )
{
  console.log( input );

  const uploadResult = await S3.upload( {
    public: true,
    bucket: input.bucket,
    name: input.filename,
    path: input.tempFilePath,
    params: { ContentType: "application/vnd.apache.parquet" }
  } );

  return uploadResult;
}


/**
 * Function to create a parquet file from transaction entries and upload to S3
 */
export async function create( input: CreateParquet )
{
  try
  {
    // Define the schema based on TransactionEntry type.
    const schema = new Parquet.ParquetSchema( {
      id: { type: "UTF8", optional: false },
      chain_id: { type: "UTF8" },
      category: { type: "UTF8" },
      transaction_type: { type: "UTF8" },
      transaction_hash: { type: "UTF8" },
      block_number: { type: "INT64" },
      date_time: { type: "UTF8" },
      from_address: { type: "UTF8" },
      to_address: { type: "UTF8" },
      asset_contract_address: { type: "UTF8", optional: true },
      asset_symbol_name: { type: "UTF8" },
      value_amount: { type: "DECIMAL", scale: 8, precision: 18 }, // Library 'bug' when precision > 18.
      gas_fee_eth: { type: "DECIMAL", scale: 8, precision: 18 }, // Library 'bug' when precision > 18.
      token_id: { type: "UTF8", optional: true }
    } );

    // Create a temporary file path
    const tempDir = Path.join( process.cwd(), "temp" );

    Fs.mkdirSync( tempDir, { recursive: true } );

    const tempFilePath = Path.join( tempDir, input.tempFilePath );

    // Create a new ParquetWriter
    const writer = await Parquet.ParquetWriter.openFile( schema, tempFilePath );

    // Write each transaction to the parquet file
    for ( const transaction of input.transactions )
    {
      await writer.appendRow( {
        id: transaction.id,
        chain_id: transaction.chain_id,
        category: transaction.category,
        transaction_type: transaction.transaction_type,
        transaction_hash: transaction.transaction_hash,
        block_number: transaction.block_number,
        date_time: transaction.date_time,
        from_address: transaction.from_address,
        to_address: transaction.to_address,
        asset_contract_address: transaction.asset_contract_address || "",
        asset_symbol_name: transaction.asset_symbol_name,
        value_amount: Number( transaction.value_amount ),
        gas_fee_eth: Number( transaction.gas_fee_eth ),
        token_id: transaction.token_id || ""
      } );
    }

    // Close the writer to ensure all data is flushed
    await writer.close();

    return {
      path: tempFilePath,
    };
  } catch ( error )
  {
    console.error( "Error in createAndUploadParquetFile:", error );
    throw error;
  }
}