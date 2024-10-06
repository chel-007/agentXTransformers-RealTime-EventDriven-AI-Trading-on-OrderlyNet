import pandas as pd
import numpy as np
import joblib
import ta
import json
# from sklearn.preprocessing import MinMaxScaler
# from sklearn.metrics import mean_squared_error
# from tensorflow.keras import backend as K
# from keras.models import load_model
from joblib import dump, load
from google.cloud import aiplatform, storage
from google.cloud import pubsub_v1 as pubsub
from flask import Flask, request, jsonify
import io

app = Flask(__name__)

predictions_store = {}

@app.route('/pubsub/push', methods=['POST'])
def pubsub_push(data=None, context=None):
    """Handle the Pub/Sub push notification."""
    envelope = request.get_json()
    
    if not envelope or 'message' not in envelope:
        return jsonify({'error': 'Invalid request'}), 400


    # specifying bucket and file name directly for testing
    bucket_name = 'preprocesskline'
    data = 'data_5m.csv'
    scaler = 'scaler5m.joblib'




    print(f"Received files in bucket: {bucket_name}")


    # Call preprocessing function here
    response = preprocess_and_predict(bucket_name, data, scaler)

    if isinstance(response, tuple):
        return response  # Return the response from preprocess_and_predict
    return jsonify({'error': 'Prediction failed'}), 500

@app.route('/preprocess-and-predict', methods=['POST'])
def preprocess_and_predict(bucket_name, data, scaler):
    """Preprocess data, make predictions, and return inverse scaled results."""

    # Initialize Google Cloud clients
    storage_client = storage.Client()
    aiplatform.init(project='agent-xtransformers', location='us-central1')
    endpoint_id = '2148745887348686848'

    print("initialized the gcp clients")

# -----
    bucket = storage_client.bucket(bucket_name)
    datablob = bucket.blob(data)
    scalerblob = bucket.blob(scaler)

    data = datablob.download_as_text()
    scaler = scalerblob.download_as_bytes()  # Download as binary
    scaler = joblib.load(io.BytesIO(scaler))  # Load from binary stream

    print(data)

# -----
    data = pd.read_csv(io.StringIO(data))

    columns_to_drop = ['volume']

    data = data.drop(columns=columns_to_drop, errors='ignore')

    data = data.sort_values('timestamp')

    data.fillna(method='ffill', inplace=True)

    data.reset_index(drop=True, inplace=True)

# -----
    data['SMA_10'] = ta.trend.sma_indicator(data['close'], window=10)
    data['EMA_10'] = ta.trend.ema_indicator(data['close'], window=10)

    data['RSI'] = ta.momentum.rsi(data['close'], window=14)

    data['MACD'] = ta.trend.macd(data['close'])

    data['Bollinger_High'] = ta.volatility.BollingerBands(data['close'], window=20, window_dev=2).bollinger_hband()
    data['Bollinger_Low'] = ta.volatility.BollingerBands(data['close'], window=20, window_dev=2).bollinger_lband()

    print("calculated technical indicators", data)

# -----
    def create_features(data):
        # Create lagged features for RSI
        data['RSI_lag1'] = data['RSI'].shift(1)
        data['RSI_lag2'] = data['RSI'].shift(2)

        # Calculate RSI differences
        data['RSI_diff'] = data['RSI'].diff()

        return data

    data = create_features(data)

    print("created extra features", data)

# -----
    training_feature_order = [
        'open',
        'high',
        'low',
        'close',
        'SMA_10',
        'EMA_10',
        'RSI',
        'MACD',
        'Bollinger_High',
        'Bollinger_Low',
        'RSI_lag1',
        'RSI_lag2',
        'RSI_diff'
    ]

    data = data[training_feature_order]

    print(data)

    print("sorted with training order")

# -----
    numeric_columns = data.select_dtypes(include=[np.number]).columns.tolist()
    data_to_scale = data[numeric_columns]
    number_of_features = len(numeric_columns)

    print(numeric_columns)
    print(data_to_scale)
    print(number_of_features)

# -----
    time_steps = 5

    data_to_scale = data_to_scale.dropna()

    scaled_data = scaler.transform(data_to_scale)

    print(scaled_data)

    def publish_prediction(predicted_close):
        try:
            bucket_name = 'finalresult'  # desitnation bucket after prediction
            destination_blob_name = 'prediction'  # name for file prediction will be saved as
            
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(destination_blob_name)

            # convert the predicted close price to string and upload it as a text file
            data_to_upload = str(predicted_close)
            print(data_to_upload)
            
            blob.upload_from_string(data_to_upload, content_type='text/plain')

            print(f"File uploaded to {bucket_name}/{destination_blob_name} with predicted_close: {data_to_upload}")
        
        except Exception as e:
            print(f"Error uploading file to bucket: {e}")


    def create_sequences(data, time_steps=5):
        sequences = []
        for i in range(len(data) - time_steps):
            seq = data[i:i + time_steps]
            sequences.append(seq)
        return np.array(sequences)

    sequences = create_sequences(scaled_data, time_steps)

    target_values = scaled_data[time_steps:, 3]

    last_5_rows = scaled_data[-5:]

    input_data = last_5_rows.reshape(1, 5, last_5_rows.shape[1])

    instances = input_data.tolist()

    print("instances", instances)

    # Define the endpoint name
    endpoint_name = f'projects/agent-xtransformers/locations/us-central1/endpoints/2148745887348686848'

    # Create the Endpoint object
    endpoint = aiplatform.Endpoint(endpoint_name=endpoint_name)

    # Send input data to the endpoint and get predictions
    predictions = endpoint.predict(instances=instances)

    print(predictions)

# -----

    predictions_list = predictions.predictions

        # The price prediction is the first value in the inner list
    predicted_mean = predictions_list[0][0]  # First item in the first prediction

        # Reshape as needed
    number_of_features = scaled_data.shape[1]  # Assuming the number of features is known
    predicted_mean_reshaped = np.zeros((1, number_of_features))  # Assuming a single prediction
    predicted_mean_reshaped[0, 0] = predicted_mean 

        # Inverse transform to get the predicted mean price
    predicted_mean_inverse = scaler.inverse_transform(predicted_mean_reshaped)[:, 0]

        # Store prediction results in a global variable
    predictions_store['predicted_close'] = predicted_mean_inverse[0]

    print('predicted_mean_inverse', predicted_mean_inverse)

    publish_prediction(predicted_mean_inverse[0])

    
    #return jsonify({'message': 'Processing complete'}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
