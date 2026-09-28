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
}

function authScreen() {
  app.innerHTML = `
    <div class="hero">
      <div class="badge">BOATPROOF · PHASE 1</div>
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
      <div class="logo">Boat<span>Proof</span></div>
      <button class="btn secondary" id="logout">Sign out</button>
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
  };

  document.querySelector("#new-vessel")?.addEventListener("click",()=>vesselForm());
  document.querySelector("#empty-add")?.addEventListener("click",()=>vesselForm());

  document.querySelectorAll("[data-open]").forEach(btn=>{
    btn.onclick=()=>vesselDetail(btn.dataset.open);
  });
}

function vesselForm(existing=null) {
  app.innerHTML=`
    <header class="topbar">
      <div class="logo">Boat<span>Proof</span></div>
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

  const publicUrl=`${location.origin}/v/${vessel.public_id}`;

  app.innerHTML=`
    <header class="topbar">
      <div class="logo">Boat<span>Proof</span></div>
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

                    <div>
                      <div class="muted small">Status</div>
                      <div>${escapeHtml(r.verification_status||"owner_entered")}</div>
                    </div>
                    ${r.verification_status !== "provider_verified" ? `
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
      provider_name:document.querySelector("#provider_name").value.trim() || null,
      cost:Number(document.querySelector("#cost").value) || null,
      engine_hours:Number(document.querySelector("#record_engine_hours").value) || null,
      notes:document.querySelector("#notes").value.trim() || null
    };

    if(!payload.title){
      showError("Title / work je obvezen.");
      return;
    }

    const {error}=await supabase
      .from("vessel_records")
      .insert(payload);

    if(error){
      showError(error.message);
      return;
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
      <div class="logo">Boat<span>Proof</span></div>
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

              <div class="small muted">
                ${escapeHtml(r.verification_status||"owner_entered")}
              </div>
            </div>
          `).join("")
          : `<div class="empty">No public history records yet.</div>`
        }
      </div>

      <div class="card" style="text-align:center">
        <div class="badge">POWERED BY BOATPROOF</div>
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
          <h1>BoatProof configuration missing</h1>
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
if(path.startsWith("/verify/")){
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
supabase.auth.onAuthStateChange(async()=>{
  await router();
});

router();
