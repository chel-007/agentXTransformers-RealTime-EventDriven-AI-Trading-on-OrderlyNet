<!-- gcloud functions deploy getOrderlyKline --gen2 --runtime nodejs18 --trigger-http --entry-point getOrderlyKline --region us-central1 --env-vars-file .env.yaml --project agent-xtransformers -->

<!-- gcloud pubsub topics publish streamOrderlyKline --message '{"hello": "world"}' -->

gcloud scheduler jobs create http fetch-kline-job --schedule "*/10 * * * *" --time-zone "UTC" --http-method POST --uri https://us-central1-agent-xtransformers.cloudfunctions.net/getOrderlyKline --message-body "{}" --location us-central1

gcloud scheduler jobs create pubsub fetch-kline-job --schedule "*/10 * * * *" --time-zone "UTC" --topic runKlineFunc --message-body "{}" --location us-central1

bq mk --table --description "Kline Data" --schema "open:FLOAT,close:FLOAT,low:FLOAT,high:FLOAT,volume:FLOAT,amount:FLOAT,symbol:STRING,type:STRING,start_timestamp:INT64,end_timestamp:INT64" orderly_kline.analysis

bq mk --table --description "empyreal data stream" --schema "timestamp:INT64,open:FLOAT,high:FLOAT,low:FLOAT,close:FLOAT,volume:FLOAT" orderly_kline.empyrealstream



gcloud functions deploy analyseProcessData --gen2 --runtime nodejs20 --trigger-topic runKlineFunc --entry-point analyseProcessData --region us-central1 --env-vars-file .env.yaml --project agent-xtransformers --trigger-resource analyseProcessData-subscription

gcloud functions deploy analyseProcessData --gen2 --runtime nodejs20 --trigger-topic=runKlineFunc --entry-point=analyseProcessData --region=us-central1 --env-vars-file=.env.yaml --project=agent-xtransformers

gcloud functions deploy predictionService --gen2 --runtime python39 --trigger-topic startPrediction --entry-point pubsub_push --region us-central1 --source . --allow-unauthenticated 

gcloud functions deploy getOrderlyKlines --gen2 --runtime nodejs20 --trigger-http --entry-point getOrderlyKlines --region us-central1 --allow-unauthenticated 



gcloud pubsub subscriptions create getOrderlyKline-subscription ^
  --topic=runKlineFunc ^
  --message-filter="attributes.source=\"scheduler\""

gcloud pubsub subscriptions modify-push-config getOrderlyKline-subscription --push-endpoint=https://us-central1-agent-xtransformers.cloudfunctions.net/getOrderlyKline --push-auth-service-account=175983175901-compute@developer.gserviceaccount.com

gcloud scheduler jobs update pubsub fetch-kline-job --schedule "*/10 * * * *" --time-zone "UTC" --topic runKlineFunc --message-body "{}" --attributes source=scheduler --location us-central1


gcloud pubsub subscriptions create getOrderlyKline-subscription \
  --topic=runKlineFunc \
  --filter="attributes.source=\"scheduler\""


https://analyseprocessdata-alohljnl7q-uc.a.run.app?__GCP_CloudEventsMode=CUSTOM_PUBSUB_projects%2Fagent-xtransformers%2Ftopics%2FrunKlineFunc


gcloud workbench instances describe agent-xtransformers-workbench --location us-central1-a --format="value(state)"




import { PubSub } from '@google-cloud/pubsub';
import { BigQuery } from '@google-cloud/bigquery';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { Storage } from '@google-cloud/storage';
const storage = new Storage();

// Initialize clients
const pubSubClient = new PubSub();
const bigQueryClient = new BigQuery();

SELECT * 
FROM `agent-xtransformers.orderly_kline.analysis`
WHERE end_timestamp > (1727704800000) 
AND type = '1h';1727708400000

gcloud pubsub topics create startPrediction

