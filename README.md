### Description

`./aws-infra` -> Deploy code to AWS using CDK and TypeScript. <br>
`./ext-service` -> Deploy external service to simulate a third party service we can pull the data 'unlimited/uncapped'. <br>
`./worker` -> To extract data using the ext-service, or save the data to AWS S3. <br>
`./scheduler` -> To schedule and dispatch AWS EC2 containers given the a wallet address, chain id, and block range. <br>