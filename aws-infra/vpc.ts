import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";

export function getVpc( stack: cdk.Stack ): ec2.IVpc
{
  const vpc = new ec2.Vpc( stack, "Web3ScrapperVpc", {
    maxAzs: 2,
    natGateways: 1,
  } );

  return vpc;
}

// Create a VPC for the ECS cluster