gsutil notification create -t startPrediction -f json -e OBJECT_FINALIZE gs://preprocesskline

gcloud pubsub subscriptions create YOUR_SUBSCRIPTION_NAME --topic YOUR_TOPIC_NAME --push-endpoint=https://YOUR_CLOUD_RUN_SERVICE_URL --ack-deadline=10


Start-Process -FilePath "$env:USERPROFILE\Downloads\DockerDesktopInstaller.exe" -Wait

wsl --set-default-version 2

Start-Process "Docker Desktop"

pip freeze > requirements.txt

venv\Scripts\activate

curl -X POST http://localhost:8080/pubsub/push \
-H "Content-Type: application/json" \
-d '{
  "message": {
    "data": "dummy-data",
    "attributes": {
      "example": "value"
    }
  }
}'

gcloud run deploy predictionService --image gcr.io/agent-xtransformers/prediction-service --platform managed --region us-central1 --allow-unauthenticated --trigger-topic=startPrediction

docker build -t gcr.io/agent-xtransformers/prediction-service:v1 .

docker build -t gcr.io/agent-xtransformers/prediction-service:v1 -f ./Dockerfile .
docker build -t gcr.io/agent-xtransformers/prediction-service:v2 .


docker tag prediction-service gcr.io/agent-xtransformers/prediction-service:v1

docker push gcr.io/YOUR_PROJECT_ID/YOUR_IMAGE_NAME:latest

gcloud run deploy prediction-service --image gcr.io/agent-xtransformers/prediction-service:v2 --region us



gcloud run deploy prediction-service --image gcr.io/agent-xtransformers/prediction-service:v1 --region us-central1 --allow-unauthenticated --set-env-vars PUBSUB_TOPIC=startPrediction




"Conversation ID: [Your Conversation ID] - Following up on our discussion about ETH market sentiment for my 5-minute trading bot, please provide the following data:

ETH Market Sentiment Now:

1. Fear & Greed Index (0-100): 
2. Price Momentum (-1 to 1, where -1 is strong bearish, 1 is strong bullish): 
3. Moving Average Slope (-1 to 1, where -1 is steep downtrend, 1 is steep uptrend):
4. News Sentiment Score (-1 to 1, where -1 is very negative, 1 is very positive):

protobuf==4.25.5
tensorflow==2.14.0
tensorflow-intel==2.1.4

gcloud functions add-iam-policy-binding returnPrediction --region us-central1 --member="allUsers" --role="roles/cloudfunctions.invoker"

gcloud functions deploy update --runtime nodejs20 --trigger-topic finalizaResult




Following up on our discussion about ETH market sentiment for my 5-minute trading bot, please provide ONLY the following numeric data:

ETH Market Sentiment Now:

1. Fear & Greed Index (0-100): 
2. Price Momentum (-1 to 1): 
3. Moving Average Slope (-1 to 1):
4. News Sentiment Score (-1 to 1):


import re

response = get_model_response()  # Your API call function
fgi_match = re.search(r"FGI:\s*([\d\.]+)", response)
if fgi_match:
    fgi = float(fgi_match.group(1))
# Similar regex for PM, MAS, NSS


curl \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"ETH Market Sentiment: Numeric Values Only"}]}]}' \
  -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-002:generateContent?key=AIzaSyA3uRghDMzMqX_24qg8_KALBAegeaZNO1A'

  curl -X GET https://us-central1-agent-xtransformers.cloudfunctions.net/predictionService/get-prediction

gcloud functions deploy returnPrediction --gen2 --runtime nodejs20 --trigger-http --allow-unauthenticated --region us-central1

gcloud functions add-invoker-policy-binding returnPrediction \
      --region="us-central1" \
      --member="MEMBER_NAME"



gcloud iam service-accounts create firestore-service-account --display-name "Firestore Service Account"

