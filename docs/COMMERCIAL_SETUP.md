# MANASIK 3D V3.0 — Commercial beta

**Current deployment:** demo only until a dedicated Supabase project exists. Do not reuse NAMANA.

1. Create dedicated Supabase project in the owner's selected organization. Enable email confirmation; configure auth redirect URLs to the production origin; review rate limits and signup protection. Use separate staff accounts with strong passwords. Set email templates/SMTP as appropriate.
2. Apply docs/commercial-schema.sql to the new project only. Enable REST Data API access. Run security advisors and independently test with two tenants and two participant accounts; test anon reads, cross-tenant denial, admin/manager permissions, consent and withdrawal. SQL is prepared but not applied or tested against a live DB.
3. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY on Vercel and rebuild. Never use service_role or secret keys in VITE_ variables. No credentials in the repository.
4. Create verified staff account via Supabase Auth. Manually grant first superadmin via SQL using exact Auth user UUID (replace placeholder): update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb) || '{"manasik_superadmin":true}'::jsonb where id = 'VERIFIED-UUID'; re-login. Grant ordinary travel manager access through Studio after creating verified account. Revoke memberships in DB; revoke superadmin claim and sessions on termination.
5. Create a partner in Studio; share ?mitra=slug links. Participants explicitly enroll before cloud progress can be recorded. Progress is self-reported by the client; it is not a certified completion or exam score. Guest progress stays local and separated by slug; no migration to enrolled progress. Sync is best-effort on checkpoint and navigation.
6. Review data retention/consent, account deletion/DSAR, deletion workflows, backup and deployment hosting plan before paid launch. No real payment, subscription, custom domain or official certificates included.

Demo uses fixed /index.html?mitra=demo-travel; custom demo branding stays in browser. No real personal data should be entered in demo. All demo metrics are fictional. URLs only support https logos; image fetched by user's device. Staff auth uses Supabase password login and sessionStorage; for production consider audited SDK/SSR cookie implementation and CSP. The browser app has no service key.
