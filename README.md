# Assignments

Your weekly Canvas assignments with bubble checkboxes, for embedding in Notion.

## Put it online (one time, about 10 minutes)

1. **GitHub:** make a free account at github.com, click **New repository**, name it `assignments`, set it to **Private**, and create it. Click **uploading an existing file**, drag in everything from this folder (including the `netlify` and `img` folders), and click **Commit changes**.
2. **Netlify:** go to app.netlify.com, click **Add new site → Import an existing project → GitHub**, and pick `assignments`. Leave the settings as they are.
3. **Your Canvas link:** before you click Deploy (or after, under **Site configuration → Environment variables**), add a variable:
   - Key: `CANVAS_FEED_URL`
   - Value: your Canvas calendar feed link (the one ending in `.ics`)
4. Click **Deploy**. If you added the variable after deploying, go to **Deploys → Trigger deploy** once.
5. Open your new site link. The footer should say "Synced with Canvas" with a time.

## Put it in Notion

Type `/embed`, paste your Netlify site link, and click **Embed link**.

## How it works

- Every time you open it, it pulls your latest Canvas assignments. You don't need to do anything.
- It shows Tuesday through Monday 11:59pm, and flips to the new week at midnight.
- Checkmarks are saved on Netlify, so they match on your phone, laptop, and in Notion.
- If the footer says "Offline copy", the Canvas variable isn't set yet (see step 3).
