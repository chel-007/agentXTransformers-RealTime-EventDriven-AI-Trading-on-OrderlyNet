<!-- gcloud functions deploy getOrderlyKline --gen2 --runtime nodejs18 --trigger-http --entry-point getOrderlyKline --region us-central1 --env-vars-file .env.yaml --project agent-xtransformers -->

<!-- gcloud pubsub topics publish streamOrderlyKline --message '{"hello": "world"}' -->

<!-- gcloud scheduler jobs create http fetch-kline-job --schedule "*/10 * * * *" --time-zone "UTC" --http-method POST --uri https://us-central1-agent-xtransformers.cloudfunctions.net/getOrderlyKline --message-body "{}" --location us-central1

gcloud scheduler jobs create pubsub fetch-kline-job --schedule "*/10 * * * *" --time-zone "UTC" --topic runKlineFunc --message-body "{}" --location us-central1

bq mk --table --description "empyreal data stream" --schema "timestamp:INT64,open:FLOAT,high:FLOAT,low:FLOAT,close:FLOAT,volume:FLOAT" orderly_kline.empyrealstream

gcloud functions deploy analyseProcessData --gen2 --runtime nodejs20 --trigger-topic runKlineFunc --entry-point analyseProcessData --region us-central1 --env-vars-file .env.yaml --project agent-xtransformers --trigger-resource analyseProcessData-subscription

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

gcloud workbench instances describe agent-xtransformers-workbench --location us-central1-a --format="value(state)"


gcloud pubsub topics create startPrediction

gsutil notification create -t startPrediction -f json -e OBJECT_FINALIZE gs://preprocesskline

gcloud pubsub subscriptions create YOUR_SUBSCRIPTION_NAME --topic YOUR_TOPIC_NAME --push-endpoint=https://YOUR_CLOUD_RUN_SERVICE_URL --ack-deadline=10

gcloud run deploy predictionService --image gcr.io/agent-xtransformers/prediction-service --platform managed --region us-central1 --allow-unauthenticated --trigger-topic=startPrediction

docker build -t gcr.io/agent-xtransformers/prediction-service:v1 .

docker build -t gcr.io/agent-xtransformers/prediction-service:v1 -f ./Dockerfile .
docker build -t gcr.io/agent-xtransformers/prediction-service:v2 .


docker tag prediction-service gcr.io/agent-xtransformers/prediction-service:v1

docker push gcr.io/YOUR_PROJECT_ID/YOUR_IMAGE_NAME:latest

gcloud run deploy prediction-service --image gcr.io/agent-xtransformers/prediction-service:v2 --region us


gcloud run deploy prediction-service --image gcr.io/agent-xtransformers/prediction-service:v1 --region us-central1 --allow-unauthenticated --set-env-vars PUBSUB_TOPIC=startPrediction


gcloud functions add-iam-policy-binding returnPrediction --region us-central1 --member="allUsers" --role="roles/cloudfunctions.invoker"

gcloud functions deploy update --runtime nodejs20 --trigger-topic finalizaResult


gcloud functions deploy returnPrediction --gen2 --runtime nodejs20 --trigger-http --allow-unauthenticated --region us-central1

gcloud functions add-invoker-policy-binding returnPrediction \
      --region="us-central1" \
      --member="MEMBER_NAME"


gcloud iam service-accounts create firestore-service-account --display-name "Firestore Service Account"


gcloud secrets add-iam-policy-binding firestore-sa-key --member="allUsers" --role="roles/secretmanager.secretAccessor" -->