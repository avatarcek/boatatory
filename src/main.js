import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = document.querySelector("#app");

const style = `
*{box-sizing:border-box}
body{
  margin:0;
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:#07111f;
  color:#eaf2ff;
}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
a{color:inherit}
.container{max-width:1100px;margin:auto;padding:24px}
.topbar{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:16px;
  padding:18px 24px;
  border-bottom:1px solid #1d3047;
  background:#081523;
  position:sticky;
  top:0;
  z-index:10;
}
.logo{font-size:24px;font-weight:800;letter-spacing:-.5px}
.logo span{color:#46b8ff}
.card{
  background:#0d1b2c;
  border:1px solid #20364f;
  border-radius:18px;
  padding:22px;
  margin-bottom:18px;
}
.grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px;
}
.grid3{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:14px;
}
label{
  display:block;
  font-size:13px;
  color:#91a8c2;
  margin-bottom:6px;
}
input,select,textarea{
  width:100%;
  background:#081523;
  border:1px solid #29435e;
  color:#fff;
  border-radius:10px;
  padding:12px;
  outline:none;
}
input:focus,select:focus,textarea:focus{border-color:#46b8ff}
textarea{min-height:100px;resize:vertical}
.btn{
  border:0;
  border-radius:10px;
  padding:11px 16px;
  font-weight:700;
  background:#1597e5;
  color:white;
}
.btn:hover{filter:brightness(1.1)}
.btn.secondary{
  background:#162a40;
  border:1px solid #29435e;
}
.btn.danger{background:#b83a3a}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
h1{font-size:34px;margin:0 0 8px}
h2{margin-top:0}
.muted{color:#91a8c2}
.small{font-size:13px}
.hero{
  padding:55px 24px;
  text-align:center;
  max-width:850px;
  margin:auto;
}
.hero h1{font-size:48px}
.badge{
  display:inline-block;
  padding:5px 9px;
  border-radius:99px;
  background:#102e43;
  color:#64c8ff;
  font-size:12px;
  font-weight:700;
}
.stat{
  padding:18px;
  border:1px solid #20364f;
  border-radius:14px;
  background:#0a1726;
}
.stat strong{font-size:25px;display:block;margin-top:5px}
.record{
  border:1px solid #20364f;
  border-radius:14px;
  padding:16px;
  margin-top:12px;
  background:#0a1726;
}
.record-head{
  display:flex;
  justify-content:space-between;
  gap:10px;
}
.error{
  background:#3a1717;
  border:1px solid #7d3434;
  color:#ffb0b0;
  padding:12px;
  border-radius:10px;
  margin:12px 0;
}
.success{
  background:#123421;
  border:1px solid #285f3c;
  color:#a7efbd;
  padding:12px;
  border-radius:10px;
  margin:12px 0;
}
.empty{
  text-align:center;
  padding:35px 15px;
  color:#91a8c2;
}
.qr{
  background:white;
  padding:12px;
  border-radius:12px;
  width:190px;
  height:190px;
}
hr{border:0;border-top:1px solid #20364f;margin:24px 0}
@media(max-width:700px){
  .grid,.grid3{grid-template-columns:1fr}
  .hero h1{font-size:36px}
  .topbar{padding:15px}
  .container{padding:15px}
}
`;

document.head.insertAdjacentHTML("beforeend", `<style>${style}</style>`);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("sl-SI");
}

