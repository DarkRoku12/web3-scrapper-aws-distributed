import * as DB from "@duckdb/node-api";

type InGenerateCsv = {
  parquetBucket: string;
  csvBucket: string;
  chainId: string;
  wallet: string;
};

export async function init()
{
  const instance = await DB.DuckDBInstance.fromCache( "my_duckdb.db" );
  const conn = await instance.connect();
  return conn;
}

export async function generateCsv( input: InGenerateCsv )
{

  const conn = await init();

  /// Read locally /// 
  // const load = await conn.run( /* SQL */ `
  //   CREATE OR REPLACE TABLE trxs AS
  //     SELECT * FROM "temp/*.parquet";  
  // ` );

  // const read = await conn.run( /* SQL */ `
  //   SELECT count(*) as count FROM trxs;
  // ` );

  // const copy = await conn.run( /* SQL */ `
  //   COPY (SELECT * FROM trxs) TO "temp/trxs.csv" (DELIMITER ",", HEADER, QUOTE '"', ESCAPE '"');
  // `);

  await conn.run( /* SQL */ `
    INSTALL httpfs;
    LOAD httpfs;
  `);

  const init_aws = await conn.run( /* SQL */ `
    CREATE OR REPLACE SECRET secret (
      TYPE s3,
      PROVIDER config,
      KEY_ID '${process.env.AWS_ACCESS_KEY_ID}',
      SECRET '${process.env.AWS_SECRET_ACCESS_KEY}',
      REGION '${process.env.AWS_REGION || "us-east-1"}'
    );
  `);

  const inBucketUri = `s3://${input.parquetBucket}/${input.chainId}/${input.wallet}/*.parquet`;
  const outBucketUri = `s3://${input.csvBucket}/${input.chainId}/${input.wallet}.csv`;

  // const inBucketUri = `s3://parquet-x5yzlw7r/0x1234567890abcdef1234567890abcdef12345678/1-1000-2000.parquet`;

  // Read .parquet files from S3.
  const read_s3 = await conn.run( /* SQL */ `
    CREATE OR REPLACE TABLE s3_trxs AS
      SELECT * FROM read_parquet( '${inBucketUri}', filename=true )
  `);

  const data = await conn.run( /* SQL */ `
      SELECT * FROM s3_trxs;
  `);

  // Copy .csv to S3.
  const copy_to_s3 = await conn.run( /* SQL */ `
    COPY s3_trxs TO '${outBucketUri}' (DELIMITER ",", HEADER, QUOTE '"', ESCAPE '"');
  `);

  return {
    inputFiles: inBucketUri,
    outputFiles: outBucketUri,
  };
}