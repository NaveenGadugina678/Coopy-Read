import {
  isConfigured, auth, db, onAuthStateChanged, signOut,
  collection, getDocs, query, where, orderBy, limit, doc, getDoc, setDoc, deleteDoc
} from "./firebase.js";
import { DEMO_STORIES, getInitials, readingTimeFromWords, shuffle } from "./stories.js";
import { attachSwipe } from "./swipe.js";

const state = {
  user: null,
  stories: [],
  queue: [],
  index: 0,
  sessionSeen: new Set(JSON.parse(sessionStorage.getItem("coopySeen") || "[]")),
  savedIds: new Set(JSON.parse(localStorage.getItem("coopyDemoSaved") || "[]"))
};

const els = {
  stack: document.querySelector("#story-stack"),
  status: document.querySelector("#story-status"),
  skip: document.querySelector("#skip-btn"),
  next: document.querySelector("#continue-btn"),
  save: document.querySelector("#save-btn"),
  authAction: document.querySelector("#auth-action"),
  authChip: document.querySelector("#auth-chip"),
  modal: document.querySelector("#auth-modal")
};

function toast(message, coral=false){
  const root = document.querySelector("#toast-root");
  if (!root) return;
  const node = document.createElement("div");
  node.className = `toast${coral ? " coral" : ""}`;
  node.textContent = message;
  root.appendChild(node);
  setTimeout(() => node.remove(), 2300);
}

function setNav(){
  document.querySelectorAll("[data-nav]").forEach(a => {
    a.classList.toggle("active", a.dataset.nav === document.body.dataset.page);
  });
}

function updateAuthUI(){
  if (!els.authAction) return;
  if (state.user) {
    els.authChip.textContent = state.user.displayName || state.user.email?.split("@")[0] || "Signed in";
    els.authAction.textContent = "Log out";
    els.authAction.onclick = async () => {
      await signOut(auth);
      toast("Logged out.");
      setTimeout(() => location.reload(), 350);
    };
  } else {
    els.authChip.textContent = isConfigured ? "Not signed in" : "Demo mode";
    els.authAction.textContent = "Log in";
    els.authAction.onclick = () => els.modal?.classList.remove("hidden");
  }
}

