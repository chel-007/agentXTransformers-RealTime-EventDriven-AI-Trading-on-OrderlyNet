## agentXTransformers - RealTime EventDriven Autonomous Trading AI

**agentXtransformers** is an advanced machine learning-powered trading agent designed for margin trading on Orderly Network's decentralized order book. The implementation is *real-time*, *flexible*, and ***dynamic***, requiring only the creation of an Orderly account through its user-friendly interface.

***This is a walkthrough of the various components involved in its development:***

<hr>


### Trading Strategy
-   The agent seeks to secure profits on a *short-term basis* by leveraging both upward and downward market trends.
-   Every 5 minutes, it streams OHLCV (Kline) data to a Vertex AI model in the cloud for ***market direction predictions***.
-   It incorporates multiple risk management strategies, including controls for over-trading, metrics calculation, and dynamic position sizing.
-   The agent trades on the **PERP_ETH_USDC** futures market through the **Orderly Orderbook (Testnet)**.

![agent](images/agent.png)


### *Step 1: LSTM Unsupervised ML Training for Market Prediction*

-   the first step is to train a suitable model. **Long Short-Term Memory (LSTM)** is an ideal machine learning technique for understanding temporal patterns in time series data, (*making it well-suited for financial trading data*).
-   the model was trained on **3 years of OHLCV data** **w/ 5-minute intervals**. This extensive dataset helps the model capture ***various market trends*** and long-term dependencies for ETH, which are essential for accurate predictions.

![3year_data](images/3year_data.png)

> since the goal is to trade on **Orderly Network's orderbook**, i've used a dataset with similar trading volume patterns to prevent bias and better generalization the real-world.

-   preprocessed the data using techniques (**scaling**, **normalization**), and generated **technical indicators** with different time windows to capture short-and-long term trends.

![tech_indicators](tech_indicators.png)

-   created sequences of 5 time steps for LSTM input, this means the model ***processes 5 consecutive data points*** to predict the next price movement. This allows the model to learn and forecast short-term trends.

> _the strategy focuses on short-term trend recognition. while adding longer sequeces could improve context, the trade off is slower reaction time and make it more reliant on older data._

-   Backtested the trained model on the validation set, (data timeline from 2024-06). Additionally, conducted backtesting on Orderly Network's Kline data over a 5-minute interval ***spanning just over 2 days***.

-   calculated several metrics, including **Mean Absolute Error** (MAE), ***R² Score***, and ***Mean Absolute Percentage Error*** (MAPE), to evaluate the model's predictive capabilities beyond just visual analysis.

![metrics](backtest_metrics.png)

<hr>

### STEP 2: GCP Data Pipeline and Event-Driven Automation
*i have utilised the following GCP services to create a robust realtime event driven Data<->Prediction pipeline:*

- **Pub / Sub:** communication across the pipeline from *Data Entry* -> *Preprocessing* -> *Prediction* -> *Upload*

- **Vertex AI:** deployed the predictive model to GCP Vertex AI for inference through an endpoint that is publicly available
- **Big Query:** created buckets for streaming orderly kline data into, formatting in the correct schema, before it can be queried for prediction
- **Cloud Function:** the endpoint connected the streaming data from the local running agent to the cloud Data preprocessing service

### Overview of the Data Pipeline Integration W/ GCP
* the first step is to have a cloud run function that is ready to accept the OHLCV data from the Local running Agent. 
* after receiving the data, the function ***publishes*** 2 messages to different Pub Sub Topics. 
* the first Pub/Sub automatically pushes it to a Big Query table (which is a subscription) as long as the schema is correct.
* and the Second topic notifies another service of the New data entry. it waits for the streaming buffer, quesrie the new set and grabs the correct number of rows (30 in our case)

> *like i mentioned, 5 **time steps** is what is required to make a prediction, so why 30 rows?. well to calculate technical indicators on the DF, **we need a window of > 20 rows**. these will be dropped in subsequent steps.*

* the data is finally distributed to a Flask app deployed on GCP that preprocesses it (as was done during training), prepares the sequences, loads the vertex endpoint and sends it for inference.
* this is how we achieve the prediction and the whole process takes less than 5 seconds.

> *i have given more timeframe(12) for this in our agent notebook due to extra latency while sending and recieveing the requests.*

The extra benefits of this event driven implementation with GCP is that everything works in perfect sync, the completion of one process is what guarantees the start of  next. Furthermore, the agent controls the system.

### STEP 3: Integration with Empyreal SDK & Orderly Network
**Empyreal SDK** provides a *streamlined* way of interacting with Orderly Networks and Trading in RealTime Simulation, with the following implementations built into the Agent:

* **Market Sentiment Analysis:** calculated using the ***Fear & Greed Index*** on each trade loop, it is complemented with closer indicators of the SMA & EMA (5 and 12 windows resp) to filter the noise that might occur in the model's pred.

* **Dynamic Positons:** the scoring from msa is used to create dynamic positon size (purchase amt) and stop loss take proit prices for risk management
* **Limit Market Orders** hedged with Take Profit. I have decided to skip adding a Stop Loss.
* **Rather a Stop loss**, the agent is built to *monitor open trades* and close them when the market moves against it by a percentage. This works for both **BUY** and **SELL** limits.
* **Tracking Volatility**: (eth can be highly volatile sometimes), the agent + model combo struggles to make successful trade, so it can ***detect this and halt trading*** (only) for the time volatility lasts.
* The model places trades from the ***joint decision weighting*** of model's prediction and market sentiment. this is compared against a *threshold* that if met, orders are placed.


> Courtesy of the bounty by **Orderly Network** X **GCP** x **StackUP**
> 
> 
> Written with [StackEdit](https://stackedit.io/).
