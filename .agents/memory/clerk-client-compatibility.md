---
name: Clerk client compatibility
description: Compatibility lesson for the frontend Clerk SDK and its shared package.
---

When updating Clerk client authentication, check the installed `@clerk/react` and `@clerk/shared` package declarations and dependency graph instead of assuming the current setup examples match the workspace version. A compatible package-major mismatch can pass TypeScript checks but fail during production bundling with a missing export.

**Why:** The client typechecked while its production bundle failed on a missing symbol from `@clerk/shared`; upgrading to the current compatible Clerk client/shared major resolved the runtime build failure.

**How to apply:** Verify both `typecheck` and a production build after Clerk changes. Prefer a compatible SDK upgrade over a local alias or shim for a missing Clerk export.