async function loadStories(){
  if (!isConfigured) {
    state.stories = shuffle([...DEMO_STORIES]);
  } else {
    try {
      const q = query(
        collection(db, "stories"),
        where("published", "==", true),
        orderBy("createdAt", "desc"),
        limit(40)
      );
      const snap = await getDocs(q);
      state.stories = shuffle(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      if (!state.stories.length) {
        toast("No published stories yet. Be the first to write one.");
      }
    } catch (error) {
      console.error("FIRESTORE STORY LOAD ERROR:", error);
      state.stories = [];
      toast("Couldn't load published stories. Check Firebase and try again.");
    }
  }

  const unseen = state.stories.filter(s => !state.sessionSeen.has(s.id));
  state.queue = unseen.length ? unseen : state.stories;
}

async function loadSaved(){
  if (!state.user || !isConfigured) return;
  try {
    const snap = await getDocs(collection(db, "users", state.user.uid, "savedStories"));
    state.savedIds = new Set(snap.docs.map(d => d.id));
  } catch(e) { console.warn(e); }
}

function current(){ return state.queue[state.index]; }

function cardHTML(story, position=0){
  const saved = state.savedIds.has(story.id);
  const body = String(story.body || "").trim();
  const paras = body.split(/\n{2,}/).map(p => `<p>${escapeHTML(p).replace(/\n/g,"<br>")}</p>`).join("");
  return `<article class="story-card ${position===0?"is-top":position===1?"is-next":"is-third"}" data-story-id="${story.id}" aria-label="${escapeHTML(story.title)}">
    <div class="story-topline">
      <span class="story-category">${escapeHTML(story.category || "Fiction")}</span>
      <span class="story-number">STORY ${state.index+1} / ${state.queue.length}</span>
    </div>
    <h2 class="story-title">${escapeHTML(story.title)}</h2>
    <div class="story-meta">
      <span class="avatar">${story.authorPhotoURL ? `<img src="${escapeHTML(story.authorPhotoURL)}" alt="">` : getInitials(story.authorName)}</span>
      <span>by <strong>${escapeHTML(story.authorName || "Anonymous")}</strong></span><span>·</span>
      <span>${escapeHTML(story.readingTime || readingTimeFromWords(story.body))}</span>
    </div>
    <div class="story-body">${paras}</div>
    <footer class="story-footer">
      <div class="author-line"><span>Written by <span class="author-name">${escapeHTML(story.authorName || "Anonymous")}</span></span></div>
      <button class="save-inline" type="button" data-inline-save>${saved ? "♥ Saved" : "♡ Save"}</button>
    </footer>
  </article>`;
}

function renderStack(){
  if (!state.queue.length) {
    els.stack.innerHTML = `<div class="empty-card"><p class="eyebrow">THAT'S EVERYTHING</p><h2>No more stories for now.</h2><p>You've seen the whole little stack. Come back for something new.</p><a class="button button-primary" href="write.html">Write the next one →</a></div>`;
    els.status.textContent = "You made it to the end.";
    return;
  }
  const items = state.queue.slice(state.index, state.index+3);
  els.stack.innerHTML = items.map((s,i)=>cardHTML(s,i)).join("");
  updateSaveButton();
  bindTopCard();
}

function bindTopCard(){
  const top = els.stack.querySelector(".is-top");
  if (!top) return;
  top.querySelector("[data-inline-save]")?.addEventListener("click", e => {
    e.stopPropagation(); toggleSave(current());
  });
  attachSwipe(top, {
    onCommit: direction => finishSwipe(direction),
    onCancel: () => {}
  });
}

function updateSaveButton(){
  const saved = current() && state.savedIds.has(current().id);
  els.save.classList.toggle("saved", !!saved);
  els.save.querySelector(".save-icon").textContent = saved ? "♥" : "♡";
  els.save.querySelector(".save-label").textContent = saved ? "Saved" : "Save";
}

async function toggleSave(story=current()){
  if (!story) return;
  const already = state.savedIds.has(story.id);
  if (already) {
    state.savedIds.delete(story.id);
    toast("Removed from your shelf.");
  } else {
    state.savedIds.add(story.id);
    toast("♥ Saved", true);
  }
  localStorage.setItem("coopyDemoSaved", JSON.stringify([...state.savedIds]));
  updateSaveButton();

  if (state.user && isConfigured && !String(story.id).startsWith("demo-")) {
    const ref = doc(db, "users", state.user.uid, "savedStories", story.id);
    try {
      if (already) await deleteDoc(ref);
      else await setDoc(ref, {
        storyId: story.id, title: story.title, authorName: story.authorName,
        category: story.category, readingTime: story.readingTime, savedAt: new Date()
      });
    } catch(e) {
      console.warn(e);
      toast("Couldn't sync the save to Firebase.");
    }
  }
}

function finishSwipe(direction){
  const story = current();
  if (!story) return;
  state.sessionSeen.add(story.id);
  sessionStorage.setItem("coopySeen", JSON.stringify([...state.sessionSeen]));
  const top = els.stack.querySelector(".is-top");
  if (top) top.classList.add(direction === "left" ? "swipe-left" : "swipe-right");
  els.status.textContent = direction === "left" ? "Maybe next one…" : "Here's something new.";
  setTimeout(() => {
    state.index++;
    renderStack();
  }, 280);
}

els.skip?.addEventListener("click", () => finishSwipe("left"));
els.next?.addEventListener("click", () => finishSwipe("right"));
els.save?.addEventListener("click", () => toggleSave());
document.querySelectorAll("[data-close-modal]").forEach(b => b.addEventListener("click", () => els.modal?.classList.add("hidden")));
els.modal?.addEventListener("click", e => { if (e.target === els.modal) els.modal.classList.add("hidden"); });

function escapeHTML(value=""){
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[ch]));
}

setNav();
if (isConfigured) onAuthStateChanged(auth, async user => {
  state.user = user;
  updateAuthUI();
  await loadSaved();
});
else updateAuthUI();

(async () => {
  await loadStories();
  if (!state.queue.length) state.queue = state.stories;
  renderStack();
})();