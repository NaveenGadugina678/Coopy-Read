import {
  isConfigured, auth, db, storage, onAuthStateChanged, collection, getDocs,
  query, where, limit, doc, getDoc, setDoc, deleteDoc, writeBatch, updateProfile,
  ref, uploadBytes, getDownloadURL, deleteObject
} from "./firebase.js";
import { getInitials } from "./stories.js";

let user = null;
let profile = null;

const fallbackProfile = {
  username: "Reader",
  displayName: "Reader",
  bio: "A quiet corner for stories.",
  photoURL: ""
};

const els = {
  name: document.querySelector("#profile-name"),
  bio: document.querySelector("#profile-bio"),
  avatar: document.querySelector("#profile-avatar"),
  avatarImg: document.querySelector("#profile-photo"),
  avatarInitials: document.querySelector("#profile-initials"),
  storyCount: document.querySelector("#story-count"),
  savedCount: document.querySelector("#saved-count"),
  stories: document.querySelector("#my-stories"),
  modal: document.querySelector("#edit-modal"),
  form: document.querySelector("#profile-form"),
  username: document.querySelector("#edit-username"),
  bioInput: document.querySelector("#edit-bio"),
  photoInput: document.querySelector("#profile-photo-input"),
  photoPreview: document.querySelector("#photo-preview"),
  photoName: document.querySelector("#photo-name")
};

function toast(msg, coral = false) {
  const root = document.querySelector("#toast-root");
  const node = document.createElement("div");
  node.className = `toast${coral ? " coral" : ""}`;
  node.textContent = msg;
  root.appendChild(node);
  setTimeout(() => node.remove(), 2600);
}

function updateHeader() {
  const chip = document.querySelector("#auth-chip");
  const action = document.querySelector("#auth-action");
  if (!chip || !action) return;

  if (user) {
    chip.textContent = user.displayName || user.email?.split("@")[0] || "Signed in";
    action.textContent = "Log out";
    action.onclick = async () => {
      const { signOut } = await import("./firebase.js");
      await signOut(auth);
      location.href = "index.html";
    };
  } else {
    chip.textContent = "Not signed in";
    action.textContent = "Log in";
    action.onclick = () => { location.href = "login.html"; };
  }
}

function renderAvatar(photoURL, name) {
  const initials = getInitials(name || "Reader");
  els.avatarInitials.textContent = initials;
  if (photoURL) {
    els.avatarImg.src = photoURL;
    els.avatarImg.alt = `${name || "User"}'s profile photo`;
    els.avatarImg.classList.remove("hidden");
    els.avatarInitials.classList.add("hidden");
  } else {
    els.avatarImg.removeAttribute("src");
    els.avatarImg.classList.add("hidden");
    els.avatarInitials.classList.remove("hidden");
  }
}

