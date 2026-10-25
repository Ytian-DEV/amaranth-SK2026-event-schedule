# SalingKusog 2026 Schedule of Games

A static, mobile-friendly schedule site for SalingKusog 2026. The site is self-contained in `index.html`, including the schedule data and team artwork, so it requires no database or runtime environment variables.

## Local preview

Run `npm start`, then open the local address shown in the terminal. The command uses `npx` to fetch the lightweight static server if it is not already available.

## Deploy to Vercel

1. Push this project to the `Ytian-DEV/amaranth-SK2026-event-schedule` repository.
2. In Vercel, select **Add New → Project** and import that repository.
3. Keep the framework preset as **Other**; no build command or output directory is required.
4. Click **Deploy**.

There are no required environment variables and no Supabase setup. The supplied design is a published schedule with client-side search, filters, and expandable game details; it does not include an admin workflow or require live schedule editing.

## Updating the schedule

The fixtures and program entries are held in the `D` and `EV` data declarations near the bottom of `index.html`. Update those values and redeploy to publish a revised schedule.