function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString("sl-SI")} €`;
}

function showError(message) {
  const el = document.querySelector("#message");
  if (el) el.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
}

function showSuccess(message) {
  const el = document.querySelector("#message");
  if (el) el.innerHTML = `<div class="success">${escapeHtml(message)}</div>`;
}

async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}
async function trackEvent(eventName, metadata = {}) {
  const user = await getUser();
  if (!user) return;

  await supabase.from("user_events").insert({
    user_id: user.id,
    event_name: eventName,
    metadata
  });
}
async function ensureProfile(user) {
  if (!user) return;

  const { data } = await supabase
    .from("profiles")
    .select("id,full_name,role")
    .eq("id",user.id)
    .maybeSingle();

  if (!data) {
    await supabase.from("profiles").insert({
      id:user.id,
      full_name:user.user_metadata?.full_name || ""
    });
  }
} async function onboardingScreen(user){
  const {data:profile,error}=await supabase
    .from("profiles")
    .select("onboarding_reason")
    .eq("id",user.id)
    .single();

  if(error || profile?.onboarding_reason){
    return false;
  }

  app.innerHTML=`
    <main class="container">
      <div class="card" style="max-width:650px;margin:60px auto">
        <div class="badge">WELCOME TO BOATATORY</div>

        <h1>What brings you to Boatatory?</h1>

        <p class="muted">
          This helps us understand what you want to use Boatatory for.
        </p>

        <form id="onboarding-form" style="margin-top:28px">

          <label style="display:block;margin:14px 0">
            <input type="radio" name="reason" value="boat_history" required>
            Keep a history of my boat
          </label>

          <label style="display:block;margin:14px 0">
            <input type="radio" name="reason" value="maintenance">
            Track maintenance and service
          </label>

          <label style="display:block;margin:14px 0">
            <input type="radio" name="reason" value="sell_boat">
            Prepare my boat for sale
          </label>

          <label style="display:block;margin:14px 0">
            <input type="radio" name="reason" value="prove_history">
            Prove my boat's history
          </label>

          <label style="display:block;margin:14px 0">
            <input type="radio" name="reason" value="exploring">
            I'm just exploring
          </label>

          <label style="display:block;margin:14px 0">
            <input type="radio" name="reason" value="other">
            Other
          </label>

          <button class="btn" type="submit" style="margin-top:20px">
            Continue
          </button>

        </form>

        <div id="onboarding-message" style="margin-top:18px"></div>
      </div>
    </main>
  `;

  document.querySelector("#onboarding-form").onsubmit=async(e)=>{
    e.preventDefault();

    const reason=document.querySelector(
      'input[name="reason"]:checked'
    )?.value;

    if(!reason){
      return;
    }

    const {error:updateError}=await supabase
      .from("profiles")
      .update({
        onboarding_reason:reason
      })
      .eq("id",user.id);

    if(updateError){
      showError(updateError.message);
      return;
    }

    await trackEvent("onboarding_reason_selected",{
      reason
    });

    await router();
  };

  return true;
}
async function interviewScreen(user){
  app.innerHTML=`
    <main class="container">
      <div class="card" style="max-width:650px;margin:60px auto">

        <div class="badge">BOATATORY INTERVIEW</div>

        <h1>Help us improve Boatatory</h1>

        <button class="btn secondary" id="interview-back" type="button" style="margin:16px 0">
          ← Back to dashboard
        </button>

        <p class="muted">
          Your answers help us understand what boat owners actually need.
        </p>

        <form id="interview-form" style="margin-top:28px">

          <label>
            What were you trying to do?
            <textarea id="interview-trying" required
              placeholder="For example: I wanted to keep track of my boat maintenance..."
              style="width:100%;min-height:90px;margin-top:8px"></textarea>
          </label>

          <label style="display:block;margin-top:20px">
            What did you like?
            <textarea id="interview-liked"
              placeholder="What felt useful or easy?"
              style="width:100%;min-height:90px;margin-top:8px"></textarea>
          </label>

          <label style="display:block;margin-top:20px">
            What was confusing or difficult?
            <textarea id="interview-confusing"
              placeholder="Was anything unclear or difficult to use?"
              style="width:100%;min-height:90px;margin-top:8px"></textarea>
          </label>

          <label style="display:block;margin-top:20px">
            What would you improve?
            <textarea id="interview-improve"
              placeholder="What would make Boatatory better for you?"
              style="width:100%;min-height:90px;margin-top:8px"></textarea>
          </label>

          <label style="display:block;margin-top:20px">
            Would you use Boatatory for your own boat?
            <select id="interview-use" required
              style="width:100%;margin-top:8px">
              <option value="">Select one</option>
              <option value="yes">Yes</option>
              <option value="maybe">Maybe</option>
              <option value="no">No</option>
            </select>
          </label>

          <div id="interview-message" style="margin-top:16px"></div>

          <button class="btn" type="submit" style="margin-top:20px">
            Send interview
          </button>

        </form>
      </div>
    </main>
  `;

  document.querySelector("#interview-back").onclick=()=>{
    dashboard(user);
  };

  document.querySelector("#interview-form").onsubmit=async(e)=>{
    e.preventDefault();

    const {error}=await supabase
      .from("interview_feedback")
      .insert({
        user_id:user.id,
        what_trying_to_do:document.querySelector("#interview-trying").value,
        what_liked:document.querySelector("#interview-liked").value,
        what_confusing:document.querySelector("#interview-confusing").value,
        what_improve:document.querySelector("#interview-improve").value,
        would_use:document.querySelector("#interview-use").value
      });

    if(error){
      showError(error.message);
      return;
    }

    await trackEvent("interview_feedback_submitted");

    document.querySelector("#interview-message").innerHTML=
      `<p class="success">Thank you! Your feedback has been submitted.</p>`;

    document.querySelector("#interview-form").reset();
  };
}

async function feedbackScreen(user){ 

  app.innerHTML=`
    <main class="container">
      <div class="card" style="max-width:650px;margin:60px auto">

        <div class="badge">BOATATORY FEEDBACK</div>

        <h1>Tell us what you think</h1>
<button class="btn secondary" id="feedback-back" type="button" style="margin:16px 0">
  ← Back to dashboard
</button>
        <p class="muted">
          Your feedback helps us improve Boatatory.
        </p>

        <form id="feedback-form" style="margin-top:28px">

          <textarea
            id="feedback-message"
            required
            placeholder="What do you like? What should we improve?"
            style="width:100%;min-height:160px;padding:14px;border-radius:10px;resize:vertical"
          ></textarea>

          <button
            class="btn"
            type="submit"
            style="margin-top:16px"
          >
            Send feedback
          </button>

        </form>

        <div id="feedback-message-status" style="margin-top:18px"></div>

      </div>
    </main>
  `;
document.querySelector("#feedback-back").onclick=async()=>{
  await dashboard(user);
};
  document.querySelector("#feedback-form").onsubmit=async(e)=>{
    e.preventDefault();

    const message=document
      .querySelector("#feedback-message")
      .value
      .trim();

    if(!message){
      return;
    }

    const {error}=await supabase
      .from("feedback")
      .insert({
        user_id:user.id,
        message:message
      });

    if(error){
      showError(error.message);
      return;
    }

    await trackEvent("feedback_submitted");

    document.querySelector("#feedback-form").style.display="none";

    document.querySelector("#feedback-message-status").innerHTML=`
      <strong>✓ Thank you!</strong>
      <br><br>
      Your feedback has been received.
    `;
  };
}
function authScreen() {
  app.innerHTML = `
    <div class="hero">
      <div class="badge">BOATATORY · PHASE 1</div>
      <h1>Know your boat.<br><span style="color:#46b8ff">Keep its history.</span></h1>
      <p class="muted">
        A permanent digital identity and service history for your vessel.
      </p>

      <div class="card" style="text-align:left;max-width:460px;margin:30px auto">
        <div id="message"></div>

        <div id="login-form">
          <h2>Sign in</h2>

          <div style="margin-bottom:12px">
            <label>Email</label>
            <input id="email" type="email" placeholder="you@example.com">
          </div>

          <div style="margin-bottom:12px">
            <label>Password</label>
            <input id="password" type="password" placeholder="••••••••">
          </div>

          <div class="actions">
            <button class="btn" id="login">Sign in</button>
            <button class="btn secondary" id="show-register">Create account</button>
          </div>
        </div>

        <div id="register-form" style="display:none">
          <h2>Create account</h2>

          <div style="margin-bottom:12px">
            <label>Name</label>
            <input id="name" type="text" placeholder="Your name">
          </div>

          <div style="margin-bottom:12px">
            <label>Email</label>
            <input id="reg-email" type="email" placeholder="you@example.com">
          </div>

          <div style="margin-bottom:12px">
            <label>Password</label>
            <input id="reg-password" type="password" placeholder="Minimum 6 characters">
          </div>

          <div class="actions">
            <button class="btn" id="register">Create account</button>
            <button class="btn secondary" id="show-login">Back</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.querySelector("#show-register").onclick = () => {
    document.querySelector("#login-form").style.display="none";
    document.querySelector("#register-form").style.display="block";
  };

  document.querySelector("#show-login").onclick = () => {
    document.querySelector("#register-form").style.display="none";
    document.querySelector("#login-form").style.display="block";
  };

  document.querySelector("#login").onclick = async () => {
    const email=document.querySelector("#email").value.trim();
    const password=document.querySelector("#password").value;

    if(!email || !password){
      showError("Vpiši email in geslo.");
      return;
    }

    const {error}=await supabase.auth.signInWithPassword({
      email,password
    });

    if(error){
      showError(error.message);
      return;
    }
await trackEvent("login");
    await router();
  };

  document.querySelector("#register").onclick = async () => {
    const name=document.querySelector("#name").value.trim();
    const email=document.querySelector("#reg-email").value.trim();
    const password=document.querySelector("#reg-password").value;

    if(!email || !password){
      showError("Email in geslo sta obvezna.");
      return;
    }

    if(password.length < 6){
      showError("Geslo mora imeti vsaj 6 znakov.");
      return;
    }

    const {data,error}=await supabase.auth.signUp({
      email,
      password,
      options:{
        data:{full_name:name}
      }
    });

    if(error){
      showError(error.message);
      return;
    }

    if(data.session){
      await router();
    }else{
      showSuccess("Račun ustvarjen. Preveri email, če Supabase zahteva potrditev.");
    }
  };
}

