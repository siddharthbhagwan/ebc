This project is a map blog of the Everest Base Camp 3 Pass Trek I undertook in May 2016.

I've acquired the data from Google Maps API via the Google Cloud Platform and [gpsies.com](gpsies.com)

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
It uses React, Redux and TypeScript and is hosted on [http://coderbear.com/ebcd](http://coderbear.com/ebcd) via GitHub Pages.

Feel free to reach out to me on [Twitter](https://twitter.com/siddhartha_b) and thanks for checking this out!

## Dev Server Watchdog

If the local dev server drops, you can keep it alive with:

```sh
npm run watch:dev
```

Defaults:
- Checks `http://localhost:3000` every 15 seconds
- Starts the server with `bun run start`

Overrides:
- `SERVER_WATCH_INTERVAL_SECONDS` (e.g., `10`)
- `DEV_SERVER_HEALTHCHECK_URL` (e.g., `http://localhost:3000/health`)
- `DEV_SERVER_START_COMMAND` (e.g., `npm run start`)
