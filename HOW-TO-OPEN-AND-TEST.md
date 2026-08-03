# Open and test TickMint on Windows

## Fastest method

1. Extract the ZIP completely. Do not run it from inside the ZIP preview.
2. Open the extracted folder.
3. Double-click `START-TICKMINT.cmd`.
4. Allow the first dependency installation to finish.
5. Your normal browser should open at `http://localhost:3000`.
6. Keep the command window open while testing.
7. Select **View live demo** to test without Supabase.

## From VS Code

1. In VS Code choose **File > Open Folder** and select this project folder.
2. Choose **Terminal > New Terminal**.
3. Switch the terminal profile to **Command Prompt**, not PowerShell.
4. Run:

```bat
npm.cmd ci
npm.cmd run dev
```

5. Open Chrome or Edge manually and type `http://localhost:3000`.

## Important

- Do not run `npx create-next-app`. This is already a complete Next.js project.
- Do not press `Ctrl+C` while testing; it stops the local server.
- If `localhost` refuses to connect, start the server again.
- If Next.js is not found, run `RESET-AND-START.cmd`.

## Real Supabase accounts

Demo mode works immediately. For cloud accounts, follow `README.md`, run `supabase/schema.sql` in Supabase, create `.env.local`, and add the project URL and anon key.
