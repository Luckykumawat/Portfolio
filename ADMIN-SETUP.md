# Dynamic portfolio & admin setup

The portfolio keeps its static HTML/CSS design, with live content supplied by Supabase. No React migration or frontend build is required. The bundled browser SDK is @supabase/supabase-js 2.119.0.

## What the dashboard manages

Open `/admin/` to sign in. `/admin/?preview=1` provides a clearly labelled, read-only preview using the existing content snapshot; preview saves, deletes, imports and uploads are disabled.

- Projects: title, type/subtitle, description, cover, additional screenshots, live URL, GitHub URL, tags, category, status and display order.
- Homepage selection: Featured on homepage and Homepage order on each project/software record.
- Current work: choose In progress and Show in current work. Completed work cannot remain a current focus.
- Features/services: add, edit, delete, publish and reorder.
- Photoshoot: image upload or URL, title, accessible alt text, album and order. Public album filtering, 3D sphere and lightbox are retained.
- Software: dedicated entries with images, demo/download and repository links.
- Mascots: add/edit/delete characters, upload directions and reactions sheets, preview cursor following and all nine reaction frames, choose category/New/Original flags, set display order and save drafts or publish.
- Profile: name, headline, bio, photo, skills, expertise, availability, contact/social links, resume URL and homepage introductions.

Every entry supports Draft / Published. Public pages query only published entries, and database policies independently enforce that restriction. Editing a published entry and saving it updates the live entry; there is no separate revision history. Uncheck Published to hide it. Uploaded files are public portfolio media, including files not yet attached to published entries. Deleting an entry removes the record, not shared image assets.

## Connect a NEW Supabase project

1. Create a new Supabase project in your account. Choose the region you want for your database and keep its database password private.
2. In the project's SQL Editor, run `supabase/schema.sql`, then `supabase/mascots.sql`. These create the content/profile/admin/mascot tables, RLS policies, update timestamps, and the `portfolio-media` image bucket (8 MB per file; raster image types only). They are safe to rerun on this new portfolio project.
3. In Authentication > Users, create your owner account with email and password. Enable the Email provider. Set the Site URL and allowed redirect URLs to your deployed portfolio URL. There is no public signup form in this dashboard; disable public signups if this project is only for your portfolio.
4. Run `supabase/bootstrap-admin.sql` in the SQL Editor. It is configured for the confirmed owner email `okuma.jaipur@gmail.com`. Confirm one row exists in `portfolio_admins` for that user's ID. Admin roles can only be granted through trusted server/SQL access; the dashboard cannot grant itself access.
5. In `cms/config.mjs`, set `supabaseUrl` and `supabasePublishableKey` using Project Settings > API. The publishable key (or legacy anon key) is intended for browser use. NEVER place a secret/service-role key, database password or personal access token in this file.
6. Deploy these files to your existing static host. Open `/admin/`, sign in with your owner account, open Connection, and select Import existing content.
7. Verify the homepage, Projects, Software, Profile, Contacts and Photoshoot pages. Add a draft test entry; ensure it is not public. Publish it, verify it, then delete it.

The import adds 69 entries: 12 projects, 2 software entries, 9 services and 46 existing photo URLs, plus the profile. It uses stable UUIDs and ignores existing IDs, so rerunning it preserves dashboard edits. Existing local image paths remain on the website host. Existing remote photo URLs are retained; import does not download or rehost them. New uploads go to Supabase Storage.

Until a project is configured, public pages use `data/portfolio.json` as their initial content source. Once configured, Supabase becomes authoritative: an intentionally empty database shows empty sections, not the old snapshot. A failed request shows a load error. The snapshot is only imported by an approved, signed-in admin through the Connection page.

## Deployment

GitHub Pages uses the `Deploy portfolio` Actions workflow in `.github/workflows/pages.yml`. Set the Pages publishing source to GitHub Actions. Each push to `main` runs the existing tests, stages runtime assets with `python3 scripts/package-pages.py`, uploads `_site`, and deploys it. Original artwork sources in `characters/`, Git data and tests are excluded from the published artifact. The package is about 51 MiB. Deployments run one at a time with a 20-minute publish timeout. `/deploy-version.json` identifies the published commit for rollout verification. A workflow dispatch can retry deployment without changing content.

Existing HTML filenames and relative paths are retained, including `Projects.html`, `Softwares.html` and `conetct.html`, for compatibility with existing links and GitHub Pages subdirectories. Keep the complete `cms/`, `data/` and `admin/` folders in the deployment. The existing Mascot page and all 77 characters remain.

Content edits through the dashboard require no GitHub commit or rebuild. Layout/code changes still go through GitHub. Public pages fetch current content on each page load; an already open page updates when refreshed.

## Verification

### Manage mascots

Open **Mascots → Add mascot**. Enter a name, category and optional description; leave Character ID blank to generate it from the name. Upload two PNG/WebP sheets (up to 8 MB each), each a square 3×3 grid with identical dimensions. Directions are in reading order: up-left, up, up-right / left, center, right / down-left, down, down-right. New sequential reactions are blink, happy, surprised / heart, wink, proud / sleepy, dizzy, laugh. Character scale and placement should match in every frame. The editor checks image dimensions and shows the sheets and live character together; inspect alignment visually before publishing.

Choose **Preview character**, move the cursor, click the character or use the reaction buttons. Select **Published** and save to make the mascot visible; an open public page needs a refresh. Drafts can be saved with incomplete artwork, and public queries exclude them. Search/filter the collection and use **Edit / preview** to update existing mascots or unpublish them. **New characters**, **Our originals**, category and display order control the gallery filters and placement. Classic mascots keep their original boop behavior; the editor can inspect their nine frames. Deleting a mascot keeps shared/uploaded sprite files. All 77 existing characters are migrated with their original assets and order. Import existing content also imports missing original mascots without overwriting edits.

Run `node --test tests/*.test.mjs`. Database policy verification was also run against a local PostgreSQL-compatible engine using the actual schema and simulated Supabase auth/storage schemas, exercising anonymous, normal-user and admin access, including mascot draft isolation and CRUD. This is not a substitute for the live project setup checks above.

The connected project is `okuma-portfolio` (`qlmesugyobjvcwnthizl`, Mumbai). Existing content and profile have been imported; the confirmed owner account has admin access and public signup is disabled. Live API reads and the signed-in dashboard have been verified. Read-only previews do not prove storage uploads or production CRUD.
