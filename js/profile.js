import {
  isConfigured, auth, db, onAuthStateChanged, collection, getDocs, query, where,
  orderBy, limit, doc, getDoc, setDoc
} from "./firebase.js";
import { DEMO_STORIES, getInitials } from "./stories.js";

let user=null, profile=null;
const demoUser={username:"Maya Chen",displayName:"Maya Chen",bio:"Writing tiny stories about ordinary lives."};

function toast(msg){const r=document.querySelector("#toast-root"),n=document.createElement("div");n.className="toast";n.textContent=msg;r.appendChild(n);setTimeout(()=>n.remove(),2200)}
function updateHeader(){
  const chip=document.querySelector("#auth-chip"),action=document.querySelector("#auth-action");
  if(user){chip.textContent=user.displayName||user.email.split("@")[0];action.textContent="Log out";action.onclick=async()=>{const {signOut}=await import("./firebase.js");await signOut(auth);location.href="index.html"}}
  else{chip.textContent="Demo mode";action.textContent="Log in";action.onclick=()=>location.href="login.html"}
}
function renderProfile(){
  const p=profile||demoUser;
  document.querySelector("#profile-name").textContent=p.displayName||p.username||"Reader";
  document.querySelector("#profile-bio").textContent=p.bio||"A quiet corner for stories.";
  document.querySelector(".profile-avatar").textContent=getInitials(p.displayName||p.username);
}
function miniHTML(s){
  return `<article class="mini-story"><span class="story-category">${s.category}</span><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.body)}</p><footer><span>${escapeHTML(s.authorName)}</span><span>${s.readingTime}</span></footer></article>`;
}
function escapeHTML(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
async function load(){
  if(isConfigured && user){
    try{
      const p=await getDoc(doc(db,"users",user.uid)); profile=p.exists()?p.data():null;
      const q=query(collection(db,"stories"),where("authorId","==",user.uid),orderBy("createdAt","desc"),limit(30));
      const snap=await getDocs(q); const stories=snap.docs.map(d=>({id:d.id,...d.data()}));
      document.querySelector("#story-count").textContent=stories.length;
      const saved=await getDocs(collection(db,"users",user.uid,"savedStories"));
      document.querySelector("#saved-count").textContent=saved.size;
      document.querySelector("#my-stories").innerHTML=stories.length?stories.map(miniHTML).join(""):`<div class="empty-card-large"><h2>Your first story is waiting.</h2><p>Put a small world on the page.</p><a class="button button-primary" href="write.html">Write a story →</a></div>`;
    }catch(e){console.warn(e); renderDemo()}
  } else renderDemo();
}
function renderDemo(){
  renderProfile();
  document.querySelector("#story-count").textContent="12";
  document.querySelector("#saved-count").textContent="48";
  document.querySelector("#my-stories").innerHTML=DEMO_STORIES.slice(0,3).map(miniHTML).join("");
}
document.querySelector("#edit-profile-btn")?.addEventListener("click",()=>{
  const p=profile||demoUser;
  document.querySelector("#edit-username").value=p.username||p.displayName||"";
  document.querySelector("#edit-bio").value=p.bio||"";
  document.querySelector("#edit-modal").classList.remove("hidden");
});
document.querySelector("[data-close-modal]")?.addEventListener("click",()=>document.querySelector("#edit-modal").classList.add("hidden"));
document.querySelector("#profile-form")?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!user||!isConfigured){toast("Sign in to edit your profile.");return}
  const username=document.querySelector("#edit-username").value.trim(),bio=document.querySelector("#edit-bio").value.trim();
  if(username.length<2){toast("Username is too short.");return}
  try{await setDoc(doc(db,"users",user.uid),{username,displayName:username,bio},{merge:true});profile={...profile,username,displayName:username,bio};renderProfile();document.querySelector("#edit-modal").classList.add("hidden");toast("Profile saved.");}
  catch(e){toast("Couldn't save your profile.")}
});
document.querySelector("#edit-modal")?.addEventListener("click",e=>{if(e.target.id==="edit-modal")e.target.classList.add("hidden")});
document.querySelectorAll("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav==="profile"));
if(isConfigured) onAuthStateChanged(auth,async u=>{user=u;updateHeader();await load()}); else {updateHeader();load()}