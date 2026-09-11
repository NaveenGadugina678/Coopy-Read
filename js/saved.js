import { isConfigured, auth, db, onAuthStateChanged, collection, getDocs, doc, deleteDoc } from "./firebase.js";
import { DEMO_STORIES } from "./stories.js";

let user=null;
const root=document.querySelector("#saved-list");
function toast(msg){const r=document.querySelector("#toast-root"),n=document.createElement("div");n.className="toast";n.textContent=msg;r.appendChild(n);setTimeout(()=>n.remove(),2200)}
function escapeHTML(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function card(s){
 return `<article class="mini-story saved-item"><button class="remove-save" data-remove="${s.id}" aria-label="Remove ${escapeHTML(s.title)} from saved">×</button><span class="story-category">${escapeHTML(s.category)}</span><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.body)}</p><footer><span>${escapeHTML(s.authorName)}</span><span>${escapeHTML(s.readingTime)}</span></footer></article>`;
}
async function load(){
 let stories=[];
 if(isConfigured&&user){
   try{const snap=await getDocs(collection(db,"users",user.uid,"savedStories"));stories=snap.docs.map(d=>({id:d.id,...d.data(),body:d.data().body||"Saved story."}));}
   catch(e){console.warn(e)}
 } else {
   const ids=new Set(JSON.parse(localStorage.getItem("coopyDemoSaved")||"[]"));
   stories=DEMO_STORIES.filter(s=>ids.has(s.id));
 }
 if(!stories.length){
   root.innerHTML=`<div class="empty-card-large"><p class="eyebrow">QUIET SHELF</p><h2>No saved stories yet.</h2><p>Find a story worth keeping.</p><a class="button button-primary" href="index.html">Discover stories →</a></div>`;
   return;
 }
 root.innerHTML=stories.map(card).join("");
 root.querySelectorAll("[data-remove]").forEach(btn=>btn.addEventListener("click",async()=>{
   const id=btn.dataset.remove;
   if(isConfigured&&user){try{await deleteDoc(doc(db,"users",user.uid,"savedStories",id));}catch(e){toast("Couldn't remove that story.");return}}
   else {const ids=new Set(JSON.parse(localStorage.getItem("coopyDemoSaved")||"[]"));ids.delete(id);localStorage.setItem("coopyDemoSaved",JSON.stringify([...ids]));}
   toast("Removed from your shelf.");load();
 }));
}
function header(){
 const chip=document.querySelector("#auth-chip"),action=document.querySelector("#auth-action");
 if(user){chip.textContent=user.displayName||user.email.split("@")[0];action.textContent="Log out";action.onclick=async()=>{const {signOut}=await import("./firebase.js");await signOut(auth);location.reload()}}
 else{chip.textContent="Demo mode";action.textContent="Log in";action.onclick=()=>location.href="login.html"}
}
document.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav==="saved"));
if(isConfigured) onAuthStateChanged(auth,async u=>{user=u;header();await load()});else{header();load()}