### Environment needed.

No .env needed for this service.

### Docker/Podman
- `podman build -t ext_service .`
- `podman run -p 7010:7010 --rm -it ext_service`

### Installation and running

- Install NodeJS 20+.
- Install pnpm `npm install -g pnpm`
- Install packages `pnpm i`
- Run with `pnpm run start`.