async function dashboard(user) {
    await trackEvent("dashboard_view");
  const {data:vessels,error}=await supabase
    .from("vessels")
    .select("*")
    .eq("owner_id",user.id)
    .order("created_at",{ascending:false});

  if(error){
    app.innerHTML=`<div class="container"><div class="error">${escapeHtml(error.message)}</div></div>`;
    return;
  }

  app.innerHTML=`
    <header class="topbar">
  <div class="logo">Boat<span>atory</span></div>
  <div>
    <button class="btn secondary" id="feedback-btn">Feedback</button>
    <button class="btn secondary" id="interview-btn">Interview</button>
    <button class="btn secondary" id="logout">Sign out</button>
  </div>
</header>

    <main class="container">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap;margin-bottom:20px">
        <div>
          <div class="badge">OWNER DASHBOARD</div>
          <h1 style="margin-top:8px">Your vessels</h1>
          <div class="muted">${escapeHtml(user.email || "")}</div>
        </div>
        <button class="btn" id="new-vessel">+ Add vessel</button>
      </div>

      <div id="message"></div>

      ${
        vessels?.length
        ? vessels.map(v=>`
          <div class="card">
            <div style="display:flex;justify-content:space-between;gap:15px;align-items:flex-start">
              <div>
                <span class="badge">${escapeHtml(v.public_id)}</span>
                <h2 style="margin:10px 0 4px">${escapeHtml(v.name)}</h2>
                <div class="muted">
                  ${escapeHtml([v.make,v.model].filter(Boolean).join(" ") || "Vessel")}
                  ${v.year ? ` · ${v.year}` : ""}
                </div>
              </div>
              <div class="stat">
                <span class="muted small">Engine hours</span>
                <strong>${v.engine_hours ?? "—"}</strong>
              </div>
            </div>

            <div class="actions">
              <button class="btn" data-open="${v.id}">Open vessel</button>
              <a class="btn secondary" href="/v/${encodeURIComponent(v.public_id)}">
                Public page
              </a>
            </div>
          </div>
        `).join("")
        : `
          <div class="card empty">
            <h2>No vessel yet</h2>
            <p>Create your first vessel profile to start its permanent history.</p>
            <button class="btn" id="empty-add">+ Add first vessel</button>
          </div>
        `
      }
    </main>
  `;

  document.querySelector("#logout").onclick=async()=>{
    await supabase.auth.signOut();
    await router();
  }; document.querySelector("#feedback-btn")?.addEventListener("click",async()=>{
  await feedbackScreen(user);
});
document.querySelector("#interview-btn")?.addEventListener("click",async()=>{
  await interviewScreen(user);
});
  document.querySelector("#new-vessel")?.addEventListener("click",()=>vesselForm());
  document.querySelector("#empty-add")?.addEventListener("click",()=>vesselForm());

  document.querySelectorAll("[data-open]").forEach(btn=>{
    btn.onclick=()=>vesselDetail(btn.dataset.open);
  });
}

