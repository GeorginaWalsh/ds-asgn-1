import { Aws } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";

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

    // const protectedRes = appApi.root.addResource("protected");
    const getAllMoviesRes = appApi.root.addResource("movies");
    const getMovieRes = getAllMoviesRes.addResource("{movieId}");
    const addReviewRes = getMovieRes.addResource("reviews");
    const getReviewRes = addReviewRes.addResource("{reviewerName}");
    // const updateReviewRes = appApi.root.addResource("updateReview");


  


    // const protectedFn = new node.NodejsFunction(this, "ProtectedFn", {
    //   ...appCommonFnProps,
    //   entry: "./lambda/protected.ts",
    // });
    const addReviewFn = new node.NodejsFunction(this, "AddReviewFn", {
      ...appCommonFnProps,
      entry: "./lambda/addReview.ts",
    });
    const removeReviewFn = new node.NodejsFunction(this, "RemoveReviewFn", {
      ...appCommonFnProps,
      entry: "./lambda/removeReview.ts",
    });
    const updateReviewFn = new node.NodejsFunction(this, "UpdateReviewFn", {
      ...appCommonFnProps,
      entry: "./lambda/updateReview.ts",
    });

    // const publicFn = new node.NodejsFunction(this, "PublicFn", {
    //   ...appCommonFnProps,
    //   entry: "./lambda/public.ts",
    // });
    const getAllMoviesFn = new node.NodejsFunction(this, "GetAllMoviesFn", {
      ...appCommonFnProps,
      entry: "./lambda/getAllMovies.ts",
    });
    const getMovieByIdFn = new node.NodejsFunction(this, "GetMovieByIdFn", {
      ...appCommonFnProps,
      entry: "./lambda/public.ts",
    });
    const getMovieReviewsFn = new node.NodejsFunction(this, "GetMovieReviewsFn", {
      ...appCommonFnProps,
      entry: "./lambda/getMovieReview.ts",
    });
    

    const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
      ...appCommonFnProps,
      entry: "./lambda/auth/authorizer.ts",
    });

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
    getReviewRes.addMethod("GET", new apig.LambdaIntegration(getMovieReviewsFn));
    
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