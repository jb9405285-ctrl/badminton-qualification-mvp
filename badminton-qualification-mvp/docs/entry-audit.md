# Entry Audit

This page records which dashboard entries are real, which are intentionally disabled, and which legacy fake-entry patterns were removed.

## Enabled

- `./dashboard` -> Next-step action center with real navigation to events, batch check, and history
- `./dashboard/events` -> Real event management and batch linkage
- `./dashboard/batch-check` -> Real upload workflow
- `./dashboard/history` -> Real batch lineage and bulk actions
- `./dashboard/settings` -> Rules and data explanation page with real navigation back to operations pages

## Disabled

- None in the current dashboard/settings scope

## Deleted

- Legacy "settings center" framing on `/dashboard/settings`
- Legacy explanation-heavy "待处理事项" language on `/dashboard`
- Any implied non-interactive settings controls that would have pretended to be configurable

## Notes

- All remaining visible actions in the two scoped pages are real navigation links or plain informational blocks.
- If a future feature is not implemented, prefer disabled state with `即将开放` or remove it entirely.