async function adminDashboard(user){
  const {data:profile,error:profileError}=await supabase
    .from("profiles")
    .select("id,full_name,role")
    .eq("id",user.id)
    .single();

  if(profileError || profile?.role!=="admin"){
    app.innerHTML=`
      <main class="container">
        <div class="card">
          <h1>Access denied</h1>
          <p class="muted">Admin access required.</p>
          <button class="btn" onclick="router()">Back</button>
        </div>
      </main>
    `;
    return;
  }

 const [{data:users},{data:vessels},
{data:records},{data:events},{data:feedback}]=await  Promise.all([
  supabase
    .from("profiles")
    .select("id,full_name,role,created_at")
    .order("created_at",{ascending:false}),
  supabase
    .from("vessels")
    .select("id,name,make,model,public_id,owner_id,created_at")
    .order("created_at",{ascending:false}),
  supabase
    .from("vessel_records")
    .select("id,vessel_id,title,record_date,provider_name,created_at")
    .order("created_at",{ascending:false}),
  supabase
    .from("user_events")
    .select("id,user_id,event_name,metadata,created_at")
    .order("created_at",{ascending:false})
.limit(20),
supabase
  .from("feedback")
  .select("id,user_id,message,created_at")
  .order("created_at",{ascending:false})
  .limit(20)
]);

  app.innerHTML=`
    <header class="topbar">
      <div class="logo">Boat<span>atory</span></div>
      <button class="btn secondary" id="admin-back">Dashboard</button>
    </header>

    <main class="container">
      <div class="card">
        <div class="badge">ADMIN</div>
        <h1>Admin Dashboard</h1>
        <p class="muted">Boatatory internal overview.</p>

        <div class="grid" style="margin-top:20px">
          <div class="card">
            <h2>${users?.length || 0}</h2>
            <p class="muted">Users</p>
          </div>

          <div class="card">
            <h2>${vessels?.length || 0}</h2>
            <p class="muted">Vessels</p>
          </div>

          <div class="card">
            <h2>${records?.length || 0}</h2>
            <p class="muted">Records</p>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Users</h2>

        ${(users||[]).map(u=>`
          <div class="admin-user-row" data-user-id="${escapeHtml(u.id)}" style="padding:14px 0;border-bottom:1px solid #20364f;cursor:pointer">
            <strong>${escapeHtml(u.full_name || "Unnamed user")}</strong>
            <div class="muted small">${escapeHtml(u.role || "user")}</div>
          </div>
        `).join("")}
      </div>

      <div class="card">
        <h2>Vessels</h2>

        ${(vessels||[]).map(v=>`
          <div style="padding:14px 0;border-bottom:1px solid #20364f">
            <strong>${escapeHtml(v.name || "Unnamed vessel")}</strong>
            <div class="muted small">
              ${escapeHtml(v.make || "")} ${escapeHtml(v.model || "")}
            </div>
            <div class="muted small">
              ID: ${escapeHtml(v.public_id || "-")}
            </div>
          </div>
        `).join("")}
      </div>

      <div class="card">
        <h2>Recent Records</h2>

        ${(records||[]).slice(0,20).map(r=>`
          <div style="padding:14px 0;border-bottom:1px solid #20364f">
            <strong>${escapeHtml(r.title || "Untitled record")}</strong>
            <div class="muted small">
              ${escapeHtml(r.record_date || "-")}
              · ${escapeHtml(r.provider_name || "No provider")}
            </div>
            <div class="small" style="margin-top:6px">
              ${
                r.verification_status === "provider_verified"
                  ? "✓ PROVIDER VERIFIED"
                  : "OWNER ENTERED"
              }
            </div>
          </div>
        `).join("")}
      </div>
  <div class="card" style="margin-top:20px">
  <h2>Feedback</h2>

  ${
    (feedback || []).slice(0,20).map(f => `
      <div style="padding:14px 0;border-bottom:1px solid #20364f">
        <div class="muted small">
          ${escapeHtml(f.created_at || "-")}
        </div>

        <p style="margin:8px 0 0">
          ${escapeHtml(f.message || "")}
        </p>
      </div>
    `).join("")
    || `<p class="muted">No feedback yet.</p>`
  }
</div>  </main>
  `;

  document.querySelectorAll(".admin-user-row").forEach(row=>{
  row.onclick=()=>adminUserDetail(user,row.dataset.userId);
});

document.querySelector("#admin-back").onclick=()=>dashboard(user);
async function adminUserDetail(adminUser,userId){
  const {data:profile}=await supabase
    .from("profiles")
    .select("id,full_name,role,onboarding_reason,created_at")
    .eq("id",userId)
    .single();

  const {data:vessels}=await supabase
    .from("vessels")
    .select("id,name,make,model,public_id,created_at")
    .eq("owner_id",userId)
    .order("created_at",{ascending:false});

  const vesselIds=(vessels||[]).map(v=>v.id);

  let records=[];

  if(vesselIds.length){
    const {data}=await supabase
      .from("vessel_records")
      .select("id,vessel_id,title,record_date,provider_name")
      .in("vessel_id",vesselIds)
      .order("record_date",{ascending:false})
      .limit(50);

    records=data||[];
  }

  const {data:feedback}=await supabase
    .from("feedback")
    .select("id,message,created_at")
    .eq("user_id",userId)
    .order("created_at",{ascending:false})
    .limit(20);
  const {data:interviews}=await supabase
  .from("interview_feedback")
  .select("id,what_trying_to_do,what_liked,what_confusing,what_improve,would_use,created_at")
  .eq("user_id",userId)
  .order("created_at",{ascending:false})
  .limit(20);

  app.innerHTML=`
    <header class="topbar">
      <div class="logo">Boat<span>atory</span></div>
      <button class="btn secondary" id="user-detail-back">Back</button>
    </header>

    <main class="container">

      <div class="card">
        <div class="badge">USER DETAIL</div>
        <h1>${escapeHtml(profile?.full_name || "Unnamed user")}</h1>

        <p class="muted">
          Joined ${escapeHtml(profile?.created_at || "-")}
        </p>

        <p>
          <strong>Role:</strong>
          ${escapeHtml(profile?.role || "user")}
        </p>

        <p>
          <strong>Why are you here?</strong><br>
          ${escapeHtml(profile?.onboarding_reason || "Not answered")}
        </p>
      </div>

      <div class="card">
        <h2>Vessels</h2>

        ${
          (vessels||[]).map(v=>`
            <div style="padding:14px 0;border-bottom:1px solid #20364f">
              <strong>${escapeHtml(v.name || "Unnamed vessel")}</strong>
              <div class="muted small">
                ${escapeHtml(v.make || "")}
                ${escapeHtml(v.model || "")}
              </div>
              <div class="muted small">
                ID: ${escapeHtml(v.public_id || "-")}
              </div>
            </div>
          `).join("")
          || `<p class="muted">No vessels yet.</p>`
        }
      </div>

      <div class="card">
        <h2>Records</h2>
        <p class="muted">
          ${records.length} record${records.length===1 ? "" : "s"}
        </p>

        ${
          records.slice(0,20).map(r=>`
            <div style="padding:14px 0;border-bottom:1px solid #20364f">
              <strong>${escapeHtml(r.title || "Untitled")}</strong>
              <div class="muted small">
                ${escapeHtml(r.record_date || "-")}
                ${r.provider_name ? " · " + escapeHtml(r.provider_name) : ""}
              </div>
            </div>
          `).join("")
          || `<p class="muted">No records yet.</p>`
        }
      </div>

      <div class="card">
        <h2>Feedback</h2>

        ${
          (feedback||[]).map(f=>`
            <div style="padding:14px 0;border-bottom:1px solid #20364f">
              <div class="muted small">
                ${escapeHtml(f.created_at || "-")}
              </div>
              <p style="margin:8px 0 0">
                ${escapeHtml(f.message || "")}
              </p>
            </div>
          `).join("")
          || `<p class="muted">No feedback yet.</p>`
        }
      </div>

   <div class="card">
  <h2>Interview</h2>

  ${
    (interviews||[]).map(i=>`
      <div style="padding:14px 0;border-bottom:1px solid #20364f">

        <div class="muted small">
          ${escapeHtml(i.created_at || "-")}
        </div>

        <p><strong>What were you trying to do?</strong><br>
          ${escapeHtml(i.what_trying_to_do || "-")}
        </p>

        <p><strong>What did you like?</strong><br>
          ${escapeHtml(i.what_liked || "-")}
        </p>

        <p><strong>What was confusing or difficult?</strong><br>
          ${escapeHtml(i.what_confusing || "-")}
        </p>

        <p><strong>What would you improve?</strong><br>
          ${escapeHtml(i.what_improve || "-")}
        </p>

        <p><strong>Would you use Boatatory?</strong><br>
          ${escapeHtml(i.would_use || "-")}
        </p>

      </div>
    `).join("")
    || `<p class="muted">No interview feedback yet.</p>`
  }
</div>
    </main>
  `;

  document.querySelector("#user-detail-back").onclick=()=>{
    adminDashboard(adminUser);
  };
} } function vesselForm(existing=null) {
  app.innerHTML=`
    <header class="topbar">
      <div class="logo">Boat<span>atory</span></div>
      <button class="btn secondary" id="back">Back</button>
    </header>

    <main class="container">
      <div class="card">
        <div class="badge">${existing ? "EDIT VESSEL" : "NEW VESSEL"}</div>
        <h1>${existing ? "Edit vessel" : "Create your vessel"}</h1>
        <p class="muted">The Vessel ID is generated automatically and remains permanent.</p>

        <div id="message"></div>

        <form id="vessel-form">
          <div class="grid">
            <div>
              <label>Vessel name *</label>
              <input id="name" required value="${escapeHtml(existing?.name||"")}">
            </div>
            <div>
              <label>Make</label>
              <input id="make" value="${escapeHtml(existing?.make||"")}">
            </div>
            <div>
              <label>Model</label>
              <input id="model" value="${escapeHtml(existing?.model||"")}">
            </div>
            <div>
              <label>Year</label>
              <input id="year" type="number" value="${existing?.year||""}">
            </div>
            <div>
              <label>Country</label>
              <input id="country" value="${escapeHtml(existing?.country||"")}">
            </div>
            <div>
              <label>HIN</label>
              <input id="hin" value="${escapeHtml(existing?.hin||"")}">
            </div>
            <div>
              <label>Engine</label>
              <input id="engine" value="${escapeHtml(existing?.engine||"")}">
            </div>
            <div>
              <label>Engine hours</label>
              <input id="engine_hours" type="number" step="0.1" value="${existing?.engine_hours||""}">
            </div>
          </div>

          <div class="actions">
            <button class="btn" type="submit">
              ${existing ? "Save changes" : "Create vessel"}
            </button>
          </div>
        </form>
      </div>
    </main>
  `;

  document.querySelector("#back").onclick=async()=>{
    const user=await getUser();
    dashboard(user);
  };

  document.querySelector("#vessel-form").onsubmit=async(e)=>{
    e.preventDefault();

    const user=await getUser();

    const payload={
      name:document.querySelector("#name").value.trim(),
      make:document.querySelector("#make").value.trim() || null,
      model:document.querySelector("#model").value.trim() || null,
      year:Number(document.querySelector("#year").value) || null,
      country:document.querySelector("#country").value.trim() || null,
      hin:document.querySelector("#hin").value.trim() || null,
      engine:document.querySelector("#engine").value.trim() || null,
      engine_hours:Number(document.querySelector("#engine_hours").value) || null
    };

    if(!payload.name){
      showError("Vessel name je obvezen.");
      return;
    }

    let result;

    if(existing){
      result=await supabase
        .from("vessels")
        .update({...payload,updated_at:new Date().toISOString()})
        .eq("id",existing.id)
        .select()
        .single();
    }else{
      result=await supabase
        .from("vessels")
        .insert({...payload,owner_id:user.id})
        .select()
        .single();
    }

    if(result.error){
      showError(result.error.message);
      return;
    }

    await vesselDetail(result.data.id);
  };
}

