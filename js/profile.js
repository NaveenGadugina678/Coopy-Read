import {
  isConfigured,
  auth,
  db,
  onAuthStateChanged,
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

import { getInitials } from "./stories.js";

let user = null;
let profile = null;

function toast(msg) {
  const root = document.querySelector("#toast-root");
  const node = document.createElement("div");

  node.className = "toast";
  node.textContent = msg;

  root.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}

function updateHeader() {
  const chip = document.querySelector("#auth-chip");
  const action = document.querySelector("#auth-action");

  if (user) {
    chip.textContent = user.displayName || user.email.split("@")[0];

    action.textContent = "Log out";

    action.onclick = async () => {
      const { signOut } = await import("./firebase.js");
      await signOut(auth);
      location.href = "index.html";
    };
  } else {
    chip.textContent = "Log in";
    action.textContent = "Log in";
    action.onclick = () => {
      location.href = "login.html";
    };
  }
}

function renderProfile() {
  const name =
    profile?.displayName ||
    profile?.username ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Reader";

  const bio =
    profile?.bio ||
    "A quiet corner for stories.";

  document.querySelector("#profile-name").textContent = name;
  document.querySelector("#profile-bio").textContent = bio;

  document.querySelector(".profile-avatar").textContent =
    getInitials(name);
}

function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );
}

function miniHTML(story) {
  return `
    <article class="mini-story">
      <span class="story-category">
        ${escapeHTML(story.category || "Story")}
      </span>

      <h3>${escapeHTML(story.title || "Untitled")}</h3>

      <p>${escapeHTML(story.body || "")}</p>

      <footer>
        <span>${escapeHTML(story.authorName || "You")}</span>
        <span>${escapeHTML(story.readingTime || "")}</span>
      </footer>
    </article>
  `;
}

function renderEmptyStories() {
  document.querySelector("#my-stories").innerHTML = `
    <div class="empty-card-large">
      <h2>Your first story is waiting.</h2>
      <p>Put a small world on the page.</p>
      <a class="button button-primary" href="write.html">
        Write a story →
      </a>
    </div>
  `;
}

async function loadProfile() {
  if (!user || !isConfigured) {
    document.querySelector("#story-count").textContent = "0";
    document.querySelector("#saved-count").textContent = "0";
    renderProfile();
    renderEmptyStories();
    return;
  }

  try {
    // Load profile
    const profileSnap = await getDoc(
      doc(db, "users", user.uid)
    );

    profile = profileSnap.exists()
      ? profileSnap.data()
      : {
          displayName: user.displayName || user.email.split("@")[0],
          username: user.displayName || user.email.split("@")[0],
          bio: ""
        };

    renderProfile();

    // Load user's stories.
    // We intentionally avoid orderBy() here so a composite
    // Firestore index is not required.
    const storiesQuery = query(
      collection(db, "stories"),
      where("authorId", "==", user.uid),
      limit(30)
    );

    const storySnap = await getDocs(storiesQuery);

    const stories = storySnap.docs
      .map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

    // Load saved stories
    const savedSnap = await getDocs(
      collection(
        db,
        "users",
        user.uid,
        "savedStories"
      )
    );

    document.querySelector("#story-count").textContent =
      stories.length;

    document.querySelector("#saved-count").textContent =
      savedSnap.size;

    if (stories.length === 0) {
      renderEmptyStories();
    } else {
      document.querySelector("#my-stories").innerHTML =
        stories.map(miniHTML).join("");
    }

  } catch (error) {
    console.error("PROFILE FIREBASE ERROR:", error);

    document.querySelector("#story-count").textContent = "0";
    document.querySelector("#saved-count").textContent = "0";

    document.querySelector("#my-stories").innerHTML = `
      <div class="empty-card-large">
        <h2>Couldn't load your stories.</h2>
        <p>
          Your account is signed in, but Firebase couldn't
          load your profile data.
        </p>
        <p style="font-size:.85rem;opacity:.7;">
          Check the browser console for the Firebase error.
        </p>
      </div>
    `;
  }
}


// Edit profile
document
  .querySelector("#edit-profile-btn")
  ?.addEventListener("click", () => {

    if (!user) {
      location.href = "login.html";
      return;
    }

    document.querySelector("#edit-username").value =
      profile?.username ||
      profile?.displayName ||
      user.displayName ||
      "";

    document.querySelector("#edit-bio").value =
      profile?.bio || "";

    document
      .querySelector("#edit-modal")
      .classList.remove("hidden");
  });


// Close modal
document
  .querySelector("[data-close-modal]")
  ?.addEventListener("click", () => {
    document
      .querySelector("#edit-modal")
      .classList.add("hidden");
  });


// Save profile
document
  .querySelector("#profile-form")
  ?.addEventListener("submit", async event => {

    event.preventDefault();

    if (!user || !isConfigured) {
      toast("Sign in to edit your profile.");
      return;
    }

    const username =
      document
        .querySelector("#edit-username")
        .value
        .trim();

    const bio =
      document
        .querySelector("#edit-bio")
        .value
        .trim();

    if (username.length < 2) {
      toast("Username is too short.");
      return;
    }

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          username,
          displayName: username,
          bio
        },
        { merge: true }
      );

      profile = {
        ...profile,
        username,
        displayName: username,
        bio
      };

      renderProfile();

      document
        .querySelector("#edit-modal")
        .classList.add("hidden");

      toast("Profile saved.");

    } catch (error) {
      console.error("PROFILE SAVE ERROR:", error);
      toast("Couldn't save your profile.");
    }
  });


// Close modal by clicking backdrop
document
  .querySelector("#edit-modal")
  ?.addEventListener("click", event => {
    if (event.target.id === "edit-modal") {
      event.target.classList.add("hidden");
    }
  });


// Active navigation
document
  .querySelectorAll("[data-nav]")
  .forEach(link => {
    link.classList.toggle(
      "active",
      link.dataset.nav === "profile"
    );
  });


// Firebase authentication
if (isConfigured) {

  onAuthStateChanged(auth, async currentUser => {
    user = currentUser;

    updateHeader();

    if (user) {
      await loadProfile();
    } else {
      location.href = "login.html";
    }
  });

} else {

  // Firebase isn't configured.
  document.querySelector("#story-count").textContent = "0";
  document.querySelector("#saved-count").textContent = "0";

  document.querySelector("#profile-name").textContent =
    "Firebase not connected";

  document.querySelector("#profile-bio").textContent =
    "Connect Firebase to use your real profile.";

  renderEmptyStories();
}