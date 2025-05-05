import * as S3 from "@aws-sdk/client-s3";
import * as LibStorage from "@aws-sdk/lib-storage";
import * as Fs from "fs";

type S3UploadInputPath = { path: string; data?: undefined; };
type S3UploadInputData = { path?: undefined; data: ReadableStream | string | Uint8Array | Buffer; };

export type S3UploadInput = {
  name: string;
  bucket: string;
  public: boolean;
  params?: Partial<S3.PutObjectCommandInput>;
} & ( S3UploadInputPath | S3UploadInputData );

const Client = new S3.S3Client( {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
} );

/** Uploads a file to AWS S3 */
export async function upload( input: S3UploadInput ) 
{
  const params: S3.PutObjectCommandInput = {
    ...input.params,
    Bucket: input.bucket,
    Key: input.name,
  };

  if ( input.public ) 
  {
    params.ACL = "public-read";
  }

  if ( input.path ) 
  {
    params.Body = Fs.createReadStream( input.path );
  }
  else 
  {
    params.Body = input.data;
  }

  try 
  {
    const upload_task = new LibStorage.Upload( { client: Client, params: params } );
    const result = await upload_task.done();
    return result as S3.CompleteMultipartUploadCommandOutput;
  }
  catch ( e: any ) 
  {
    const err = String( e ? e.message : e );
    throw new Error( `Failed to upload file to S3: ${err}` );
  }
}