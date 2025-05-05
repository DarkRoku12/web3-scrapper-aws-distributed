import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as logs from "aws-cdk-lib/aws-logs";
import * as path from "path";
import * as VPC from "./vpc";
import { Construct } from "constructs";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { ApplicationProtocol } from "aws-cdk-lib/aws-elasticloadbalancingv2";

export class ExtServiceStack extends cdk.Stack
{
  constructor( scope: Construct, id: string, props?: cdk.StackProps )
  {
    super( scope, id, props );

    // Create a VPC for the ECS cluster
    const vpc = VPC.getVpc( this );

    // Build Docker image locally and push to ECR
    const dockerImageAsset = new DockerImageAsset( this, "ExtServiceImage", {
      directory: path.join( __dirname, "../ext-service" ), // Path to directory containing Dockerfile
      exclude: ["node_modules"],
      buildArgs: {
        // You can add build args if needed
      },
    } );

    // Create ECS cluster
    const cluster = new ecs.Cluster( this, "ExtServiceCluster", {
      vpc: vpc,
      containerInsights: true,
    } );

    // Add capacity to the cluster - using Fargate (serverless)
    const fargateTaskDefinition = new ecs.FargateTaskDefinition( this, "ExtServiceTaskDef", {
      memoryLimitMiB: 1024, // 1GB memory
      cpu: 512, // 0.5 vCPU
    } );

    // Add CloudWatch log permissions
    fargateTaskDefinition.addToExecutionRolePolicy(
      new iam.PolicyStatement( {
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:CreateLogGroup"
        ],
        resources: ["*"],
      } )
    );

    // Create log group for container logs
    const logGroup = new logs.LogGroup( this, "ExtServiceLogGroup", {
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    } );

    // Add container to task definition
    const container = fargateTaskDefinition.addContainer( "ExtServiceContainer", {
      containerName: "web3_ext_service",
      image: ecs.ContainerImage.fromDockerImageAsset( dockerImageAsset ),
      logging: ecs.LogDrivers.awsLogs( {
        streamPrefix: "ext-service",
        logGroup: logGroup,
      } ),
      environment: {
        NODE_ENV: "production",
        PORT: "7010",
      },
      healthCheck: {
        command: ["CMD-SHELL", "curl -f http://localhost:7010/health || exit 1"],
        interval: cdk.Duration.seconds( 30 ),
        timeout: cdk.Duration.seconds( 5 ),
        retries: 3,
        startPeriod: cdk.Duration.seconds( 60 ),
      },
    } );

    // Map the container port
    container.addPortMappings( {
      containerPort: 7010,
      hostPort: 7010,
      protocol: ecs.Protocol.TCP,
    } );

    // Create Fargate service with Application Load Balancer
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService( this, "ExtService", {
      cluster: cluster,
      taskDefinition: fargateTaskDefinition,
      desiredCount: 2, // Number of instances of the task to run
      publicLoadBalancer: true, // Internet-facing load balancer
      assignPublicIp: true, // Assign public IPs to Fargate tasks
      listenerPort: 80, // Load balancer listens on port 80
      targetProtocol: ApplicationProtocol.HTTP, // Target protocol for health checks
      taskSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Use public subnets
      },
      circuitBreaker: { rollback: true }, // Enable deployment circuit breaker with rollback
    } );

    // Add autoscaling based on CPU utilization
    const scaling = fargateService.service.autoScaleTaskCount( {
      minCapacity: 2,
      maxCapacity: 2,
    } );

    scaling.scaleOnCpuUtilization( "CpuScaling", {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds( 60 ),
      scaleOutCooldown: cdk.Duration.seconds( 60 ),
    } );

    // Configure health check for the target group
    fargateService.targetGroup.configureHealthCheck( {
      path: "/health", // Assuming your app has a health endpoint
      port: "7010",
      interval: cdk.Duration.seconds( 30 ),
      timeout: cdk.Duration.seconds( 5 ),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
    } );

    // Output the load balancer URL
    new cdk.CfnOutput( this, "ApplicationURL", {
      value: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
      description: "URL of the load balancer",
    } );
  }
}

export default ExtServiceStack;