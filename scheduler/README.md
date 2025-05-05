### Configure environment variables.

Create under this folder an `.env` file with:

```
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"

AWS_PARQUET_BUCKET="taken from AWS stack-worker deployment"
AWS_CSV_BUCKET="taken from AWS stack-worker deployment"

AWS_CLUSTER="taken from AWS stack-worker deployment (ecs -> clusters)"
AWS_TASK_DEFINITION="taken from AWS stack-worker deployment (ecs -> task definitions)"
AWS_SUBNET="taken from AWS stack-worker deployment (vpc)"

TARGET_URL="taken from stack-ext-service deployment"
```

### Installation and running

- Install NodeJS 20+.
- Install pnpm `npm install -g pnpm`
- Install packages `pnpm i`
- Run with `npx tsx bin.ts <wallet_address> <chain_id> <from_block> <to_block>`
- Run with example: `pnpm run test`
