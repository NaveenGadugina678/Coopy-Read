# Coopy Read

**Coopy Read** is a responsive social reading prototype — “Tinder for reading” — built with plain HTML, CSS and vanilla JavaScript, with Firebase Authentication and Firestore as optional backend services.

## Stack

- HTML
- Modern CSS
- Vanilla JavaScript (ES modules)
- Firebase Authentication
- Firebase Firestore
- No React, Vue, Angular, Svelte, Tailwind, Bootstrap, Next.js or Node.js

## Project structure

```text
/
├── index.html
├── login.html
├── register.html
├── profile.html
├── write.html
├── saved.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── firebase.js
│   ├── stories.js
│   ├── swipe.js
│   ├── profile.js
│   ├── write.js
│   └── saved.js
├── assets/
│   └── logo.png
├── firestore.rules
├── firebase.json
└── README.md
```

## 1. Create Firebase project

1. Open the Firebase Console.
2. Create a project.
3. Add a **Web App** to the project.
4. Copy the Firebase web configuration.
5. Open `js/firebase.js`.
6. Replace the `YOUR_*` values in `firebaseConfig`.

The Firebase web config is intended to identify your frontend app; the actual protection comes from Authentication and Firestore Security Rules.

## 2. Enable Authentication

Firebase Console → **Authentication** → **Sign-in method**:

- Enable **Email/Password**.
- Enable **Google** if you want Google sign-in.
- Save.

## 3. Create Firestore

Firebase Console → **Firestore Database** → Create database.

Choose a suitable production configuration for your project.

Then deploy/paste the rules from `firestore.rules` into:

Firestore Database → **Rules**

The rules intentionally do **not** use the insecure pattern `allow read, write: if true;`.

## 4. Authorized domains

Firebase Console → Authentication → Settings → **Authorized domains**.

Add the domain hosting your site, for example:

- `YOUR_USERNAME.github.io`
- Your custom domain, if applicable

For local development, Firebase may already include `localhost`; add it if needed.

## 5. Run locally

Because the app uses JavaScript modules, serve it through a small static HTTP server rather than opening `index.html` with `file://`.

Any static server works. For example, VS Code's Live Server extension is enough. No Node.js build system is required.

## 6. GitHub Pages

1. Create a new GitHub repository.
2. Upload the project files.
3. Commit and push to your deployment branch.
4. GitHub → repository **Settings** → **Pages**.
5. Choose **Deploy from a branch**.
6. Select your branch and `/root` (or `/docs` if you move the files there).
7. Save.
8. Wait for GitHub Pages to publish the site.
9. Add the resulting `*.github.io` domain to Firebase Authentication's authorized domains.
10. Confirm your Firebase config is filled in in `js/firebase.js`.

GitHub Pages only hosts the static frontend. Firebase provides authentication, accounts, Firestore data and saved stories.

## 7. Firebase data model

### `users/{userId}`

```text
username
displayName
email
bio
photoURL
createdAt
```

### `stories/{storyId}`

```text
title
body
authorId
authorName
authorPhotoURL
category
readingTime
createdAt
published
likes
saveCount
```

### `users/{userId}/savedStories/{storyId}`

Minimal saved-story metadata is stored here so the saved shelf does not need to download every story in the database.

## 8. Security model

The included rules allow:

- Anyone to read published stories.
- Authenticated users to create stories only when `authorId` equals their UID.
- Authors to update/delete only their own stories.
- Users to read/write only their own saved-story subcollection.
- Users to read/update only their own profile document.

For production, consider adding stricter field validation (allowed fields/types, title/body limits, immutable author fields) as the project grows.

## 9. Demo/fallback mode

The project works before Firebase is configured:

- Home discovery uses 8 real sample stories.
- Swipe works.
- Save works using browser `localStorage`.
- Session-level story repetition is reduced using `sessionStorage`.
- Profile and saved pages show demo content.
- Publishing/login correctly tell the user that Firebase must be configured.

Once Firebase is configured and the user signs in, the app uses Firestore/Auth for the account-backed features.

## 10. Discovery behavior

The discovery feed:

- Queries published Firestore stories with a bounded result set.
- Shuffles the result client-side.
- Tracks stories already seen in the current browser session.
- Falls back to demo stories when Firestore is empty/unavailable.
- Avoids building a complex recommendation system.

## 11. Alternative static hosting

The frontend is portable and can also be deployed to:

- Cloudflare Pages
- Netlify
- Vercel

The same Firebase project can remain the backend. Do not add a platform-specific server/build dependency just to host this app.

## 12. UX flows covered

### New user
Register → Profile → Discover → Swipe → Save

### Existing user
Login → Discover → Read → Save → Saved

### Writer
Login → Write → Publish → Story appears in discovery

### Mobile
Open story → Swipe left/right → Next story

### Desktop
Use the visible ← Skip / → Continue controls instead of gestures

## 13. Important note about Firebase indexes

The sample queries are intentionally simple. If Firebase asks for a composite index when you expand queries, follow the generated Firebase Console link to create that index.

## 14. Production hardening ideas

Before a public launch, consider:

- Firebase App Check
- stricter Firestore field/type validation
- profanity/spam moderation
- rate limiting through an appropriate backend architecture
- pagination instead of a fixed discovery batch
- image upload through Firebase Storage
- server-side counters for saves/likes
- stronger author/profile validation
- reporting and blocking
- analytics with privacy-conscious configuration
