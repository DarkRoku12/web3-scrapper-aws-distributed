import * as SDK from "aws-sdk";
import Dotenv from "dotenv-flow";

// Load environment variables
Dotenv.config();

function assert_env( key: string ) 
{
  const value = process.env[key];
  if ( !value ) throw new Error( `Missing environment variable: ${key}` );
  return value;
}

// Initialize the ECS client
const ecs = new SDK.ECS( {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: assert_env( "AWS_ACCESS_KEY_ID" ),
    secretAccessKey: assert_env( "AWS_SECRET_ACCESS_KEY" ),
  }
} );

const AWS_CLUSTER = assert_env( "AWS_CLUSTER" );
const AWS_TASK_DEFINITION = assert_env( "AWS_TASK_DEFINITION" );
const AWS_SUBNET = assert_env( "AWS_SUBNET" );

/** Launch a Fargate task with the specified configuration */
export async function launchTask( params: {
  wallet: string;
  chainId: string;
  fromBlock: number;
  toBlock: number;
  task: "extract" | "save";
} ): Promise<SDK.ECS.Types.RunTaskResponse>
{
  console.log( `Launching ${params.task} task for wallet ${params.wallet} on chain ${params.chainId}, blocks ${params.fromBlock}-${params.toBlock}` );

  const taskParams: SDK.ECS.Types.RunTaskRequest = {
    cluster: AWS_CLUSTER,
    taskDefinition: AWS_TASK_DEFINITION,
    group: `${params.wallet}-${params.chainId}`,
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: [AWS_SUBNET],
        // securityGroups: [],
        assignPublicIp: "ENABLED"
      }
    },
    overrides: {
      containerOverrides: [
        {
          name: "web3_worker",
          environment: [
            { name: "TARGET_URL", value: process.env.TARGET_URL! },
            { name: "TASK", value: params.task },
            { name: "WALLET", value: params.wallet },
            { name: "CHAIN_ID", value: params.chainId },
            { name: "FROM_BLOCK", value: String( params.fromBlock ) },
            { name: "TO_BLOCK", value: String( params.toBlock ) }
          ]
        }
      ]
    }
  };

  try
  {
    const result = await ecs.runTask( taskParams ).promise();
    return result;
  } catch ( error )
  {
    console.error( "Error launching task:", error );
    throw error;
  }
}

/** Check the status of a running task */
export async function checkTaskStatus( taskArns: string[] ): Promise<SDK.ECS.Types.DescribeTasksResponse>
{
  try
  {
    const result = await ecs.describeTasks( {
      cluster: AWS_CLUSTER,
      tasks: taskArns,
    } ).promise();

    return result;
  } catch ( error )
  {
    console.error( "Error checking task status:", error );
    throw error;
  }
}