async function vesselDetail(vesselId) {
  const user=await getUser();

  const {data:vessel,error}=await supabase
    .from("vessels")
    .select("*")
    .eq("id",vesselId)
    .single();

  if(error){
    app.innerHTML=`<div class="container"><div class="error">${escapeHtml(error.message)}</div></div>`;
    return;
  }

  const {data:records}=await supabase
    .from("vessel_records")
    .select("*")
    .eq("vessel_id",vesselId)
    .order("record_date",{ascending:false})
    .order("created_at",{ascending:false});
const recordIds=(records||[]).map(r=>r.id);

let evidenceFiles=[];

if(recordIds.length){
  const {data:files}=await supabase
    .from("vessel_files")
    .select("*")
    .in("record_id",recordIds)
    .order("created_at",{ascending:true});

  evidenceFiles=await Promise.all(
    (files||[]).map(async file=>{
      const {data:signed,error:signedError}=await supabase.storage
  .from("vessel-files")
  .createSignedUrl(file.storage_path,3600);

if(signedError){
  alert("Evidence error: "+signedError.message);
}

return {
  ...file,
  signed_url:signed?.signedUrl || null
};
    })
  );
}
  const publicUrl=`${location.origin}/v/${vessel.public_id}`;

  app.innerHTML=`
    <header class="topbar">
      <div class="logo">Boat<span>atory</span></div>
      <div class="actions" style="margin:0">
        <button class="btn secondary" id="back">Dashboard</button>
        <button class="btn secondary" id="edit">
                </div>
      </header>

      <main class="container">
        <div class="card">
          <div class="badge">${escapeHtml(vessel.public_id)}</div>
          <h1 style="margin-top:10px">${escapeHtml(vessel.name)}</h1>
          <p class="muted">
            ${escapeHtml([vessel.make,vessel.model].filter(Boolean).join(" ") || "Vessel")}
            ${vessel.year ? ` · ${vessel.year}` : ""}
          </p>

          <div class="grid3" style="margin-top:20px">
            <div class="stat">
              <span class="muted small">HIN</span>
              <strong style="font-size:16px">${escapeHtml(vessel.hin||"—")}</strong>
            </div>

            <div class="stat">
              <span class="muted small">Engine</span>
              <strong style="font-size:16px">${escapeHtml(vessel.engine||"—")}</strong>
            </div>

            <div class="stat">
              <span class="muted small">Engine hours</span>
              <strong>${vessel.engine_hours ?? "—"}</strong>
            </div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h2>Public Vessel ID</h2>
            <p class="muted small">
              Share this link with a buyer, marina or service provider.
            </p>

            <input readonly value="${escapeHtml(publicUrl)}">

            <div class="actions">
              <button class="btn" id="copy-link">Copy public link</button>
              <a class="btn secondary" href="/v/${encodeURIComponent(vessel.public_id)}">
                Open public page
              </a>
            </div>

            <canvas id="qr" class="qr" style="margin-top:18px"></canvas>
          </div>

          <div class="card">
            <h2>Add history record</h2>

            <form id="record-form">
              <div style="margin-bottom:12px">
                <label>Date</label>
                <input id="record_date" type="date" value="${new Date().toISOString().slice(0,10)}">
              </div>

              <div style="margin-bottom:12px">
                <label>Work / title *</label>
                <input id="title" required placeholder="Polishing, engine service, antifouling...">
              </div>

              <div style="margin-bottom:12px">
                <label>Category</label>
                <select id="record_type">
                  <option value="maintenance">Maintenance</option>
                  <option value="polishing">Polishing</option>
                  <option value="antifouling">Antifouling</option>
                  <option value="engine">Engine</option>
                  <option value="propeller">Propeller</option>
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div class="grid">
                <div>
                  <label>Provider</label>
                  <input id="provider_name" placeholder="Company / person">
                </div>

                <div>
                  <label>Cost (€)</label>
                  <input id="cost" type="number" step="0.01">
                </div>
              </div>

              <div style="margin-top:12px">
                <label>Engine hours</label>
                <input id="record_engine_hours" type="number" step="0.1">
              </div>

              <div style="margin-top:12px">
                <label>Notes</label>
                <textarea id="notes" placeholder="What was done? Parts? Observations?"></textarea>
              </div>
<div style="margin-top:16px;padding:16px;border:1px solid #20364f;border-radius:14px;background:#0a1726">
  <div style="font-weight:800;margin-bottom:5px">Evidence</div>
  <div class="muted small" style="margin-bottom:12px">
    Add photos or documents for this service record.
  </div>

  <input
    id="record_files"
    type="file"
    multiple
    accept="image/*,.pdf"
  >

  <div class="muted small" style="margin-top:8px">
    Photos or PDF · max 10 files
  </div>
</div>
              <div class="actions">
                <button class="btn" type="submit">Save record</button>
              </div>
            </form>
          </div>
        </div>

        <div class="card">
          <h2>History</h2>

          <div id="records">
            ${
              records?.length
              ? records.map(r=>`
                <div class="record">
                  <div class="record-head">
                    <div>
                      <div class="badge">${escapeHtml(r.record_type||"maintenance")}</div>
                      <h3 style="margin:9px 0 4px">${escapeHtml(r.title)}</h3>
                      <div class="muted small">${formatDate(r.record_date)}</div>
                    </div>

                    <strong>${money(r.cost)}</strong>
                  </div>

                  <div class="grid3" style="margin-top:14px">
                    <div>
                      <div class="muted small">Provider</div>
                      <div>${escapeHtml(r.provider_name||"—")}</div>
                    </div>

                    <div>
                      <div class="muted small">Engine hours</div>
                      <div>${r.engine_hours ?? "—"}</div>
                    </div>

                    ${r.verification_status === "provider_verified" ? `
  <div style="grid-column:1/-1;margin-top:4px;padding:18px;border:1px solid #24506b;border-radius:14px;color:#67d5ff;letter-spacing:.4px">
    <div style="font-size:13px;font-weight:800">
      ✓ PROVIDER VERIFIED
    </div>

    ${r.verified_provider_name
      ? `
        <div class="muted small" style="margin-top:12px">
          Verified by
        </div>
        <div style="font-weight:700;margin-top:3px">
          ${escapeHtml(r.verified_provider_name)}
        </div>
      `
      : ""
    }
  </div>
` : ""}
                    ${r.verification_status === "owner_entered" ? `
<div style="grid-column:1/-1;margin-top:4px;padding:18px;border:1px solid #334e68;border-radius:14px">
  <div style="font-size:13px;font-weight:800;letter-spacing:.4px">
    OWNER ENTERED
  </div>
  <div class="muted small" style="margin-top:8px">
    This service record was entered by the vessel owner.
  </div>
</div>

<button
  class="btn"
  type="button"
  onclick="requestVerification('${r.id}')"
>
  Request verification
</button>
` : ""}
                  </div>

                 ${
  evidenceFiles.filter(f=>f.record_id===r.id).length
  ? `
    <div style="margin-top:16px;padding:16px;border:1px solid #20364f;border-radius:14px;background:#0a1726">
      <div style="font-weight:800;margin-bottom:6px">Evidence</div>
<div class="muted small" style="margin-bottom:14px">
  Attached to this service record
</div>

      ${evidenceFiles.filter(f=>f.record_id===r.id).map(f=>`
        <div style="margin-bottom:12px">
          ${
            f.mime_type?.startsWith("image/") && f.signed_url
            ? `
              <a href="${escapeHtml(f.signed_url)}" target="_blank" rel="noopener">
                <img
                  src="${escapeHtml(f.signed_url)}"
                  alt="${escapeHtml(f.file_name)}"
                  style="width:100%;max-width:360px;border-radius:12px;border:1px solid #29435e;display:block"
                >
              </a>
            `
            : f.signed_url
            ? `
              <a class="btn secondary" href="${escapeHtml(f.signed_url)}" target="_blank" rel="noopener">
                Open ${escapeHtml(f.file_name)}
              </a>
            `
            : ""
          }
        </div>
      `).join("")}
    </div>
  `
  : ""
} ${
                    r.notes
                    ? `<p class="muted" style="margin-bottom:0">${escapeHtml(r.notes)}</p>`
                    : ""
                  }
                </div>
              `).join("")
              : `<div class="empty">No history records yet.</div>`
            }
          </div>
        </div>
      </main>
    </div>
  `;

  QRCode.toCanvas(
    document.querySelector("#qr"),
    publicUrl,
    {width:190,margin:1},
    ()=>{}
  );

  document.querySelector("#back").onclick=()=>dashboard(user);

  document.querySelector("#edit").onclick=()=>vesselForm(vessel);

  document.querySelector("#copy-link").onclick=async()=>{
    try{
      await navigator.clipboard.writeText(publicUrl);
      showSuccess("Public link copied.");
    }catch{
      showError("Copy ni uspel. Link je: "+publicUrl);
    }
  };

  document.querySelector("#record-form").onsubmit=async(e)=>{
  e.preventDefault();

  const payload={
    vessel_id:vesselId,
    created_by:user.id,
    record_type:document.querySelector("#record_type").value,
    title:document.querySelector("#title").value.trim(),
    record_date:document.querySelector("#record_date").value,
    provider_name:document.querySelector("#provider_name").value.trim(),
    cost:Number(document.querySelector("#cost").value)||null,
    engine_hours:Number(document.querySelector("#record_engine_hours").value)||null,
    notes:document.querySelector("#notes").value.trim()
  };

  if(!payload.title){
    showError("Title / work je obvezen.");
    return;
  }

  const files=Array.from(
    document.querySelector("#record_files")?.files || []
  );

  if(files.length>10){
    showError("Maximum 10 files.");
    return;
  }

  const {data:record,error}=await supabase
    .from("vessel_records")
    .insert(payload)
    .select("id")
    .single();

  if(error){
    showError(error.message);
    return;
  }

 await trackEvent("record_created", {
  record_id: record.id,
  vessel_id: vesselId
}); 
    for(let i=0;i<files.length;i++){
    const file=files[i];

    const safeName=file.name
      .replace(/[^a-zA-Z0-9._-]/g,"_");

    const storagePath=
      `${vesselId}/${record.id}/${Date.now()}-${i}-${safeName}`;

    const {error:uploadError}=await supabase.storage
      .from("vessel-files")
      .upload(storagePath,file);

    if(uploadError){
      showError("Record saved, but file upload failed: "+uploadError.message);
      return;
    }

    const {error:fileError}=await supabase
      .from("vessel_files")
      .insert({
        vessel_id:vesselId,
        record_id:record.id,
        uploaded_by:user.id,
        storage_path:storagePath,
        file_name:file.name,
        mime_type:file.type || null,
        file_size:file.size,
        is_public:false
      });

    if(fileError){
      showError("File uploaded, but evidence record failed: "+fileError.message);
      return;
    }
  }
if(files.length > 0){
  await trackEvent("evidence_uploaded", {
    record_id: record.id,
    vessel_id: vesselId,
    file_count: files.length
  });
}
  await vesselDetail(vesselId);
};
}

