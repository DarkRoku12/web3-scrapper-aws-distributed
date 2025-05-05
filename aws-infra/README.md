### Configure environment variables.

Create under this folder an `.env` file with:

```
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
```

### Deployment to AWS.

- Install NodeJS 20+.
- Install pnpm `npm install -g pnpm`
- Install packages `pnpm i`
- Run with rollback enabled: `pnpm run aws-deploy --all`
- Run with rollback disabled: `pnpm run aws-deploy-nr --all`

### Teardown.

- Run with: `pnpm run aws-destroy --all`