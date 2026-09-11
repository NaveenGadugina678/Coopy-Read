import { isConfigured, auth, db, onAuthStateChanged, collection, addDoc } from "./firebase.js";
import { readingTimeFromWords } from "./stories.js";

let user=null;
const title=document.querySelector("#story-title"),category=document.querySelector("#story-category"),body=document.querySelector("#story-body");
const wordCount=document.querySelector("#word-count"),time=document.querySelector("#reading-time"),chars=document.querySelector("#char-count");

function toast(msg,coral=false){const r=document.querySelector("#toast-root"),n=document.createElement("div");n.className=`toast${coral?" coral":""}`;n.textContent=msg;r.appendChild(n);setTimeout(()=>n.remove(),2300)}
function updateStats(){
  const text=body.value.trim(), words=text?text.split(/\s+/).length:0;
  wordCount.textContent=`${words} words`;time.textContent=readingTimeFromWords(text);chars.textContent=`${body.value.length} / 12000`;
}
function draft(){localStorage.setItem("coopyDraft",JSON.stringify({title:title.value,category:category.value,body:body.value}));toast("Draft tucked away.")}
function loadDraft(){try{const d=JSON.parse(localStorage.getItem("coopyDraft"));if(d){title.value=d.title||"";category.value=d.category||"";body.value=d.body||"";updateStats()}}catch{}}
[title,category,body].forEach(el=>el.addEventListener("input",updateStats));
document.querySelector("#draft-btn").addEventListener("click",draft);
document.querySelector("#story-form").addEventListener("submit",async e=>{
  e.preventDefault();
  const t=title.value.trim(),c=category.value,b=body.value.trim();
  if(!t||!c||!b){toast("Give your story a title, category, and body.");return}
  if(b.split(/\s+/).length<5){toast("Your story needs a little more than that.");return}
  if(!isConfigured||!user){toast("Sign in to publish your story.");setTimeout(()=>location.href="login.html",700);return}
  const btn=document.querySelector("#publish-btn");btn.disabled=true;btn.textContent="Publishing…";
  try{
    const words=b.split(/\s+/).length;
    await addDoc(collection(db,"stories"),{
      title:t,body:b,category:c,readingTime:readingTimeFromWords(b),
      authorId:user.uid,authorName:user.displayName||user.email.split("@")[0],
      authorPhotoURL:user.photoURL||"",createdAt:new Date(),published:true,likes:0,saveCount:0
    });
    localStorage.removeItem("coopyDraft");toast("Published. Your story is out there.",true);
    setTimeout(()=>location.href="index.html",700);
  }catch(err){console.error(err);toast("Couldn't publish. Check Firebase and try again.");btn.disabled=false;btn.innerHTML='Publish story <span>→</span>'}
});
loadDraft();
if(isConfigured) onAuthStateChanged(auth,u=>{user=u});