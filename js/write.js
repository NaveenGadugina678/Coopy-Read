import {
  isConfigured, auth, db, onAuthStateChanged, collection, addDoc,
  doc, getDoc, updateDoc, serverTimestamp
} from "./firebase.js";
import { readingTimeFromWords } from "./stories.js";

let user = null;
let editingId = new URLSearchParams(location.search).get("edit");

const title = document.querySelector("#story-title");
const category = document.querySelector("#story-category");
const body = document.querySelector("#story-body");
const wordCount = document.querySelector("#word-count");
const time = document.querySelector("#reading-time");
const chars = document.querySelector("#char-count");
const publishButton = document.querySelector("#publish-btn");
const draftButton = document.querySelector("#draft-btn");
const heading = document.querySelector("#write-title");
const eyebrow = document.querySelector("#write-eyebrow");

function toast(msg, coral = false) {
  const root = document.querySelector("#toast-root");
  const node = document.createElement("div");
  node.className = `toast${coral ? " coral" : ""}`;
  node.textContent = msg;
  root.appendChild(node);
  setTimeout(() => node.remove(), 2500);
}

function updateStats() {
  const text = body.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  wordCount.textContent = `${words} words`;
  time.textContent = readingTimeFromWords(text);
  chars.textContent = `${body.value.length} / 12000`;
}

function draft() {
  localStorage.setItem("coopyDraft", JSON.stringify({
    title: title.value, category: category.value, body: body.value
  }));
  toast("Draft tucked away.");
}

function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem("coopyDraft"));
    if (d) {
      title.value = d.title || "";
      category.value = d.category || "";
      body.value = d.body || "";
      updateStats();
    }
  } catch {}
}

async function loadStoryForEditing() {
  if (!editingId) return;
  if (!isConfigured || !user) return;

  eyebrow.textContent = "EDIT YOUR STORY";
  heading.innerHTML = "Make it <em>better.</em>";
  publishButton.innerHTML = 'Save changes <span>✓</span>';
  draftButton.classList.add("hidden");

  const snap = await getDoc(doc(db, "stories", editingId));
  if (!snap.exists()) {
    toast("That story no longer exists.");
    setTimeout(() => location.href = "profile.html", 700);
    return;
  }

  const story = snap.data();
  if (story.authorId !== user.uid) {
    toast("You can only edit your own stories.");
    setTimeout(() => location.href = "profile.html", 700);
    return;
  }

  title.value = story.title || "";
  category.value = story.category || "";
  body.value = story.body || "";
  updateStats();
}

[title, category, body].forEach(el => el.addEventListener("input", updateStats));
draftButton.addEventListener("click", draft);

document.querySelector("#story-form").addEventListener("submit", async event => {
  event.preventDefault();

  const t = title.value.trim();
  const c = category.value;
  const b = body.value.trim();

  if (!t || !c || !b) { toast("Give your story a title, category, and body."); return; }
  if (b.split(/\s+/).length < 5) { toast("Your story needs a little more than that."); return; }
  if (!isConfigured || !user) {
    toast("Sign in to publish your story.");
    setTimeout(() => location.href = "login.html", 700);
    return;
  }

  publishButton.disabled = true;
  publishButton.textContent = editingId ? "Saving…" : "Publishing…";

  try {
    if (editingId) {
      const existing = await getDoc(doc(db, "stories", editingId));
      if (!existing.exists() || existing.data().authorId !== user.uid) {
        throw new Error("You can only edit your own story.");
      }

      await updateDoc(doc(db, "stories", editingId), {
        title: t,
        body: b,
        category: c,
        readingTime: readingTimeFromWords(b),
        authorName: user.displayName || user.email.split("@")[0],
        authorPhotoURL: user.photoURL || "",
        updatedAt: serverTimestamp()
      });

      toast("Story updated.", true);
      setTimeout(() => location.href = "profile.html", 650);
    } else {
      await addDoc(collection(db, "stories"), {
        title: t,
        body: b,
        category: c,
        readingTime: readingTimeFromWords(b),
        authorId: user.uid,
        authorName: user.displayName || user.email.split("@")[0],
        authorPhotoURL: user.photoURL || "",
        createdAt: new Date(),
        published: true,
        likes: 0,
        saveCount: 0
      });

      localStorage.removeItem("coopyDraft");
      toast("Published. Your story is out there.", true);
      setTimeout(() => location.href = "index.html", 700);
    }
  } catch (error) {
    console.error("STORY SAVE ERROR:", error);
    toast(error.message || "Couldn't save the story.");
    publishButton.disabled = false;
    publishButton.innerHTML = editingId ? 'Save changes <span>✓</span>' : 'Publish story <span>→</span>';
  }
});

if (isConfigured) {
  onAuthStateChanged(auth, async currentUser => {
    user = currentUser;
    if (!user) { location.href = "login.html"; return; }
    try {
      if (editingId) await loadStoryForEditing();
      else loadDraft();
    } catch (error) {
      console.error("EDIT LOAD ERROR:", error);
      toast("Couldn't load that story.");
    }
  });
} else {
  toast("Connect Firebase before writing.");
}
