import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { MovieAndReviewQueryParams } from "../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  GetCommand
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import { parse } from "querystring";

const ajv = new Ajv();
const isValidQueryParams = ajv.compile(
  schema.definitions["MovieAndReviewQueryParams"] || {}
);
 
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", event);
    const parameters  = event?.pathParameters;
    const queryParams = event.queryStringParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    let reviewerName = parameters?.reviewerName ? parameters.reviewerName : undefined;
    let reviewDate
    // reviewerName.match(reg)
    var reg = /^\d+$/;

    // if (reviewerName?.match(reg)) {
    //   reviewDate = reviewerName;
    // } 
    if (!reviewerName) {
      reviewDate = parameters;
    } 
    

    if (!movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }

    if (!reviewerName) {
      if (!reviewDate)
      {return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing reviewer name or review year" }),
      };}
    }

    // if (!reviewDate) {
    //   return {
    //     statusCode: 404,
    //     headers: {
    //       "content-type": "application/json",
    //     },
    //     body: JSON.stringify({ Message: "Missing review year" }),
    //   };
    // }

    // if (!queryParams) {
    //   return {
    //     statusCode: 500,
    //     headers: {
    //       "content-type": "application/json",
    //     },
    //     body: JSON.stringify({ message: "Missing query parameters" }),
    //   };
    // }
    // if (!isValidQueryParams(queryParams)) {
    //   return {
    //     statusCode: 500,
    //     headers: {
    //       "content-type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       message: `Incorrect type. Must match Query parameters schema`,
    //       schema: schema.definitions["MovieAndReviewQueryParams"],
    //     }),
    //   };
    // }

    // let commandInput: QueryCommandInput = {
    //   TableName: process.env.REVIEW_TABLE_NAME,
    // };
    // const commandOutput = await ddbClient.send(
    //   new ScanCommand({
    //     TableName: process.env.REVIEW_TABLE_NAME,
    //     FilterExpression: "movieId = :m",
    //     ExpressionAttributeValues: {
    //       ":m": movieId,
    //     },
    //   })
    // );
    // if (queryParams.movieId != undefined) {
    //   if (queryParams.reviewerName != undefined) {
    //     commandInput = {
    //       ...commandInput,
    //       KeyConditionExpression: "movieId = :m and begins_with(reviewerName, :a) ",
    //       ExpressionAttributeValues: {
    //         ":m": movieId,
    //         ":a": queryParams.reviewerName,
    //       },
    //   };
      // const movieId = parseInt(queryParams.movieId);
    //   if ("minRating" in queryParams) {
    //   commandInput = {
    //     ...commandInput,
    //     IndexName: "ratingIx",
    //     KeyConditionExpression: "movieId = :m and minRating < :r) ",
    //     ExpressionAttributeValues: {
    //       ":m": movieId,
    //       ":r": queryParams.minRating,
    //     },
    //   };
    // } else if ("reviewerName" in queryParams) {
    //     commandInput = {
    //       ...commandInput,
    //       KeyConditionExpression: "movieId = :m and begins_with(reviewerName, :a) ",
    //       ExpressionAttributeValues: {
    //         ":m": movieId,
    //         ":a": queryParams.reviewerName,
    //       },
    //     };
    //   } else {
    //   commandInput = {
    //     ...commandInput,
    //     KeyConditionExpression: "movieId = :m",
    //     ExpressionAttributeValues: {
    //       ":m": movieId,
    //     },
    //   };
  //   }
  // }
    

    const ddbDocClient = createDocumentClient();
    // const commandOutput = await ddbClient.send(
    //   new ScanCommand({
    //     TableName: process.env.REVIEW_TABLE_NAME,
        // FilterExpression: "movieId = :m and begins_with(reviewerName, :a) or begins_with(reviewDate, :d)",
        // ExpressionAttributeValues: {
        //   ":m": movieId,
        //   ":a": reviewerName,
        //   ":d": reviewDate,
        // },
    //   })
    // );
;
    let commandInput: QueryCommandInput = {
      TableName: process.env.REVIEW_TABLE_NAME,
    };
    if (reviewDate) {
      commandInput = {
        ...commandInput,
        KeyConditionExpression:"movieId = :m and begins_with(reviewDate, :a)",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":a": reviewDate,
        },
      };
    } else {
      commandInput = {
        ...commandInput,
        KeyConditionExpression:"movieId = :m and begins_with(reviewerName, :a) ",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":a": reviewerName,
        },
      };
    }


    const commandOutput = await ddbDocClient.send(
      new QueryCommand(commandInput)
      );
    // const commandOutput = await ddbDocClient.send(
    //   new GetCommand({
    //     TableName: process.env.REVIEW_TABLE_NAME,
    //     Key: { 
    //       movieId: movieId,
    //       reviewerName: reviewerName, 
    //     },
    //   })
    // );
    if (!commandOutput.Items) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid movie  or reviewer name" }),
      };
    }
    const body = {
      data: commandOutput.Items,
    };
      
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};
  
  function createDocumentClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    const marshallOptions = {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}


function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}