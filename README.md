# SalingKusog 2026 Schedule of Games

A static, mobile-friendly schedule site for SalingKusog 2026. The site is self-contained in `index.html`, including the schedule data and team artwork, so it requires no database or runtime environment variables.

## Local preview

Run `npm start`, then open the local address shown in the terminal. The command uses `npx` to fetch the lightweight static server if it is not already available.

## Deploy to Vercel

1. Push this project to the `Ytian-DEV/amaranth-SK2026-event-schedule` repository.
2. In Vercel, select **Add New → Project** and import that repository.
3. Keep the framework preset as **Other**; no build command or output directory is required.
4. Click **Deploy**.

## Live results and administrator setup

The schedule works without a database. To enable the **Admin results** workflow, create a Supabase project, run `supabase/schema.sql` in its SQL editor, then add these Vercel environment variables and redeploy:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Create the administrator in Supabase Auth, then run the final commented `insert` statement in `supabase/schema.sql` with that person's email. An administrator can sign in at `/#admin`, confirm the winner of a match, and the site will resolve every related “Winner/Loser of Game” fixture automatically.

## Updating the schedule

The fixtures and program entries are held in the `D` and `EV` data declarations near the bottom of `index.html`. Update those values and redeploy to publish a revised schedule.