async function publicVessel(publicId) {
  const {data:vessel,error}=await supabase
    .from("vessels")
    .select("id,public_id,name,make,model,year,country,engine,engine_hours,is_public")
    .eq("public_id",publicId)
    .eq("is_public",true)
    .single();

  if(error || !vessel){
    app.innerHTML=`
      <main class="container">
        <div class="card empty">
          <h1>Vessel not found</h1>
          <p>The public Vessel ID is invalid or the vessel is private.</p>
        </div>
      </main>
    `;
    return;
  }

  const {data:records}=await supabase
    .from("vessel_records")
    .select("record_type,title,record_date,provider_name,cost,engine_hours,notes,verification_status")
    .eq("vessel_id",vessel.id)
    .eq("is_public",true)
    .order("record_date",{ascending:false});

  app.innerHTML=`
    <header class="topbar">
      <div class="logo">Boat<span>atory</span></div>
      <span class="badge">${escapeHtml(vessel.public_id)}</span>
    </header>

    <main class="container">
      <div class="hero" style="padding-top:35px">
        <div class="badge">PUBLIC VESSEL HISTORY</div>
        <h1>${escapeHtml(vessel.name)}</h1>
        <p class="muted">
          ${escapeHtml([vessel.make,vessel.model].filter(Boolean).join(" ") || "Vessel")}
          ${vessel.year ? ` · ${vessel.year}` : ""}
        </p>
      </div>

      <div class="card">
        <h2>Vessel information</h2>

        <div class="grid3">
          <div class="stat">
            <span class="muted small">Vessel ID</span>
            <strong style="font-size:16px">${escapeHtml(vessel.public_id)}</strong>
          </div>

          <div class="stat">
            <span class="muted small">Country</span>
            <strong style="font-size:16px">${escapeHtml(vessel.country||"—")}</strong>
          </div>

          <div class="stat">
            <span class="muted small">Engine hours</span>
            <strong>${vessel.engine_hours ?? "—"}</strong>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Service history</h2>

        ${
          records?.length
          ? records.map(r=>`
            <div class="record">
              <div class="badge">${escapeHtml(r.record_type||"maintenance")}</div>
              <h3 style="margin:9px 0 4px">${escapeHtml(r.title)}</h3>
              <div class="muted small">${formatDate(r.record_date)}</div>

              <div class="grid3" style="margin-top:14px">
                <div>
                  <div class="muted small">Provider</div>
                  <div>${escapeHtml(r.provider_name||"—")}</div>
                </div>

                <div>
                  <div class="muted small">Cost</div>
                  <div>${money(r.cost)}</div>
                </div>

                <div>
                  <div class="muted small">Engine hours</div>
                  <div>${r.engine_hours ?? "—"}</div>
                </div>
              </div>

              ${
  r.notes
  ? `<p class="muted">${escapeHtml(r.notes)}</p>`
  : ""
}
<div class="small" style="font-weight:800;color:#67d5ff;margin-top:10px">
  ${
    r.verification_status === "provider_verified"
      ? "✓ PROVIDER VERIFIED"
      : "OWNER ENTERED"
  }
</div>
            </div>
          `).join("")
          : `<div class="empty">No public history records yet.</div>`
        }
      </div>

      <div class="card" style="text-align:center">
        <div class="badge">POWERED BY BOATATORY</div>
        <p class="muted">A permanent digital history for your vessel.</p>
      </div>
    </main>
  `;
}

