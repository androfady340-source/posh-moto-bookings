# Noir Auto Haus

A luxury automotive showroom and booking experience for premium cars and motorcycles. The storefront presents vehicle specifications, image galleries, EGP pricing, customer reviews, and booking requests with a 5% InstaPay deposit. An admin-only area manages vehicles, images, bookings, and review approvals.

**Live app:** https://posh-moto-bookings.lovable.app

## Features

- Luxury car and motorcycle catalogue with English and Arabic descriptions.
- Vehicle detail pages with specifications, image angles, and EGP prices.
- Booking requests for reservations, viewings, or both.
- Deposit calculation enforced by the database at 5% of the current vehicle price.
- Admin booking review, payment-status updates, and WhatsApp contact links.
- Admin management of vehicles, image galleries, availability, and customer reviews.
- Customer reviews are hidden until approved by an administrator.
- Responsive interface with light/dark styling and language switching.

## Technology

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Supabase Auth and PostgreSQL with Row Level Security
- Supabase Storage for vehicle gallery uploads
- Tailwind CSS and Radix UI
- Vitest, ESLint, and Prettier
- Nitro and Wrangler for Cloudflare Workers deployment

## Local development

### Requirements

- Bun (the repository includes `bun.lock`)
- A Supabase project with the SQL migration applied
- A Supabase Storage bucket named `vehicle-images` configured for the gallery workflow

### Install

```bash
git clone https://github.com/androfady340-source/posh-moto-bookings.git
cd posh-moto-bookings
bun install --frozen-lockfile
```

### Environment

Copy `.env.example` to `.env` and add your Supabase project values.

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase URL used by the browser |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public/publishable Supabase key used by the browser |
| `SUPABASE_URL` | Supabase URL used by server-side requests |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable key used by server-side authenticated requests |

The repository includes a server-only helper that can use `SUPABASE_SERVICE_ROLE_KEY`, but it must only be configured as a server secret if a trusted server operation actually needs it. Never expose it through a `VITE_` variable or commit it.

### Database and storage

Apply SQL files in `drizzle/migrations/` in numerical order. Configure the `vehicle-images` storage bucket in Supabase before using admin image uploads. Keep storage permissions restricted to administrators; use the project's intended public/signed-image delivery configuration for storefront images.

### Run locally

```bash
bun run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run lint` | Run ESLint |
| `bun run test` | Run the Vitest suite |
| `bun run build` | Build the Cloudflare Worker and static assets |
| `bun run deploy` | Build and deploy with Wrangler |
| `bun run preview` | Preview the Vite build |

## Security notes

- Keep local environment files out of Git; only `.env.example` belongs in version control.
- The Supabase publishable key is intended for browser use; database permissions must be enforced by RLS.
- Keep service-role credentials in Cloudflare Worker secrets only, never in browser variables.
- Booking creation is public, but the database validates the vehicle, booking date, deposit amount, and initial status.
- Admin operations are protected by the database role policies, not only by the client-side dashboard check.
- The role-check helper only returns the caller's own role and is not executable by anonymous visitors.
- Payment status is a manual admin confirmation; submitting a booking does not automatically verify an InstaPay transfer.

## Cloudflare deployment

See [CLOUDFLARE.md](./CLOUDFLARE.md) for Worker setup and deployment commands. The Worker name is configured in `wrangler.jsonc`.

## Maintainer

Andro Fady — [GitHub](https://github.com/androfady340-source)
