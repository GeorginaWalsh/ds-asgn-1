import * as apig from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { AuthApi } from './auth-api'
import {AppApi } from './app-api'
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/util";
import { movies, movieReviews } from "../seed/movies";

export class Asgn01AppStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      indexName: "ratingIx",
      sortKey: { name: "content", type: dynamodb.AttributeType.STRING },
    });

    const userPool = new UserPool(this, "UserPool", {
      signInAliases: { username: true, email: true },
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolId = userPool.userPoolId;

    const appClient = userPool.addClient("AppClient", {
      authFlows: { userPassword: true },
    });

    const userPoolClientId = appClient.userPoolClientId;

    new AuthApi(this, 'AuthServiceApi', {
			userPoolId: userPoolId,
			userPoolClientId: userPoolClientId,
		});

    new AppApi(this, 'AppApi', {
			userPoolId: userPoolId,
			userPoolClientId: userPoolClientId,
		} );

    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambda/getMovieById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REVIEW_TABLE_NAME: movieReviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
      );
      
      const getAllMoviesFn = new lambdanode.NodejsFunction(
        this,
        "GetAllMoviesFn",
        {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambda/getAllMovies.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: 'eu-west-1',
          },
        }
        );
        
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

        const newMovieReviewFn = new lambdanode.NodejsFunction(this, "AddMovieReviewFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambda/addReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: movieReviewsTable.tableName,
            REGION: "eu-west-1",
          },
        });

        const removeMovieReviewFn = new lambdanode.NodejsFunction(
          this,
          "RemoveMovieReviewFn",
          {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambda/removeReview.ts`,
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
              TABLE_NAME: movieReviewsTable.tableName,
              REGION: 'eu-west-1',
            },
          }
          );

          const getMovieReviewsFn = new lambdanode.NodejsFunction(
            this,
            "GetReviewFn",
            {
              architecture: lambda.Architecture.ARM_64,
              runtime: lambda.Runtime.NODEJS_16_X,
              entry: `${__dirname}/../lambda/getMovieReview.ts`,
              timeout: cdk.Duration.seconds(10),
              memorySize: 128,
              environment: {
                TABLE_NAME: movieReviewsTable.tableName,
                REGION: "eu-west-1",
              },
            }
          );

          const updateMovieReviewFn = new lambdanode.NodejsFunction(this, "UpdateMovieReviewFn", {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambda/updateReview.ts`,
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
              TABLE_NAME: movieReviewsTable.tableName,
              REGION: "eu-west-1",
            },
          });

        
        // Permissions 
        moviesTable.grantReadData(getMovieByIdFn)
        moviesTable.grantReadData(getAllMoviesFn)
        movieReviewsTable.grantReadWriteData(newMovieReviewFn)
        movieReviewsTable.grantReadWriteData(removeMovieReviewFn)
        movieReviewsTable.grantReadWriteData(updateMovieReviewFn)
        movieReviewsTable.grantReadData(getMovieReviewsFn);

        const api = new apig.RestApi(this, "RestAPI", {
          description: "Assgn-1 Movie Review api",
          deployOptions: {
            stageName: "dev",
          },
          defaultCorsPreflightOptions: {
            allowHeaders: ["Content-Type", "X-Amz-Date"],
            allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
            allowCredentials: true,
            allowOrigins: ["*"],
          },
    
          
        });
    
        const moviesEndpoint = api.root.addResource("movies");
        moviesEndpoint.addMethod(
          "GET",
          new apig.LambdaIntegration(getAllMoviesFn, { proxy: true })
        );
    
        const movieEndpoint = moviesEndpoint.addResource("{movieId}");
        movieEndpoint.addMethod(
          "GET",
          new apig.LambdaIntegration(getMovieByIdFn, { proxy: true })
        );

        const addMovieReviewEndpoint = movieEndpoint.addResource("reviews");
        addMovieReviewEndpoint.addMethod(
          "POST",
          new apig.LambdaIntegration(newMovieReviewFn, { proxy: true })
        );

        const getMovieReviewEndpoint = addMovieReviewEndpoint.addResource('{reviewerName}');
        getMovieReviewEndpoint.addMethod(
          "GET",
          new apig.LambdaIntegration(getMovieReviewsFn, { proxy: true })
        );
    
        // const removeMovieReviewEndpoint = movieEndpoint.addResource('{reviewerName}')
        getMovieReviewEndpoint.addMethod(
          "DELETE",
          new apig.LambdaIntegration(removeMovieReviewFn, { proxy: true })
        );

        // const updateMovieReviewEndpoint = moviesEndpoint.addResource('{movieId}/reviews/{reviewerName}');
        getMovieReviewEndpoint.addMethod(
          "PUT",
          new apig.LambdaIntegration(updateMovieReviewFn, { proxy: true })
        );
    
      
  } 

}