import { APIGatewayProxyHandlerV2 } from "aws-lambda";  // CHANGED
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";;

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => { // CHANGED
  try {
    // Print Event
    console.log("Event: ", event);
    const parameters  = event?.pathParameters;
    const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;
    const queryParams = event.queryStringParameters;

    // if (!queryParams) {
    //   return {
    //     statusCode: 500,
    //     headers: {
    //       "content-type": "application/json",
    //     },
    //     body: JSON.stringify({ message: "Missing query parameters" }),
    //   };
    // }

    if (!movieId) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ Message: "Missing movie Id" }),
        };
      }

    let commandInput;
    let commandOutput;

    if (queryParams?.minRating) {
      commandInput = {
        TableName: process.env.REVIEW_TABLE_NAME,
        IndexName: "minRating",
        FilterExpression: "movieId = :m and begins_with(content, :r) ",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":r": queryParams.minRating?.toString(),
        },
      };
    }  else {
      commandInput = {
        TableName: process.env.REVIEW_TABLE_NAME,
          FilterExpression: "movieId = :m",
          ExpressionAttributeValues: {
            ":m": movieId,
          },
      };
    } 

      commandOutput = await ddbClient.send(
        new ScanCommand( commandInput )
      );

    // const commandOutput = await ddbClient.send(
    //     new GetCommand({
    //       TableName: process.env.REVIEW_TABLE_NAME,
    //       Key: { movieId: movieId },
    //     })
    //   );
      if (!commandOutput.Items) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ Message: "Invalid movie Id" }),
        };
      }
      const body = {
        data: commandOutput.Items,
      };

    // Return Response
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