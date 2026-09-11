import {
  isConfigured, auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, collection, doc, setDoc
} from "./firebase.js";

const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const googleBtn = document.querySelector("#google-btn");
const errorBox = document.querySelector("#auth-error");

function showError(message){ errorBox.textContent=message; errorBox.classList.remove("hidden"); }
function friendly(error){
  const map = {
    "auth/invalid-credential":"Email or password is incorrect.",
    "auth/wrong-password":"Email or password is incorrect.",
    "auth/user-not-found":"No account exists with that email.",
    "auth/email-already-in-use":"That email is already registered.",
    "auth/weak-password":"Password should be at least 6 characters.",
    "auth/invalid-email":"Please enter a valid email address.",
    "auth/popup-closed-by-user":"The Google sign-in window was closed.",
    "auth/network-request-failed":"Network error. Check your connection and try again."
  };
  return map[error?.code] || error?.message || "Something went wrong. Please try again.";
}
function requireFirebase(){
  if(!isConfigured) { showError("Firebase is not configured yet. Add your project config in js/firebase.js."); return false; }
  return true;
}

loginForm?.addEventListener("submit", async e => {
  e.preventDefault(); errorBox.classList.add("hidden");
  if(!requireFirebase()) return;
  const email = loginForm.email.value.trim(), password=loginForm.password.value;
  if(!email || !password){showError("Enter your email and password.");return}
  const btn=loginForm.querySelector("button[type=submit]"); btn.disabled=true; btn.textContent="Logging in…";
  try { await signInWithEmailAndPassword(auth,email,password); location.href="index.html"; }
  catch(err){showError(friendly(err));btn.disabled=false;btn.innerHTML="Log in <span>→</span>"}
});

registerForm?.addEventListener("submit", async e => {
  e.preventDefault(); errorBox.classList.add("hidden");
  if(!requireFirebase()) return;
  const username=registerForm.username.value.trim(),email=registerForm.email.value.trim(),password=registerForm.password.value;
  if(username.length<2){showError("Choose a username with at least 2 characters.");return}
  const btn=registerForm.querySelector("button[type=submit]");btn.disabled=true;btn.textContent="Creating…";
  try {
    const cred=await createUserWithEmailAndPassword(auth,email,password);
    await setDoc(doc(db,"users",cred.user.uid),{username,displayName:username,email:cred.user.email,bio:"",photoURL:"",createdAt:new Date()});
    location.href="profile.html";
  } catch(err){showError(friendly(err));btn.disabled=false;btn.innerHTML="Create account <span>→</span>"}
});

googleBtn?.addEventListener("click", async () => {
  errorBox?.classList.add("hidden");
  if(!requireFirebase()) return;
  try {
    const result=await signInWithPopup(auth,new GoogleAuthProvider());
    const u=result.user;
    await setDoc(doc(db,"users",u.uid),{username:u.displayName||u.email.split("@")[0],displayName:u.displayName||"",email:u.email,bio:"",photoURL:u.photoURL||"",createdAt:new Date()},{merge:true});
    location.href="index.html";
  } catch(err){showError(friendly(err))}
});