function renderProfile() {
  const p = profile || fallbackProfile;
  const name = p.displayName || p.username || user?.email?.split("@")[0] || "Reader";
  els.name.textContent = name;
  els.bio.textContent = p.bio || "A quiet corner for stories.";
  renderAvatar(p.photoURL || user?.photoURL || "", name);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function miniHTML(story) {
  const photo = story.authorPhotoURL
    ? `<img class="mini-story-avatar" src="${escapeHTML(story.authorPhotoURL)}" alt="">`
    : `<span class="mini-story-avatar initials">${escapeHTML(getInitials(story.authorName || "You"))}</span>`;

  return `
    <article class="mini-story" data-story-id="${escapeHTML(story.id)}">
      <div class="mini-story-head">
        <span class="story-category">${escapeHTML(story.category || "Story")}</span>
        ${photo}
      </div>
      <h3>${escapeHTML(story.title || "Untitled")}</h3>
      <p>${escapeHTML(story.body || "")}</p>
      <footer>
        <span>${escapeHTML(story.readingTime || "")}</span>
        <span class="mini-story-actions">
          <a class="story-edit-link" href="write.html?edit=${encodeURIComponent(story.id)}">Edit</a>
          <button class="story-delete-btn" type="button" data-delete-story="${escapeHTML(story.id)}">Delete</button>
        </span>
      </footer>
    </article>
  `;
}

function renderStories(stories) {
  if (!stories.length) {
    els.stories.innerHTML = `
      <div class="empty-card-large">
        <h2>Your first story is waiting.</h2>
        <p>Put a small world on the page.</p>
        <a class="button button-primary" href="write.html">Write a story →</a>
      </div>
    `;
    return;
  }
  els.stories.innerHTML = stories.map(miniHTML).join("");
}

async function loadProfile() {
  if (!isConfigured || !user) return;

  const profileSnap = await getDoc(doc(db, "users", user.uid));
  profile = profileSnap.exists() ? profileSnap.data() : {
    username: user.displayName || user.email?.split("@")[0] || "Reader",
    displayName: user.displayName || user.email?.split("@")[0] || "Reader",
    bio: "",
    photoURL: user.photoURL || ""
  };
  renderProfile();

  // Query only this user's stories. No orderBy means no extra composite index.
  const storiesQuery = query(
    collection(db, "stories"),
    where("authorId", "==", user.uid),
    limit(500)
  );
  const storySnap = await getDocs(storiesQuery);
  const stories = storySnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

  const savedSnap = await getDocs(collection(db, "users", user.uid, "savedStories"));
  els.storyCount.textContent = stories.length;
  els.savedCount.textContent = savedSnap.size;
  renderStories(stories);
}

async function syncAuthorSnapshot(changes) {
  const snap = await getDocs(query(
    collection(db, "stories"),
    where("authorId", "==", user.uid),
    limit(500)
  ));
  if (!snap.size) return;

  const batch = writeBatch(db);
  snap.docs.forEach(storyDoc => batch.update(storyDoc.ref, changes));
  await batch.commit();
}

async function uploadProfilePhoto(file) {
  if (!storage) throw new Error("storage-not-configured");
  if (!file.type.startsWith("image/")) throw new Error("not-an-image");
  if (file.size > 5 * 1024 * 1024) throw new Error("too-large");

  const path = `profilePhotos/${user.uid}/avatar-${Date.now()}`;
  const storageRef = ref(storage, path);
  const uploaded = await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(uploaded.ref);

  const oldURL = profile?.photoURL || user.photoURL || "";
  await setDoc(doc(db, "users", user.uid), { photoURL: url }, { merge: true });
  await updateProfile(user, { photoURL: url });

  try {
    await syncAuthorSnapshot({ authorPhotoURL: url });
  } catch (e) {
    console.warn("Could not update old story author photos:", e);
  }

  // Best-effort cleanup of the previous uploaded Firebase Storage object.
  if (oldURL && oldURL.includes("firebasestorage.googleapis.com")) {
    try {
      const oldPath = decodeURIComponent(new URL(oldURL).pathname.split("/o/")[1]).replace(/^\//, "");
      await deleteObject(ref(storage, oldPath));
    } catch (e) {
      console.warn("Old profile photo cleanup skipped:", e);
    }
  }

  profile = { ...profile, photoURL: url };
  renderProfile();
  return url;
}

els.photoInput?.addEventListener("change", () => {
  const file = els.photoInput.files?.[0];
  if (!file) return;
  els.photoName.textContent = file.name;
  const reader = new FileReader();
  reader.onload = () => {
    els.photoPreview.src = reader.result;
    els.photoPreview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

els.stories?.addEventListener("click", async event => {
  const button = event.target.closest("[data-delete-story]");
  if (!button) return;

  const storyId = button.dataset.deleteStory;
  const card = button.closest("[data-story-id]");
  const title = card?.querySelector("h3")?.textContent || "this story";

  if (!confirm(`Delete “${title}”? This cannot be undone.`)) return;
  button.disabled = true;
  button.textContent = "Deleting…";

  try {
    await deleteDoc(doc(db, "stories", storyId));
    card?.remove();
    const count = Math.max(0, Number(els.storyCount.textContent || 0) - 1);
    els.storyCount.textContent = count;
    if (count === 0) renderStories([]);
    toast("Story deleted.", true);
  } catch (error) {
    console.error("DELETE STORY ERROR:", error);
    button.disabled = false;
    button.textContent = "Delete";
    toast("Couldn't delete that story.");
  }
});

document.querySelector("#edit-profile-btn")?.addEventListener("click", () => {
  if (!user) { location.href = "login.html"; return; }
  els.username.value = profile?.username || profile?.displayName || user.displayName || "";
  els.bioInput.value = profile?.bio || "";
  els.photoInput.value = "";
  els.photoPreview.classList.add("hidden");
  els.photoName.textContent = "No new photo selected";
  els.modal.classList.remove("hidden");
});

document.querySelector("[data-close-modal]")?.addEventListener("click", () => els.modal.classList.add("hidden"));
els.modal?.addEventListener("click", event => { if (event.target === els.modal) els.modal.classList.add("hidden"); });

els.form?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!user || !isConfigured) { toast("Sign in to edit your profile."); return; }

  const username = els.username.value.trim();
  const bio = els.bioInput.value.trim();
  const file = els.photoInput.files?.[0] || null;

  if (username.length < 2) { toast("Username is too short."); return; }

  const saveButton = els.form.querySelector("button[type=submit]");
  saveButton.disabled = true;
  saveButton.textContent = "Saving…";

  try {
    let photoURL = profile?.photoURL || user.photoURL || "";
    if (file) {
      try {
        photoURL = await uploadProfilePhoto(file);
      } catch (photoError) {
        console.error("PROFILE PHOTO ERROR:", photoError);
        if (photoError.message === "too-large") throw new Error("Photo must be 5 MB or smaller.");
        if (photoError.message === "not-an-image") throw new Error("Please choose an image file.");
        throw new Error("Photo upload failed. Make sure Firebase Storage is enabled for this project.");
      }
    }

    const oldName = profile?.displayName || profile?.username || user.displayName || "";
    await setDoc(doc(db, "users", user.uid), {
      username,
      displayName: username,
      bio,
      photoURL
    }, { merge: true });

    await updateProfile(user, { displayName: username, photoURL });

    if (oldName !== username) {
      try { await syncAuthorSnapshot({ authorName: username }); }
      catch (e) { console.warn("Could not update old story author names:", e); }
    }

    profile = { ...profile, username, displayName: username, bio, photoURL };
    renderProfile();
    els.modal.classList.add("hidden");
    toast("Profile saved.", true);
    await loadProfile();
  } catch (error) {
    console.error("PROFILE SAVE ERROR:", error);
    toast(error.message || "Couldn't save your profile.");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save profile";
  }
});

document.querySelectorAll("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === "profile"));

if (isConfigured) {
  onAuthStateChanged(auth, async currentUser => {
    user = currentUser;
    updateHeader();
    if (!user) { location.href = "login.html"; return; }
    try {
      await loadProfile();
    } catch (error) {
      console.error("PROFILE LOAD ERROR:", error);
      els.storyCount.textContent = "0";
      els.savedCount.textContent = "0";
      els.stories.innerHTML = `<div class="empty-card-large"><h2>Couldn't load your profile.</h2><p>Check the browser console for the Firebase error.</p></div>`;
    }
  });
} else {
  updateHeader();
  els.storyCount.textContent = "0";
  els.savedCount.textContent = "0";
  els.name.textContent = "Firebase not connected";
  els.bio.textContent = "Connect Firebase to use a real profile.";
  renderAvatar("", "Reader");
  renderStories([]);
}