gcloud projects add-iam-policy-binding agent-xtransformers --member "serviceAccount:firestore-service-account@agent-xtransformers.iam.gserviceaccount.com" --role "roles/datastore.user"

gcloud iam service-accounts keys create firestore-all-user-auth.json --iam-account firestore-service-account@agent-xtransformers.iam.gserviceaccount.com

gcloud secrets create firestore-sa-key --data-file=C:\Users\chelo\Downloads\firestore-all-user-auth.json

gcloud secrets add-iam-policy-binding firestore-sa-key --member="allUsers" --role="roles/secretmanager.secretAccessor"



gcloud iam service-accounts keys update --key-file=firestore-all-user-auth.json --iam-account=firestore-service-account@agent-xtransformers.iam.gserviceaccount.com --set-iam-policy "bindings: [{role: 'roles/iam.serviceAccountKeyExposureResponse', members: ['serviceAccount:firestore-service-account@agent-xtransformers.iam.gserviceaccount.com']}]"

gcloud resource-manager org-policies allow --organization=YOUR_ORG_ID \
    iam.serviceAccountKeyExposureResponse=wait_for_abuse



TO DO

* figure out how to close buy&sell positons (nt limits), with orderly API call when price moves against (close that is sell them)

* increase risk to like 1 - done to 0.6

* increase take profit more - done to 0.07

* make the cumulative increase the risk back faster (like when it like 10)

* also make the drawdown nt decrease by half instead - 0.01

* limit the amount All pos qty can rise to (like) - done edit after testing












okay take a look at this chat, i already have a way of monitoring open trades / orders that are incomplete to check when the market moves against us, and i cancel them when it does, it turns out that orderly has different order status like we thought:

Get orders by customized filters.

For filter by status, one can reference special bundled statuses below for ease of access of Open (ie INCOMPLETE) orders or COMPLETED orders.

INCOMPLETE = NEW + PARTIAL_FILLED
COMPLETED = CANCELLED + FILLED

this means that when i cancel an order
 async def monitor_open_trades(self):
        """
        Monitor open trades and close them early if the market moves against us.
        """
        asset = PerpetualAssetType.ETH
        try:
            orders: list[Order] = await jdk.orders(status="INCOMPLETE")
            print(f"Found {len(orders)} incomplete orders.")
            
            for order in orders:
                try:
                    current_price = self.current_price
    
                    # Calculate price difference based on order side
                    price_diff = (order.price - Decimal(str(current_price)))
                    print("Comparing the Limit Order Price W/ current price:", {order.side}, {order.price}, {current_price})
                    print("Price difference is:", price_diff)
    
                    # Check for SELL limit orders
                    if order.side == 'SELL' and order.type == 'LIMIT':
                        if price_diff >= 2:  # 5% move against us for SELL
                            
                            print(f"Market moved against us by 2%. Closing SELL order early.")
                            await self.cancel_order(order.order_id)
    
                    # Check for BUY limit orders
                    elif order.side == 'BUY' and order.type == 'LIMIT':
                        if price_diff <= -2:  # 5% move against us for BUY
                            jdk.close_prosition(PerpetualAssetType.ETH)
                            print(f"Market moved against us by 2%. Closing BUY order early.")
                            await self.cancel_order(order.order_id)
    
                except Exception as e:
                    print(f"Error processing order ID {order}: {e}")
                    # Optionally log the error or take further action
    
        except Exception as e:
            print(f"Error retrieving open orders: {e}")
            # Optionally log the error or take further action


    async def cancel_order(self, order_id: str):
        """
        Cancels an order by its ID and symbol.
        """
        path = f"v1/order"
        params = {
            "order_id": order_id,
            "symbol": 'PERP_ETH_USDC'
        }
        
        # Send the DELETE request using the SDK's signing mechanism
        response_json = await jdk._send_request_async(path, params=params, method="DELETE")
        print(response_json)
        
        if response_json["success"]:
            return response_json
        else:
            raise ValueError(response_json)