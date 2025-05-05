import * as SDK from "aws-sdk";
import * as Dotenv from "dotenv-flow";
import * as cdk from "aws-cdk-lib";
import ExtServiceStack from "./stack-ext-service";
import WorkerStack from "./stack-worker";

// Load environment variables from .env files
Dotenv.config( {} );

// Function to get AWS Account ID using STS
async function getAwsAccountId(): Promise<string>
{
  try
  {
    const sts = new SDK.STS();
    const data = await sts.getCallerIdentity().promise();
    return data.Account || "";
  } catch ( error )
  {
    console.error( "Error getting AWS Account ID:", error );
    throw error;
  }
}

// Function to deploy the stack after getting the account ID
async function deployStack()
{
  try
  {
    const accountId = await getAwsAccountId();
    console.log( `Detected AWS Account ID: ${accountId}` );

    const env = {
      account: accountId,
      region: process.env.AWS_REGION || "us-east-1",
    } as const;

    // Create CDK app
    const app = new cdk.App();

    // Add ExtServiceStack.
    new ExtServiceStack( app, "ExtServiceStack", { env: env } );

    // Add WorkerStack.
    new WorkerStack( app, "WorkerStack", { env: env } );

    // Synthesize the app to generate CloudFormation templates.
    app.synth();
  } catch ( error )
  {
    console.error( "Failed to deploy stack:", error );
    process.exit( 1 );
  }
}

// Start the deployment process
deployStack();