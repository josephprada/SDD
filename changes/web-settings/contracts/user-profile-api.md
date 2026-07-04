# API Contract: User Profile (Convex)

**Change**: web-settings  
**Module**: `convex/users.ts`

---

## Queries

### `users.currentUser` (extendida)

**Auth**: required for data; returns `null` if unauthenticated

**Returns**

```ts
{
  userId: Id<"users">;
  email: string;           // read-only (Google)
  name: string;            // displayName override or OAuth name
  picture?: string;        // custom avatar URL or Google picture
  hasCustomAvatar: boolean;
  theme: Theme;            // from preferences (compat)
}
```

**Resolution**: ver `design.md` §Perfil.

---

## Mutations

### `users.updateDisplayName`

**Args**: `{ displayName: string }`

**Validation**

- Trim; length 1–80
- Reuse `validateNonEmptyName`

**Effect**: patch `userProfiles.displayName`, `profileUpdatedAt`

---

### `users.generateAvatarUploadUrl`

**Args**: `{}`

**Returns**: upload URL string (Convex storage)

**Auth**: required

---

### `users.setAvatar`

**Args**: `{ storageId: Id<"_storage"> }`

**Validation**

- Fetch storage metadata; mime JPEG/PNG; size ≤ 2 MB
- Delete previous `avatarStorageId` if present

**Effect**: patch `userProfiles.avatarStorageId`

---

### `users.removeAvatar`

**Args**: `{}`

**Effect**: delete storage blob if any; clear `avatarStorageId`

---

## Client

`ProfileEditor` usa flujo:

1. `generateAvatarUploadUrl` → POST file → `setAvatar({ storageId })`
2. `updateDisplayName` on save
3. `removeAvatar` on "Usar foto de Google"

Reactive via `useQuery(api.users.currentUser)` — shell/dashboard actualizan solos.
