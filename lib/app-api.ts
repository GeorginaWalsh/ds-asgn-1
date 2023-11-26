import { Aws } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/util";
import { movies, movieReviews } from "../seed/movies";

type AppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
};

export class AppApi extends Construct {
  constructor(scope: Construct, id: string, props: AppApiProps) {
    super(scope, id);

    const appApi = new apig.RestApi(this, "AppApi", {
      description: "App RestApi",
      endpointTypes: [apig.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apig.Cors.ALL_ORIGINS,
      },
    });

    const appCommonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      environment: {
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: cdk.Aws.REGION,
      },
    };

    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });

    const movieReviewsTable = new dynamodb.Table(this, "MovieReviewTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "MovieReview",
    });
    movieReviewsTable.addLocalSecondaryIndex({
      indexName: "minRating",
      sortKey: { name: "content", type: dynamodb.AttributeType.STRING },
    });
    movieReviewsTable.addLocalSecondaryIndex({
      indexName: "reviewDate",
      sortKey: { name: "reviewDate", type: dynamodb.AttributeType.STRING },
    });

    new custom.AwsCustomResource(this, "moviesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [moviesTable.tableName]: generateBatch(movies),
            [movieReviewsTable.tableName]: generateBatch(movieReviews),  // Added
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), //.of(Date.now().toString()),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [moviesTable.tableArn, movieReviewsTable.tableArn],  // Includes movie cast
      }),
    });

    // const protectedRes = appApi.root.addResource("protected");
    const getAllMoviesRes = appApi.root.addResource("movies");
    const getMovieRes = getAllMoviesRes.addResource("{movieId}");
    const addReviewRes = getAllMoviesRes.addResource("reviews");
    const getAllReviewsRes = getMovieRes.addResource("reviews");
    const getReviewRes = getAllReviewsRes.addResource("{reviewerName}");
    

    const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
      ...appCommonFnProps,
      entry: "./lambda/auth/authorizer.ts",
    });

    const getAllMoviesFn = new node.NodejsFunction(this, "GetAllMoviesFn", {
      ...appCommonFnProps,
      entry: "./lambda/getAllMovies.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
          // entry: `${__dirname}/../lambda/getAllMovies.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesTable.tableName,
        REVIEW_TABLE_NAME: movieReviewsTable.tableName,
        REGION: 'eu-west-1',
      },
    });
    const getMovieByIdFn = new node.NodejsFunction(this, "GetMovieByIdFn", {
      ...appCommonFnProps,
      entry: "./lambda/getMovieById.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      // entry: `${__dirname}/../lambda/getMovieById.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesTable.tableName,
        REGION: 'eu-west-1',
      },
    });
    
    const getAllMovieReviewsFn = new node.NodejsFunction(this, "GetAllMovieReviewsFn", {
      ...appCommonFnProps,
      entry: "./lambda/getAllMovieReviews.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
              // entry: `${__dirname}/../lambda/getMovieReview.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        REVIEW_TABLE_NAME: movieReviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const getMovieReviewFn = new node.NodejsFunction(this, "GetMovieReviewFn", {
      ...appCommonFnProps,
      entry: "./lambda/getMovieReview.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
              // entry: `${__dirname}/../lambda/getMovieReview.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        REVIEW_TABLE_NAME: movieReviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const addReviewFn = new node.NodejsFunction(this, "AddReviewFn", {
      ...appCommonFnProps,
      entry: "./lambda/addReview.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
          // entry: `${__dirname}/../lambda/addReview.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        REVIEW_TABLE_NAME: movieReviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const updateReviewFn = new node.NodejsFunction(this, "UpdateReviewFn", {
      ...appCommonFnProps,
      entry: "./lambda/updateReview.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
            // entry: `${__dirname}/../lambda/updateReview.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        REVIEW_TABLE_NAME: movieReviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const removeReviewFn = new node.NodejsFunction(this, "RemoveReviewFn", {
      ...appCommonFnProps,
      entry: "./lambda/removeReview.ts",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
            // entry: `${__dirname}/../lambda/removeReview.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: movieReviewsTable.tableName,
        REGION: 'eu-west-1',
      },
    });


    // const publicFn = new node.NodejsFunction(this, "PublicFn", {
    //   ...appCommonFnProps,
    //   entry: "./lambda/public.ts",
    // });
     

    moviesTable.grantReadData(getMovieByIdFn)
    moviesTable.grantReadData(getAllMoviesFn)
    movieReviewsTable.grantReadData(getAllMoviesFn);
    movieReviewsTable.grantReadData(getAllMovieReviewsFn);
    movieReviewsTable.grantReadData(getMovieReviewFn);
    movieReviewsTable.grantReadWriteData(addReviewFn)
    movieReviewsTable.grantReadWriteData(removeReviewFn)
    movieReviewsTable.grantReadWriteData(updateReviewFn)

    const requestAuthorizer = new apig.RequestAuthorizer(
      this,
      "RequestAuthorizer",
      {
        identitySources: [apig.IdentitySource.header("cookie")],
        handler: authorizerFn,
        resultsCacheTtl: cdk.Duration.minutes(0),
      }
    );

    // protectedRes.addMethod("GET", new apig.LambdaIntegration(protectedFn), {
    //   authorizer: requestAuthorizer,
    //   authorizationType: apig.AuthorizationType.CUSTOM,
    // });

    getAllMoviesRes.addMethod("GET", new apig.LambdaIntegration(getAllMoviesFn));
    getMovieRes.addMethod("GET", new apig.LambdaIntegration(getMovieByIdFn));
    getAllReviewsRes.addMethod("GET", new apig.LambdaIntegration(getAllMovieReviewsFn));
    getReviewRes.addMethod("GET", new apig.LambdaIntegration(getMovieReviewFn));

    addReviewRes.addMethod("POST", new apig.LambdaIntegration(addReviewFn), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });
    getReviewRes.addMethod("DELETE", new apig.LambdaIntegration(removeReviewFn), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });
    getReviewRes.addMethod("PUT", new apig.LambdaIntegration(updateReviewFn), {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    });


  }
}