### Environment needed.

Create under this folder an `.env` file with:

```
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"

AWS_PARQUET_BUCKET="taken from AWS stack-worker deployment"
AWS_CSV_BUCKET="taken from AWS stack-worker deployment"

TASK=extract|save
TARGET_URL="taken from stack-ext-service deployment"
CHAIN_ID=1
WALLET=0x154120A6aEACd1334204b24dCBA4B7bCe83851d4
FROM_BLOCK=0
TO_BLOCK=2000
```

### Docker/Podman
- Set or export proper environment variables.
- `podman build -t web3_extractor .`
- `podman run -p 7010:7010 --rm -it web3_extractor`

### Installation and running

- Install NodeJS 20+.
- Install pnpm `npm install -g pnpm`
- Install packages `pnpm i`
- Run with `pnpm start`
