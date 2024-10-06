import { PubSub } from '@google-cloud/pubsub';
import { BigQuery } from '@google-cloud/bigquery';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { Storage } from '@google-cloud/storage';
const storage = new Storage();
import { google } from 'googleapis';

// Initialize clients
const pubSubClient = new PubSub();
const bigQueryClient = new BigQuery();

export const analyseProcessData = async (message, context) => {
  try {
    const pubSubMessage = Buffer.from(message.data, 'base64').toString();
    console.log('Received Pub/Sub message:', pubSubMessage);
    

    // Fetch environment variables
    const datasetId = process.env.DATASET_ID;
    const klineTable = process.env.ORDERLY_DATA_ID;
    const metadataTable = process.env.METADATA_TABLE;
    const projectId = process.env.PROJECT_ID;
    const bucketName = 'preprocesskline';

    // Query to get the last 30 rows from the BigQuery table
    const newRowsQuery = `
        SELECT * 
        FROM \`${projectId}.${datasetId}.empyrealstream\`
        ORDER BY timestamp DESC
        LIMIT 30;  -- Fetch the last 30 rows
    `;


    // Execute the query
    console.log(newRowsQuery);
    await new Promise(resolve => setTimeout(resolve, 5000));  // Optional: Wait for buffer clearance
    const [newRows] = await bigQueryClient.query(newRowsQuery);

    console.log(newRows);
    console.log(newRows.length);

    if (newRows.length === 0) {
        console.log('No new data found');
        return;
    }

    console.log(`Found ${newRows.length} new entries`);
    
    // Function to convert an array of objects to CSV
    function convertToCSV(data) {
        if (data.length === 0) return ''; // No data to convert

        const headers = Object.keys(data[0]);
        const csvRows = data.map(row => 
            headers.map(header => JSON.stringify(row[header] || '')).join(',')
        );
        // Join headers and rows with newline
        return `${headers.join(',')}\n${csvRows.join('\n')}`;
    }

    async function uploadToBucket(bucketName, fileName, data) {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);

        // Convert the data to CSV format
        const csvData = convertToCSV(data);

        // Save the CSV file
        await file.save(csvData);
        console.log(`CSV Data uploaded to ${bucketName}/${fileName}`);
    }

    // Example usage
    const fileName5m = `data_5m.csv`; // Include `.csv` in the file name
    await uploadToBucket(bucketName, fileName5m, newRows);


    // 4. Update metadata table with the latest processed timestamp
    // const currentTimestamp = Date.now() - (60 * 1000); // Subtract 1 minute in milliseconds

    // const updateMetadataQuery = `
    // UPDATE \`${projectId}.${datasetId}.${metadataTable}\`
    // SET last_processed_timestamp = @currentTimestamp
    // WHERE TRUE;
    // `;

    // await bigQueryClient.query({
    // query: updateMetadataQuery,
    // params: { currentTimestamp },
    // });



    // await startWorkbenchInstance();
    // await waitForInstanceToRun(); 
    // await triggerNotebookExecution();

  } catch (error) {
    console.error('Error processing data:', error);
  }
};


