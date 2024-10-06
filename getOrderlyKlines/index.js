import express from 'express';
import { PubSub } from '@google-cloud/pubsub';
import dotenv from 'dotenv';

// Initialize environment variables and PubSub client
dotenv.config();
const pubSubClient = new PubSub();

// Create Express app and enable JSON parsing
const app = express();
app.use(express.json()); 

// Function to publish data to Pub/Sub
async function publishDataToPubSub(rows, topicName) {
  for (const row of rows) {
    const messageBuffer = Buffer.from(JSON.stringify(row));
    const messageId = await pubSubClient
      .topic(topicName)
      .publish(messageBuffer, { orderingKey: 'kline-data' });
  }
}

// Main entry point for Cloud Function
app.post('/getOrderlyKlines', async (req, res) => {
  try {
    const ohlcvData = req.body; // Incoming OHLCV data from the Empyreal SDK
    console.log('Received OHLCV data:', ohlcvData);

    // Publish to Pub/Sub or save for further processing
    await publishDataToPubSub(ohlcvData.data.rows, 'streamOrderlyKline');  // Added .data.rows to access inner rows

    // Acknowledge successful ingestion
    res.status(200).send('OHLCV data processed and published.');
  } catch (error) {
    console.error('Error processing OHLCV data:', error);
    res.status(500).send('Error processing OHLCV data');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
