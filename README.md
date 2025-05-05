### Description

`./aws-infra` -> Deploy code to AWS using CDK and TypeScript. <br>
`./ext-service` -> Deploy external service to simulate a third party service we can pull the data 'unlimited/uncapped'. <br>
`./worker` -> To extract data using the ext-service, or save the data to AWS S3. <br>
`./scheduler` -> To schedule and dispatch AWS EC2 containers given the a wallet address, chain id, and block range. <br>

### Initiative

A minimal conceptual mvp of this project, but using 'distributed' task with AWS ECS: https://github.com/DarkRoku12/web3-scrapper-node
Assuming we're not capped by Alchemy, we may build .parquet files sequentially and run analysis with any proper tool, as well as easily generating .csv files with DuckDB.
