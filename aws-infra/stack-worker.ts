import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";
import * as VPC from "./vpc";
import { Construct } from "constructs";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { ApplicationProtocol } from "aws-cdk-lib/aws-elasticloadbalancingv2";

export class WorkerStack extends cdk.Stack
{
  constructor( scope: Construct, id: string, props?: cdk.StackProps )
  {
    super( scope, id, props );

    // Generate a random suffix for bucket names to avoid conflicts
    const randomSuffix = "x5yzlw7r"; // Math.random().toString( 36 ).substring( 2, 10 );

    // Create S3 buckets for Parquet and CSV files
    const parquetBucket = new s3.Bucket( this, "ParquetBucket", {
      bucketName: `parquet-${randomSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only, use RETAIN for production
      autoDeleteObjects: true, // For development only, remove for production
      versioned: true,
      blockPublicAccess: new s3.BlockPublicAccess( {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
        ignorePublicAcls: false,
      } ),
      publicReadAccess: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
    } );

    const csvBucket = new s3.Bucket( this, "CSVBucket", {
      bucketName: `csv-${randomSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only, use RETAIN for production
      autoDeleteObjects: true, // For development only, remove for production
      versioned: true,
      blockPublicAccess: new s3.BlockPublicAccess( {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
        ignorePublicAcls: false,
      } ),
      publicReadAccess: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
    } );

    // VPC for the ECS task
    const vpc = VPC.getVpc( this );

    // Create ECS Cluster
    const cluster = new ecs.Cluster( this, "WorkerCluster", {
      vpc: vpc,
      containerInsights: true,
    } );

    // Create IAM role for the task execution
    const taskExecutionRole = new iam.Role( this, "WorkerTaskExecutionRole", {
      assumedBy: new iam.ServicePrincipal( "ecs-tasks.amazonaws.com" ),
    } );

    // Add policies for S3 access, CloudWatch logs, etc.
    taskExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName( "service-role/AmazonECSTaskExecutionRolePolicy" )
    );

    // Add permissions to the task role to access S3 buckets
    const taskRole = new iam.Role( this, "WorkerTaskRole", {
      assumedBy: new iam.ServicePrincipal( "ecs-tasks.amazonaws.com" ),
    } );

    // Grant the task role permissions to read/write to the S3 buckets
    parquetBucket.grantReadWrite( taskRole );
    csvBucket.grantReadWrite( taskRole );

    // Define the task definition
    const taskDefinition = new ecs.FargateTaskDefinition( this, "WorkerTaskDefinition", {
      memoryLimitMiB: 2048,
      cpu: 1024,
      taskRole: taskRole,
      executionRole: taskExecutionRole,
    } );

    // Build Docker image locally and push to ECR
    const dockerImageAsset = new DockerImageAsset( this, "ExtServiceImage", {
      directory: path.join( __dirname, "../worker" ), // Path to directory containing Dockerfile
      exclude: ["node_modules"],
      buildArgs: {
        // You can add build args if needed
      },
    } );

    // Create log group for container logs
    const logGroup = new logs.LogGroup( this, "WorkerServiceLogGroup", {
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    } );

    // Add container definition
    const containerDefinition = taskDefinition.addContainer( "WorkerContainer", {
      containerName: "web3_worker",
      image: ecs.ContainerImage.fromDockerImageAsset( dockerImageAsset ),
      environment: {
        NODE_ENV: "production",
        TARGET_URL: "http://extser-extse-xrszgp8g748i-1666202459.us-east-1.elb.amazonaws.com/assets",

        AWS_PARQUET_BUCKET: parquetBucket.bucketName,
        AWS_CSV_BUCKET: csvBucket.bucketName,

        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
        AWS_REGION: process.env.AWS_REGION || "us-east-1",
      },
      logging: ecs.LogDrivers.awsLogs( {
        streamPrefix: "worker",
        logGroup: logGroup,
      } ),
      essential: true,
    } );

    // Output the bucket names and task definition ARN
    new cdk.CfnOutput( this, "ParquetBucketName", {
      value: parquetBucket.bucketName,
      description: "The name of the S3 bucket for Parquet files",
    } );

    new cdk.CfnOutput( this, "CSVBucketName", {
      value: csvBucket.bucketName,
      description: "The name of the S3 bucket for CSV files",
    } );

    new cdk.CfnOutput( this, "TaskDefinitionArn", {
      value: taskDefinition.taskDefinitionArn,
      description: "The ARN of the task definition",
    } );
  }
}

export default WorkerStack;