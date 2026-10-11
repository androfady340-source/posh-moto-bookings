<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Admin access is granted only via `public.user_roles` (trigger assigns admin to the owner email on signup); all data protection relies on RLS, not route guards.
- Booking deposit is computed by a DB trigger (`bookings_before_insert`), never trusted from the client.
- Vehicle images live in a private storage bucket; uploads store a long-lived signed URL in `vehicle_images.url`.
