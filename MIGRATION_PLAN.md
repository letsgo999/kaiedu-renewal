# KAIEDU Renewal Migration Plan

## Source Archives

- Existing live app: `webapp_backup_is0m6ul7.tar.gz`
- Stitch redesign bundle: `stitch_ai_expert_matching_platform.zip`

## Recommended Strategy

Use the existing Hono / Cloudflare Pages app as the base, then migrate Stitch front-end designs route by route. Do not replace the whole project with Stitch HTML files, because the current app includes working DB-backed instructor flows, consultation generation, admin routes, SEO files, and Cloudflare configuration.

## Route Mapping

| Current route | Existing file | Stitch reference | Notes |
| --- | --- | --- | --- |
| `/` | `src/routes/home.tsx` | `kaiedu_full_landing_page_content_restored/code.html` | Best home candidate. Korean renders correctly and original KAIEDU content is preserved. |
| `/consult` | `src/routes/consult.tsx` | `kaiedu_premium_integrated_ai_consultation/code.html` | Use as visual reference only. Keep current `consult-chat`, `consult-config`, and `/consult/api/generate` behavior. |
| `/instructor/register` | `src/routes/instructor.tsx` | `kaiedu_premium_integrated_instructor_registration/code.html` | Use the visual style while preserving current `instructor-form` fields and `/instructor/api/register`. |
| `/instructor/list` | `src/routes/instructor.tsx` | `kaiedu_premium_integrated_instructor_directory/code.html` | Use layout ideas only. Keep DB-driven instructor list, filters, and query parameters. |

## Deployment Notes

- Start a new Git repository from `kaiedu-renewal`.
- Change the Cloudflare Pages project name before deploying separately.
- Do not reuse the production D1 database for testing unless intentional.
- If GitHub is created with `gh`, local permission may be required because the GitHub CLI config is outside the workspace sandbox.

## Suggested Milestones

1. Build and run the copied existing app unchanged.
2. Replace the home page design first, then verify links and Korean rendering.
3. Restyle consultation, instructor registration, and instructor list without changing their API contracts.
4. Initialize Git, commit the baseline, create a new GitHub repo, then connect/deploy to a separate Cloudflare Pages project.