async function router() {
  if(!SUPABASE_URL || !SUPABASE_KEY){
    app.innerHTML=`
      <main class="container">
        <div class="card">
          <h1>Boatatory configuration missing</h1>
          <p class="muted">
            Supabase environment variables are not configured in Vercel.
          </p>
          <p><strong>VITE_SUPABASE_URL</strong></p>
          <p><strong>VITE_SUPABASE_PUBLISHABLE_KEY</strong></p>
        </div>
      </main>
    `;
    return;
  }


  const path=location.pathname;
if(path.startsWith("/v/")){
  const publicId=decodeURIComponent(path.split("/v/")[1] || "");
  await publicVessel(publicId);
  return;
} if(path.startsWith("/verify/")){
  const token=decodeURIComponent(path.split("/verify/")[1] || "");
  await verifyRecord(token);
  return;
}

 const user=await getUser();

  if(!user){
    authScreen();
    return;
  }

  await ensureProfile(user);
  const {data:profile}=await supabase
  .from("profiles")
  .select("role,onboarding_reason")
  .eq("id",user.id)
  .single();

if(profile?.role==="admin"){
  await adminDashboard(user);
  return;
}

await dashboard(user);
}
async function verifyRecord(token){
  const {data,error}=await supabase.rpc(
    "get_record_verification",
    {p_token:token}
  );
const record=Array.isArray(data) ? data[0] : data;
  if(error || !record){
    app.innerHTML=`
      <main style="max-width:700px;margin:60px auto;padding:24px">
        <h1>Verification link invalid</h1>
        <p>This verification link is invalid, expired, or already used.</p>
      </main>
    `;
    return;
  }

  app.innerHTML=`
    <main style="max-width:700px;margin:40px auto;padding:24px">
      <h1>Verify service record</h1>

      <p style="opacity:.7">
        Vessel: <strong>${record.vessel_name}</strong>
      </p>

      <div style="padding:20px;border:1px solid #334155;border-radius:14px;margin:20px 0">
        <h2>${record.title || "Service record"}</h2>
        <p><strong>Date:</strong> ${record.record_date || "-"}</p>
        <p><strong>Provider entered by owner:</strong> ${record.provider_name || "-"}</p>
        <p><strong>Engine hours:</strong> ${record.engine_hours ?? "-"}</p>
        <p><strong>Cost:</strong> ${record.cost ?? "-"} €</p>
        <p><strong>Notes:</strong> ${record.notes || "-"}</p>
      </div>

      <form id="verify-form">
        <label>Provider / service company name</label>
        <input
          id="verify_provider_name"
          required
          placeholder="Your company or name"
          style="width:100%;padding:12px;margin:8px 0 16px"
        >

        <label>Email (optional)</label>
        <input
          id="verify_provider_email"
          type="email"
          placeholder="email@example.com"
          style="width:100%;padding:12px;margin:8px 0 20px"
        >

        <button class="btn" type="submit">
          Confirm service record
        </button>
      </form>

      <p id="verify-message" style="margin-top:20px"></p>
    </main>
  `;

  document.querySelector("#verify-form").addEventListener("submit",async(e)=>{
    e.preventDefault();

    const providerName=
      document.querySelector("#verify_provider_name").value.trim();

    const providerEmail=
      document.querySelector("#verify_provider_email").value.trim() || null;

    const {error}=await supabase.rpc(
      "confirm_record_verification",
      {
        p_token:token,
        p_provider_name:providerName,
        p_provider_email:providerEmail
      }
    );

    const message=document.querySelector("#verify-message");

    if(error){
      message.textContent=error.message;
      return;
    }

    message.innerHTML=`
      <strong>✓ Provider verified</strong>
      <br><br>
      This service record has been successfully verified.
      <br><br>
      <a href="/v/${encodeURIComponent(record.vessel_public_id)}">
        View public vessel history
      </a>
    `;

    document.querySelector("#verify-form").style.display="none";
  });
}
async function requestVerification(recordId){
  const {data:token,error}=await supabase.rpc(
    "create_record_verification_request",
    {
      p_record_id:recordId
    }
  );

  if(error){
    alert(error.message);
    return;
  }

  const verificationUrl=
    `${location.origin}/verify/${encodeURIComponent(token)}`;

  try{
    await navigator.clipboard.writeText(verificationUrl);
    alert(
      "Verification link created and copied!\n\n" +
      "Send this link to the service provider."
    );
  }catch{
    prompt(
      "Verification link — copy and send it to the service provider:",
      verificationUrl
    );
  }
}
window.requestVerification = requestVerification;


router();
