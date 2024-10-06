import { Storage } from '@google-cloud/storage';
import express from 'express';

const app = express();
app.use(express.json());

// initialize Google Storage client
const storage = new Storage();

// buckt name and file name
const bucketName = 'finalresult';  
const fileName = 'prediction';

let myVariable = "Hello, world! This is my variable.";

// Function to download the file from the Cloud Storage bucket and update myVariable
const downloadAndUpdateVariable = async () => {
  try {
    // Download file content from the bucket
    const [fileContents] = await storage.bucket(bucketName).file(fileName).download();
    
    console.log(fileContents)
    // Update myVariable with the file content
    myVariable = fileContents.toString();
    
    console.log(`Updated variable from bucket: ${myVariable}`);
  } catch (error) {
    console.error('Error downloading file from bucket:', error);
  }
};

// HTTP handler to respond to `GET` requests
app.get('/', async (req, res) => {
  try {
    // ensure variable is updated before returning it
    await downloadAndUpdateVariable();

    res.status(200).send({ success: true, currentVariable: myVariable });
  } catch (error) {
    console.error('Error handling GET request:', error);
    res.status(500).send('Error processing GET request');
  }
});

app.post('/', async (message, context) => {
    await downloadAndUpdateVariable();
    console.log("i was posted")
})

// Entry point for Cloud Func
export const returnPrediction = app;
