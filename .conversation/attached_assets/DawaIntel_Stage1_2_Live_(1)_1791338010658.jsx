import { useState, useMemo } from "react";

const C = {
  teal:"#1A6B6B", tealD:"#0F4040", tealL:"#E8F4F4", tealM:"#B8DFE0",
  gold:"#C07C2A", goldL:"#FDF3E3", goldM:"#F5D9A8",
  red:"#C0392B",  redL:"#FDECEA",
  green:"#1A7A4A",greenL:"#E8F5EE",
  amber:"#D97706",amberL:"#FFFBEB",
  dark:"#1C1C1C", mid:"#4A4A4A", muted:"#888",
  bg:"#F4F6F5",   white:"#FFFFFF", border:"#D8D8D4",
  code:"#0F2A2A",
};

const S = {
  app:  { fontFamily:"'Segoe UI',system-ui,sans-serif", background:C.bg, minHeight:"100vh", color:C.dark },
  nav:  { background:C.tealD, display:"flex", alignItems:"center", padding:"0 14px",
          boxShadow:"0 2px 8px rgba(0,0,0,0.3)", flexWrap:"wrap" },
  brand:{ color:"#fff", fontWeight:800, fontSize:14, letterSpacing:"0.1em",
          padding:"12px 12px 12px 0", marginRight:8,
          borderRight:"1px solid rgba(255,255,255,0.2)", whiteSpace:"nowrap" },
  tab:  (a)=>({ background:"none", border:"none", cursor:"pointer", padding:"12px 10px",
          fontSize:10, fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase",
          whiteSpace:"nowrap",
          color: a ? "#fff" : "rgba(255,255,255,0.6)",
          borderBottom: a ? `3px solid ${C.gold}` : "3px solid transparent" }),
  main: { maxWidth:840, margin:"0 auto", padding:"22px 14px" },
  hdr:  { marginBottom:20 },
  eyebrow:{ fontSize:10, fontWeight:800, letterSpacing:"0.22em", textTransform:"uppercase",
            color:C.teal, marginBottom:4 },
  h1:   { fontSize:21, fontWeight:700, color:C.tealD, margin:"0 0 3px" },
  sub:  { fontSize:13, color:C.muted, margin:0 },
  card: { background:C.white, borderRadius:9, border:`1px solid ${C.border}`,
          boxShadow:"0 1px 3px rgba(0,0,0,0.05)", overflow:"hidden", marginBottom:14 },
  chdr: { background:C.tealD, color:"#fff", padding:"11px 16px",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 },
  cht:  { fontWeight:700, fontSize:12, letterSpacing:"0.05em", textTransform:"uppercase" },
  cbdy: { padding:"16px" },
  lbl:  { fontSize:11, fontWeight:700, color:C.mid, display:"block", marginBottom:4,
          textTransform:"uppercase", letterSpacing:"0.06em" },
  inp:  { width:"100%", padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:5,
          fontSize:13, color:C.dark, background:C.white, outline:"none", boxSizing:"border-box" },
  sel:  { width:"100%", padding:"8px 10px", border:`1px solid ${C.border}`, borderRadius:5,
          fontSize:13, color:C.dark, background:C.white, cursor:"pointer", boxSizing:"border-box" },
  btn:  (bg,fg="#fff")=>({ background:bg, color:fg, border:"none", borderRadius:5,
          padding:"8px 14px", fontSize:11, fontWeight:700, cursor:"pointer",
          letterSpacing:"0.04em", textTransform:"uppercase" }),
  bsm:  (bg,fg="#fff")=>({ background:bg, color:fg, border:"none", borderRadius:4,
          padding:"4px 10px", fontSize:10, fontWeight:700, cursor:"pointer" }),
  row:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  row3: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 },
  note: (bg,brd)=>({ background:bg, borderLeft:`4px solid ${brd}`,
          borderRadius:"0 6px 6px 0", padding:"11px 14px", marginBottom:12, marginTop:8 }),
  ntit: { fontWeight:700, fontSize:12, marginBottom:3 },
  nbdy: { fontSize:12, color:C.mid, lineHeight:1.65 },
  code: { background:C.code, color:"#A8D8A8", borderRadius:6, padding:"11px 14px",
          fontFamily:"'Courier New',monospace", fontSize:11, lineHeight:1.7,
          overflowX:"auto", whiteSpace:"pre-wrap", marginTop:6, marginBottom:4 },
  tbl:  { width:"100%", borderCollapse:"collapse", fontSize:12 },
  th:   { padding:"7px 11px", textAlign:"left", fontWeight:700, fontSize:10,
          textTransform:"uppercase", letterSpacing:"0.05em", background:C.tealD, color:"#fff" },
  td:   (alt)=>({ padding:"7px 11px", borderBottom:`1px solid ${C.border}`,
          background:alt?C.tealL:C.white, verticalAlign:"top" }),
  bdg:  (bg,fg)=>({ background:bg, color:fg, borderRadius:20, padding:"2px 7px",
          fontSize:9, fontWeight:800, letterSpacing:"0.07em",
          textTransform:"uppercase", display:"inline-block" }),
  step: { display:"flex", gap:12, alignItems:"flex-start", marginBottom:16, paddingBottom:16,
          borderBottom:`1px solid ${C.border}` },
  stepN:{ width:28, height:28, borderRadius:"50%", background:C.teal, color:"#fff",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:800, fontSize:13, flexShrink:0, marginTop:1 },
  stepB:{ flex:1 },
  stepT:{ fontWeight:700, fontSize:14, color:C.dark, marginBottom:3 },
  stepD:{ fontSize:12, color:C.mid, lineHeight:1.65 },
  waBubble:{ background:"#fff", borderRadius:"0 10px 10px 10px", padding:"11px 14px",
             maxWidth:400, boxShadow:"0 1px 3px rgba(0,0,0,0.1)", lineHeight:1.65,
             fontSize:13, color:"#111", whiteSpace:"pre-wrap" },
  waTime:{ fontSize:10, color:"#999", textAlign:"right", marginTop:5 },
};

function CopyBlock({ content, label="" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    const text = content;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2200);});
    } else {
      const ta=document.createElement("textarea"); ta.value=text;
      document.body.appendChild(ta); ta.select(); document.execCommand("copy");
      document.body.removeChild(ta); setCopied(true); setTimeout(()=>setCopied(false),2200);
    }
  };
  return (
    <div>
      <div style={S.code}>{content}</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
        <button style={{...S.btn(copied?C.green:C.teal)}} onClick={copy}>
          {copied ? "✓ Copied!" : "Copy"}
        </button>
        {label && <span style={{fontSize:11,color:C.muted}}>{label}</span>}
      </div>
    </div>
  );
}

function Step({n,title,children}) {
  return (
    <div style={S.step}>
      <div style={S.stepN}>{n}</div>
      <div style={S.stepB}>
        <div style={S.stepT}>{title}</div>
        <div style={S.stepD}>{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab,setTab] = useState("setup");
  const TABS = [
    {id:"setup",    lbl:"Stage 1 Setup"},
    {id:"sheets",   lbl:"Sheets Formulas"},
    {id:"report",   lbl:"Report Generator"},
    {id:"whatsapp", lbl:"WhatsApp Composer"},
    {id:"stage2",   lbl:"Stage 2 Tools"},
  ];
  return (
    <div style={S.app}>
      <nav style={S.nav}>
        <span style={S.brand}>⬡ DAWA INTEL</span>
        {TABS.map(t=>(
          <button key={t.id} style={S.tab(tab===t.id)} onClick={()=>setTab(t.id)}>{t.lbl}</button>
        ))}
      </nav>
      <main style={S.main}>
        {tab==="setup"    && <SetupGuide/>}
        {tab==="sheets"   && <SheetsFormulas/>}
        {tab==="report"   && <ReportGenerator/>}
        {tab==="whatsapp" && <WhatsAppComposer/>}
        {tab==="stage2"   && <Stage2Tools/>}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 1 — STAGE 1 SETUP GUIDE
// ══════════════════════════════════════════════════════════════
function SetupGuide() {
  return (
    <div>
      <div style={S.hdr}>
        <div style={S.eyebrow}>Stage 1 — Week by Week</div>
        <h1 style={S.h1}>Manual MVP Setup Guide</h1>
        <p style={S.sub}>Everything you need to run your first 2–3 pilot pharmacies. Zero cost. Zero app.</p>
      </div>

      <div style={S.note(C.goldL,C.gold)}>
        <div style={{...S.ntit,color:C.gold}}>What Stage 1 actually is</div>
        <div style={S.nbdy}>You track 2–3 pharmacies in a Google Sheet. Every Sunday evening you review their data and send a WhatsApp message Monday morning. That message — three bullet points, one insight, one alert — is the product. Your goal is not to impress anyone with technology. Your goal is to make a pharmacy owner say "I acted on that" within 30 days.</div>
      </div>

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Week 0 — Before You Talk to Anyone</span></div>
        <div style={S.cbdy}>
          <Step n="1" title="Create your professional Google account">
            Create a dedicated Gmail — something like <strong>dawaintel.nakuru@gmail.com</strong>. Do not use your personal Gmail. This is your professional identity. Set up a WhatsApp Business profile on your phone with this email, a simple logo (even plain text), and your service description.
          </Step>
          <Step n="2" title="Build your Master Tracker Sheet">
            Create a new Google Sheet called <strong>"Dawa Intel — Pilot Tracker"</strong>. Add one tab per pharmacy. You will paste the formulas from the Sheets Formulas tab of this tool directly into each tab. Take 30 minutes to set it up properly once — you will use it for months.
          </Step>
          <Step n="3" title="Create your Google Form for daily stock entry">
            Go to <strong>forms.google.com</strong>. Create a new form with these exact questions:
            <div style={S.note(C.tealL,C.teal)}>
              <div style={{...S.ntit,color:C.teal,fontStyle:"normal"}}>Google Form — Exact Fields</div>
              <div style={{...S.nbdy,fontStyle:"normal"}}>
                <strong>Q1:</strong> Pharmacy name (Short answer — pre-fill for each pharmacy's link)<br/>
                <strong>Q2:</strong> Date (Date — default to today)<br/>
                <strong>Q3:</strong> Staff name (Short answer)<br/>
                <strong>Q4:</strong> Drug name (Dropdown — add your top 30 drugs from KEML)<br/>
                <strong>Q5:</strong> Movement type (Multiple choice: Dispensed / Received / Returned / Expired)<br/>
                <strong>Q6:</strong> Quantity (Number)<br/>
                <strong>Q7:</strong> Expiry date of batch — only if Received (Date, optional)<br/>
                <strong>Q8:</strong> Notes / anything unusual (Short answer, optional)<br/><br/>
                <strong>Settings:</strong> Allow multiple responses per session. Do NOT require Google sign-in. In the Responses tab, click "Link to Sheets" — this sends all entries directly to your Tracker.
              </div>
            </div>
          </Step>
          <Step n="4" title="Create your Evidence File">
            Open a Google Doc called <strong>"Dawa Intel — Evidence File"</strong>. Every time a client acts on one of your alerts, record it: date, drug name, alert sent, action taken, estimated KES value saved. This document becomes your case studies for Stage 2 sales — start it before your first pilot, not after.
          </Step>
          <Step n="5" title="Secure brand handles (free)">
            Register <strong>dawaintel</strong> as your WhatsApp Business name. Create a Facebook page and Instagram handle @DawaIntel. Save dawaintel.nakuru@gmail.com. Do not spend money on a domain yet — that is Stage 2.
          </Step>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Week 1–2 — First Pharmacy Conversations</span></div>
        <div style={S.cbdy}>
          <Step n="6" title="The opening question — memorise this exactly">
            Walk in, ask for the owner or pharmacist-in-charge. Say:<br/><br/>
            <em style={{color:C.tealD}}>"Habari — I'm a pharmacy student at [university]. I'm working on a project to help pharmacies track their stock better. Can I ask you one thing? What was the last drug you ran out of unexpectedly — and roughly what did that cost you?"</em><br/><br/>
            Then stop talking. Let them answer fully. Do not mention your service until they finish.
          </Step>
          <Step n="7" title="The offer — only once they are clearly engaged">
            <em style={{color:C.tealD}}>"I'm offering to track your stock for free for one month. Every Monday morning I send a short WhatsApp message — three things you need to know about your inventory that week. No app, nothing to install, no subscription. Your staff just fill in a short Google Form on their phone each day. Can we try it?"</em>
          </Step>
          <Step n="8" title="Day 1 onboarding visit">
            Bring your phone or tablet. Set up the Google Form pre-filled link for their pharmacy. Sit with one staff member and make them fill in the form themselves on their own phone — do not do it for them. Manually enter current stock levels for their top 20 drugs into your Sheet (ask them to count or estimate). Take a photo of their drug shelves for your own reference.
          </Step>
          <Step n="9" title="Your Sunday evening routine (every week)">
            Open your Sheet. Review Form responses for the week. Check the Days Remaining column for any drug below 14 days. Note any expiry flags. Compose the Monday WhatsApp draft. Send it Monday at 8am. Missing a single Monday destroys consistency — set a phone alarm for Sunday 8pm and Monday 7:55am.
          </Step>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Day 25–28 — The "Aha Moment" Visit</span></div>
        <div style={S.cbdy}>
          <Step n="10" title="Show them what the data found">
            Visit each pilot pharmacy. Show them on your phone or a printed page: (1) their top 5 fastest-moving drugs, (2) any alert they received and whether they acted on it, (3) an estimated KES value of any avoided stockout or expiry loss.<br/><br/>
            Then ask: <em style={{color:C.tealD}}>"Would you pay KES 2,500 a month to keep getting this every Monday?"</em><br/><br/>
            Two pharmacies saying yes = Stage 1 complete. Move to Stage 2.
          </Step>
        </div>
      </div>

      <div style={S.note(C.greenL,C.green)}>
        <div style={{...S.ntit,color:C.green}}>Stage 1 Complete When</div>
        <div style={S.nbdy}>
          ✅ 2+ pharmacy owners have said unprompted they acted on one of your alerts<br/>
          ✅ 2+ have asked what happens after the free month ends<br/>
          ✅ 4+ weeks of real dispensing data in your Sheet<br/>
          ✅ 1+ documented case study in your Evidence File with a KES value attached
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 2 — SHEETS FORMULAS
// ══════════════════════════════════════════════════════════════
function SheetsFormulas() {
  const [pharmName,  setPharmName]  = useState("Mary Wanjiku Pharmacy");
  const [formSheet,  setFormSheet]  = useState("Form Responses 1");
  const [drugRow,    setDrugRow]    = useState("3");
  const r = parseInt(drugRow)||3;

  const structure = `SHEET STRUCTURE — One tab per pharmacy

Columns:
A  Drug Name
B  Unit (tabs / caps / bottles / vials / etc.)
C  Current Stock  ← update manually each time stock changes
D  Weekly Dispensed Avg  ← formula E below
E  Daily Avg              ← formula F below
F  Days Remaining ★      ← formula G below (the key number)
G  Regional Avg Days     ← enter manually (Nakuru benchmarks)
H  Status                ← formula I below
I  Nearest Expiry Date   ← enter manually when stock received
J  Days to Expiry        ← formula K below
K  Expiry Status         ← formula L below
L  Alert Flag            ← formula M below (scan this every Sunday)

Row 1 = Column headers
Row 2 = Example / test row
Row 3 onwards = one drug per row`;

  // ── All formulas are derived from state so they ALL update when pharmName/formSheet/drugRow changes ──
  // Form Responses column mapping (matches Google Form → Sheets output):
  // A=Timestamp  B=Pharmacy Name  C=Date  D=Staff Name
  // E=Drug Name  F=Movement Type  G=Quantity  H=Expiry Date  I=Notes

  const fmlaWeeklyAvg = `=IFERROR(
  SUMPRODUCT(
    ('${formSheet}'!$B$2:$B$500="${pharmName}")*
    ('${formSheet}'!$E$2:$E$500=A${r})*
    ('${formSheet}'!$F$2:$F$500="Dispensed")*
    (DATEVALUE(TEXT('${formSheet}'!$C$2:$C$500,"YYYY-MM-DD"))>=(TODAY()-90))*
    '${formSheet}'!$G$2:$G$500
  ) /
  MAX(1,
    SUMPRODUCT(
      ('${formSheet}'!$B$2:$B$500="${pharmName}")*
      ('${formSheet}'!$E$2:$E$500=A${r})*
      ('${formSheet}'!$F$2:$F$500="Dispensed")*
      (DATEVALUE(TEXT('${formSheet}'!$C$2:$C$500,"YYYY-MM-DD"))>=(TODAY()-90))
    ) / 7 * 7
  ),
0)`;

  const fmlaDailyAvg  = `=IFERROR(D${r}/7, 0)`;

  const fmlaDaysLeft  = `=IFERROR(
  IF(E${r}=0,
    IF(C${r}>0, 999, 0),
    ROUND(C${r}/E${r}, 0)),
0)`;

  const fmlaStatus    = `=IF(F${r}<=0,  "STOCKOUT",
 IF(F${r}<=7,  "CRITICAL",
 IF(F${r}<=14, "LOW",
 IF(F${r}<=30, "ADEQUATE",
               "GOOD"))))`;

  // CORRECTED: INT(I-TODAY()) gives positive days remaining (not DAYS() which is backwards)
  const fmlaDaysToExp = `=IF(I${r}="", "", INT(I${r}-TODAY()))`;

  const fmlaExpStatus = `=IF(I${r}="", "OK",
 IF(J${r}<=0,  "EXPIRED",
 IF(J${r}<=30, "EXPIRES SOON",
 IF(J${r}<=60, "EXPIRING 60D",
               "OK"))))`;

  const fmlaAlert     = `=IF(
  OR(H${r}="STOCKOUT",   H${r}="CRITICAL",
     K${r}="EXPIRED",    K${r}="EXPIRES SOON"),
  "ACTION NEEDED",
  IF(
    OR(H${r}="LOW", K${r}="EXPIRING 60D"),
    "MONITOR",
    "OK"))`;

  // Dashboard uses pharmName from state so it updates with the name change
  const fmlaDashboard = `DASHBOARD TAB — paste into a new tab called "Overview"
(Replace '${pharmName}' with your actual tab name each time)

Count stockouts:
=COUNTIF('${pharmName}'!H:H, "STOCKOUT")

Count action items:
=COUNTIF('${pharmName}'!L:L, "ACTION NEEDED")

Count monitor items:
=COUNTIF('${pharmName}'!L:L, "MONITOR")

Average days of stock across all drugs (excluding 999):
=AVERAGEIF('${pharmName}'!F:F, "<999")

Expiry warnings:
=COUNTIF('${pharmName}'!K:K, "EXPIRES SOON")
  + COUNTIF('${pharmName}'!K:K, "EXPIRING 60D")

Add one set of rows per pharmacy tab.
Label each row with the pharmacy name in column A.`;

  const conditionalFmt = `CONDITIONAL FORMATTING (Format → Conditional formatting)
Apply to column H (Status) and K (Expiry Status):

Rule 1  Text contains "STOCKOUT"   → Red background    #C0392B + White text
Rule 2  Text contains "CRITICAL"   → Red background    #C0392B + White text
Rule 3  Text contains "EXPIRES"    → Red background    #C0392B + White text
Rule 4  Text contains "EXPIRED"    → Red background    #C0392B + White text
Rule 5  Text contains "LOW"        → Orange background #E67E22 + Dark text
Rule 6  Text contains "EXPIRING"   → Orange background #E67E22 + Dark text
Rule 7  Text contains "ADEQUATE"   → Yellow background #F1C40F + Dark text
Rule 8  Text contains "GOOD"       → Green background  #1A7A4A + White text
Rule 9  Text contains "OK"         → Green background  #1A7A4A + White text

Apply same rules to column L (Alert Flag):
"ACTION NEEDED" → Red, "MONITOR" → Orange, "✅ OK" → Green`;

  return (
    <div>
      <div style={S.hdr}>
        <div style={S.eyebrow}>Stage 1 — Google Sheets</div>
        <h1 style={S.h1}>Formula Builder</h1>
        <p style={S.sub}>Configure below. All formulas update live — copy directly into your Sheet.</p>
      </div>

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Configure</span></div>
        <div style={S.cbdy}>
          <div style={S.row}>
            <div>
              <label style={S.lbl}>Pharmacy name (exactly as entered in Form)</label>
              <input style={S.inp} value={pharmName} onChange={e=>setPharmName(e.target.value)}/>
            </div>
            <div>
              <label style={S.lbl}>Form responses tab name</label>
              <input style={S.inp} value={formSheet} onChange={e=>setFormSheet(e.target.value)} placeholder="Form Responses 1"/>
            </div>
          </div>
          <div style={{marginTop:10}}>
            <label style={S.lbl}>First drug row number (row 3 if row 1=header, row 2=example)</label>
            <input style={{...S.inp,maxWidth:100}} type="number" value={drugRow} onChange={e=>setDrugRow(e.target.value)} min="2"/>
          </div>
          <div style={S.note(C.tealL,C.teal)}>
            <div style={{...S.ntit,color:C.teal,fontStyle:"normal"}}>How to use</div>
            <div style={{...S.nbdy,fontStyle:"normal"}}>Paste each formula into the corresponding cell for row {r}. Then select that cell and drag the corner down to copy it for all drug rows — Sheets auto-adjusts row numbers. The pharmacy name in the formula must match exactly what staff type in the Form's Q1 field.</div>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Sheet Structure</span></div>
        <div style={S.cbdy}><CopyBlock content={structure} label="Column layout reference"/></div>
      </div>

      {[
        {title:"Column D — Weekly Dispensing Average", note:"Looks back 90 days at Form responses. Calculates units per week for this drug at this pharmacy.", formula:fmlaWeeklyAvg, dest:`D${r}`},
        {title:"Column E — Daily Average", note:"Divides weekly avg by 7. Used by the Days Remaining formula.", formula:fmlaDailyAvg, dest:`E${r}`},
        {title:"Column F — Days Remaining ★ THE KEY NUMBER", note:"How many days of stock remain at current dispensing rate. This is the number you quote in every WhatsApp report.", formula:fmlaDaysLeft, dest:`F${r}`},
        {title:"Column H — Stock Status", note:"Produces a colour-coded label. Apply conditional formatting rules to make it visually scannable.", formula:fmlaStatus, dest:`H${r}`},
        {title:"Column J — Days to Expiry", note:"Calculates days from today to the expiry date you enter in column I when receiving stock.", formula:fmlaDaysToExp, dest:`J${r}`},
        {title:"Column K — Expiry Status", note:"Flags batches expiring within 60 days. EXPIRED = remove from shelf immediately.", formula:fmlaExpStatus, dest:`K${r}`},
        {title:"Column L — Combined Alert Flag ★ SCAN THIS EVERY SUNDAY", note:"The single most important column. Scan it every Sunday. Any row showing ⚠ ACTION NEEDED goes into Monday's WhatsApp report.", formula:fmlaAlert, dest:`L${r}`},
      ].map(({title,note,formula,dest})=>(
        <div key={dest} style={S.card}>
          <div style={S.chdr}><span style={S.cht}>{title}</span></div>
          <div style={S.cbdy}>
            <div style={{fontSize:12,color:C.mid,marginBottom:6}}>{note}</div>
            <CopyBlock content={formula} label={`Paste into ${dest} → drag down for all drug rows`}/>
          </div>
        </div>
      ))}

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Dashboard Tab</span></div>
        <div style={S.cbdy}><CopyBlock content={fmlaDashboard} label="Create an 'Overview' tab — summary across all pharmacy tabs"/></div>
      </div>

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Conditional Formatting Rules</span></div>
        <div style={S.cbdy}><CopyBlock content={conditionalFmt} label="Makes the Sheet visually scannable in under 10 seconds"/></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 3 — REPORT GENERATOR
// ══════════════════════════════════════════════════════════════
function ReportGenerator() {
  const now = new Date();
  const wAgo = new Date(now); wAgo.setDate(wAgo.getDate()-7);
  const fmtD = (d)=>d.toLocaleDateString("en-KE",{day:"2-digit",month:"short",year:"numeric"});

  const [pharmName,  setPharmName]  = useState("Mary Wanjiku Pharmacy");
  const [ownerName,  setOwnerName]  = useState("Mary");
  const [period,     setPeriod]     = useState(`${fmtD(wAgo)} – ${fmtD(now)}`);
  const [rec,        setRec]        = useState("Reorder Amoxicillin and Ibuprofen before Friday. Metformin is also approaching 14 days — consider adding it to the order.");
  const [drugs, setDrugs] = useState([
    {id:1,name:"Metformin 500mg tabs",     stock:180,wAvg:80, dl:16, expDate:"",          expDays:"",  status:"LOW"},
    {id:2,name:"Paracetamol 500mg tabs",   stock:450,wAvg:200,dl:22, expDate:"",          expDays:"",  status:"ADEQUATE"},
    {id:3,name:"Amoxicillin 250mg caps",   stock:80, wAvg:120,dl:5,  expDate:"",          expDays:"",  status:"CRITICAL"},
    {id:4,name:"Amlodipine 5mg tabs",      stock:210,wAvg:70, dl:21, expDate:"2025-09-30",expDays:72,  status:"ADEQUATE"},
    {id:5,name:"Ibuprofen 400mg tabs",     stock:0,  wAvg:90, dl:0,  expDate:"",          expDays:"",  status:"STOCKOUT"},
  ]);
  const [nd, setNd] = useState({name:"",stock:"",wAvg:"",expDate:""});

  const SC = {
    STOCKOUT:{c:C.red,  bg:C.redL,  icon:"🔴",lbl:"STOCKOUT"},
    CRITICAL:{c:C.red,  bg:C.redL,  icon:"🔴",lbl:"CRITICAL"},
    LOW:     {c:C.amber,bg:C.amberL,icon:"🟠",lbl:"LOW STOCK"},
    ADEQUATE:{c:C.gold, bg:C.goldL, icon:"🟡",lbl:"ADEQUATE"},
    GOOD:    {c:C.green,bg:C.greenL,icon:"🟢",lbl:"GOOD"},
  };

  const calcSt = (dl)=> dl<=0?"STOCKOUT":dl<=7?"CRITICAL":dl<=14?"LOW":dl<=30?"ADEQUATE":"GOOD";

  const upd = (id,f,v)=>setDrugs(prev=>prev.map(d=>{
    if(d.id!==id) return d;
    const u={...d,[f]:v};
    if(f==="stock"||f==="wAvg"){
      const s=parseInt(f==="stock"?v:u.stock)||0;
      const w=parseFloat(f==="wAvg"?v:u.wAvg)||0;
      const dl=w>0?Math.round(s/(w/7)):(s>0?999:0);
      u.dl=dl; u.status=calcSt(dl);
    }
    if(f==="expDate"&&v) u.expDays=Math.round((new Date(v)-new Date())/86400000);
    return u;
  }));

  const addDrug = ()=>{
    if(!nd.name) return;
    const s=parseInt(nd.stock)||0,w=parseFloat(nd.wAvg)||0;
    const dl=w>0?Math.round(s/(w/7)):(s>0?999:0);
    const ex=nd.expDate?Math.round((new Date(nd.expDate)-new Date())/86400000):"";
    setDrugs(p=>[...p,{id:Date.now(),name:nd.name,stock:s,wAvg:w,dl,expDate:nd.expDate,expDays:ex,status:calcSt(dl)}]);
    setNd({name:"",stock:"",wAvg:"",expDate:""});
  };

  const alerts  = drugs.filter(d=>["STOCKOUT","CRITICAL","LOW"].includes(d.status)).sort((a,b)=>a.dl-b.dl);
  const expiries= drugs.filter(d=>d.expDays!==""&&d.expDays<=60).sort((a,b)=>a.expDays-b.expDays);
  const movers  = [...drugs].sort((a,b)=>b.wAvg-a.wAvg).slice(0,5);

  return (
    <div>
      <div style={S.hdr}>
        <div style={S.eyebrow}>Stage 1 & 2 — Sunday Evening</div>
        <h1 style={S.h1}>Weekly Report Generator</h1>
        <p style={S.sub}>Enter drug data from your Sheet. The report preview updates live. Screenshot or print to PDF.</p>
      </div>

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Report Details</span></div>
        <div style={S.cbdy}>
          <div style={S.row}>
            <div><label style={S.lbl}>Pharmacy Name</label><input style={S.inp} value={pharmName} onChange={e=>setPharmName(e.target.value)}/></div>
            <div><label style={S.lbl}>Owner / Contact Name</label><input style={S.inp} value={ownerName} onChange={e=>setOwnerName(e.target.value)}/></div>
          </div>
          <div style={{marginTop:10}}>
            <label style={S.lbl}>Report Period</label>
            <input style={{...S.inp,maxWidth:260}} value={period} onChange={e=>setPeriod(e.target.value)}/>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Drug Data — from Your Sheet</span></div>
        <div style={{padding:0}}>
          <table style={S.tbl}>
            <thead><tr>
              <th style={S.th}>Drug</th>
              <th style={{...S.th,textAlign:"right"}}>Stock</th>
              <th style={{...S.th,textAlign:"right"}}>Avg/Wk</th>
              <th style={{...S.th,textAlign:"right"}}>Days</th>
              <th style={S.th}>Expiry Date</th>
              <th style={S.th}>Status</th>
              <th style={S.th}></th>
            </tr></thead>
            <tbody>
              {drugs.map((d,i)=>{
                const sc=SC[d.status]||SC.GOOD;
                return (
                  <tr key={d.id}>
                    <td style={S.td(i%2===1)}>
                      <input style={{...S.inp,fontSize:11,padding:"4px 7px"}} value={d.name} onChange={e=>upd(d.id,"name",e.target.value)}/>
                    </td>
                    <td style={S.td(i%2===1)}>
                      <input style={{...S.inp,maxWidth:62,fontSize:11,padding:"4px 7px",textAlign:"right"}} type="number"
                        value={d.stock} onChange={e=>upd(d.id,"stock",e.target.value)}/>
                    </td>
                    <td style={S.td(i%2===1)}>
                      <input style={{...S.inp,maxWidth:62,fontSize:11,padding:"4px 7px",textAlign:"right"}} type="number"
                        value={d.wAvg} onChange={e=>upd(d.id,"wAvg",e.target.value)}/>
                    </td>
                    <td style={{...S.td(i%2===1),textAlign:"right"}}>
                      <span style={{fontWeight:800,color:sc.c,fontSize:13}}>{d.dl>=999?"–":d.dl}</span>
                    </td>
                    <td style={S.td(i%2===1)}>
                      <input style={{...S.inp,fontSize:11,padding:"4px 7px"}} type="date"
                        value={d.expDate} onChange={e=>upd(d.id,"expDate",e.target.value)}/>
                    </td>
                    <td style={S.td(i%2===1)}>
                      <span style={S.bdg(sc.bg,sc.c)}>{sc.icon} {sc.lbl}</span>
                    </td>
                    <td style={S.td(i%2===1)}>
                      <button style={S.bsm(C.redL,C.red)} onClick={()=>setDrugs(p=>p.filter(x=>x.id!==d.id))}>✕</button>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={7} style={S.td(false)}>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    <input style={{...S.inp,maxWidth:200,fontSize:11,padding:"4px 7px"}} placeholder="Drug name" value={nd.name} onChange={e=>setNd({...nd,name:e.target.value})}/>
                    <input style={{...S.inp,maxWidth:65,fontSize:11,padding:"4px 7px"}} type="number" placeholder="Stock" value={nd.stock} onChange={e=>setNd({...nd,stock:e.target.value})}/>
                    <input style={{...S.inp,maxWidth:65,fontSize:11,padding:"4px 7px"}} type="number" placeholder="Avg/wk" value={nd.wAvg} onChange={e=>setNd({...nd,wAvg:e.target.value})}/>
                    <input style={{...S.inp,maxWidth:130,fontSize:11,padding:"4px 7px"}} type="date" value={nd.expDate} onChange={e=>setNd({...nd,expDate:e.target.value})}/>
                    <button style={S.bsm(C.teal)} onClick={addDrug}>+ Add</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>This Week's Recommendation</span></div>
        <div style={S.cbdy}>
          <label style={S.lbl}>One specific, actionable sentence</label>
          <textarea style={{...S.inp,minHeight:52,resize:"vertical",lineHeight:1.6}} value={rec} onChange={e=>setRec(e.target.value)}/>
        </div>
      </div>

      {/* Live report preview */}
      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>📄 Report Preview</span></div>
        <div style={S.cbdy}>
          <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
            {/* Header */}
            <div style={{background:C.tealD,padding:"18px 20px",color:"#fff"}}>
              <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.2em",color:C.goldM,marginBottom:5}}>⬡ DAWA INTEL — PHARMACY INTELLIGENCE</div>
              <div style={{fontSize:18,fontWeight:700,marginBottom:2}}>{pharmName}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>Weekly Stock Intelligence Report | {period}</div>
              <div style={{display:"flex",gap:18,marginTop:12,flexWrap:"wrap"}}>
                {[
                  {v:alerts.length,    l:"Stock Alerts"},
                  {v:expiries.length,  l:"Expiry Flags"},
                  {v:drugs.length,     l:"Drugs Tracked"},
                  {v:drugs.filter(d=>["GOOD","ADEQUATE"].includes(d.status)).length, l:"Healthy"},
                ].map(x=>(
                  <div key={x.l} style={{textAlign:"center"}}>
                    <div style={{fontSize:20,fontWeight:800,color:C.goldM,lineHeight:1}}>{x.v}</div>
                    <div style={{fontSize:8,color:"rgba(255,255,255,0.45)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{x.l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Body */}
            <div style={{padding:"16px 20px"}}>
              {/* Recommendation */}
              <div style={{background:C.goldL,borderLeft:`4px solid ${C.gold}`,borderRadius:"0 5px 5px 0",padding:"9px 12px",marginBottom:14}}>
                <div style={{fontSize:9,fontWeight:800,color:C.gold,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>This Week's Priority</div>
                <div style={{fontSize:12,color:C.dark}}>{rec}</div>
              </div>
              {/* Stock alerts */}
              {alerts.length>0&&(
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.tealD,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7}}>⚠ Stock Alerts — Action Required</div>
                  <table style={S.tbl}>
                    <thead><tr>
                      <th style={S.th}>Drug</th>
                      <th style={{...S.th,textAlign:"right"}}>Stock</th>
                      <th style={{...S.th,textAlign:"right"}}>Days Left</th>
                      <th style={{...S.th,textAlign:"right"}}>Avg/Wk</th>
                      <th style={S.th}>Status</th>
                    </tr></thead>
                    <tbody>{alerts.map((d,i)=>{
                      const sc=SC[d.status]||SC.GOOD;
                      return (
                        <tr key={d.id}>
                          <td style={{...S.td(i%2===1),fontWeight:600}}>{d.name}</td>
                          <td style={{...S.td(i%2===1),textAlign:"right"}}>{d.stock}</td>
                          <td style={{...S.td(i%2===1),textAlign:"right"}}>
                            <span style={{fontWeight:800,color:sc.c}}>{d.dl<=0?"OUT":d.dl}</span>
                          </td>
                          <td style={{...S.td(i%2===1),textAlign:"right",color:C.muted}}>{d.wAvg}</td>
                          <td style={S.td(i%2===1)}><span style={S.bdg(sc.bg,sc.c)}>{sc.icon} {sc.lbl}</span></td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
              )}
              {/* Expiry */}
              {expiries.length>0&&(
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:9,fontWeight:800,color:C.tealD,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7}}>⏰ Expiry Warnings</div>
                  <table style={S.tbl}>
                    <thead><tr>
                      <th style={S.th}>Drug</th>
                      <th style={S.th}>Expiry Date</th>
                      <th style={{...S.th,textAlign:"right"}}>Days</th>
                      <th style={S.th}>Action</th>
                    </tr></thead>
                    <tbody>{expiries.map((d,i)=>{
                      const isExp=d.expDays<=0;
                      const col=isExp||d.expDays<=30?C.red:C.amber;
                      return (
                        <tr key={d.id}>
                          <td style={{...S.td(i%2===1),fontWeight:600}}>{d.name}</td>
                          <td style={S.td(i%2===1)}>{d.expDate}</td>
                          <td style={{...S.td(i%2===1),textAlign:"right"}}>
                            <span style={{fontWeight:800,color:col}}>{isExp?"EXPIRED":d.expDays}</span>
                          </td>
                          <td style={{...S.td(i%2===1),fontSize:11,color:col}}>
                            {isExp?"Remove immediately":d.expDays<=30?"Prioritise dispensing":"Monitor"}
                          </td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
              )}
              {/* Top movers */}
              <div>
                <div style={{fontSize:9,fontWeight:800,color:C.tealD,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7}}>📈 Top Movers This Week</div>
                <table style={S.tbl}>
                  <thead><tr>
                    <th style={S.th}>#</th>
                    <th style={S.th}>Drug</th>
                    <th style={{...S.th,textAlign:"right"}}>Avg/Wk</th>
                    <th style={{...S.th,textAlign:"right"}}>Days Left</th>
                  </tr></thead>
                  <tbody>{movers.map((d,i)=>(
                    <tr key={d.id}>
                      <td style={S.td(i%2===1)}><strong style={{color:C.teal}}>{i+1}</strong></td>
                      <td style={S.td(i%2===1)}>{d.name}</td>
                      <td style={{...S.td(i%2===1),textAlign:"right",fontWeight:700}}>{d.wAvg||"–"}</td>
                      <td style={{...S.td(i%2===1),textAlign:"right"}}>
                        <span style={{color:(SC[d.status]||{}).c||C.mid,fontWeight:700}}>
                          {d.dl>=999?"–":d.dl}
                        </span>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div style={{borderTop:`1px solid ${C.border}`,marginTop:14,paddingTop:10,
                display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
                <span style={{fontSize:10,color:C.muted}}>Generated by Dawa Intel · {now.toLocaleDateString("en-KE")}</span>
                <span style={{fontSize:10,color:C.muted}}>Confidential — for {ownerName} only</span>
              </div>
            </div>
          </div>
          <div style={{fontSize:11,color:C.muted,marginTop:8}}>
            💡 <strong>To send:</strong> Right-click → Print → Save as PDF, then share on WhatsApp. Or screenshot and send directly.
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 4 — WHATSAPP COMPOSER
// ══════════════════════════════════════════════════════════════
function WhatsAppComposer() {
  const [owner,   setOwner]   = useState("Mary");
  const [alert1,  setAlert1]  = useState("Amoxicillin 250mg caps — 5 days remaining (80 caps). Reorder urgently.");
  const [alert2,  setAlert2]  = useState("Ibuprofen 400mg tabs — STOCKOUT. Contact distributor today.");
  const [mover,   setMover]   = useState("Paracetamol 500mg tabs — 450 tabs, 22 days stock (healthy)");
  const [expiry,  setExpiry]  = useState("Amlodipine 5mg tabs — batch expires 30 Sep 2025 (72 days). Begin prioritising.");
  const [recTxt,  setRecTxt]  = useState("Reorder Amoxicillin and Ibuprofen before Friday. Metformin (16 days) should also go on the order.");
  const [showMvr, setShowMvr] = useState(true);
  const [showExp, setShowExp] = useState(true);
  const [copied,  setCopied]  = useState(false);

  const nextMonday = (()=>{
    const d=new Date(); const day=d.getDay();
    d.setDate(d.getDate()+(day===1?7:(8-day)%7));
    return d.toLocaleDateString("en-KE",{weekday:"long",day:"numeric",month:"long"});
  })();

  const msg = [
    `*⬡ DAWA INTEL — Weekly Stock Alert*`,
    `${owner}'s Pharmacy | ${nextMonday}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🚨 *STOCK ALERTS*`,
    alert1 ? `• ${alert1}` : null,
    alert2 ? `• ${alert2}` : null,
    ``,
    showMvr && mover ? `📈 *TOP MOVER THIS WEEK*\n• ${mover}` : null,
    showExp && expiry ? `\n⏰ *EXPIRY FLAG*\n• ${expiry}` : null,
    ``,
    `💡 *RECOMMENDATION*`,
    recTxt,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `_Dawa Intel — Smart Pharmacy. Smarter Decisions._`,
    `_Questions? Reply here or call [your number]_`,
  ].filter(l=>l!==null).join("\n").replace(/\n{3,}/g,"\n\n").trim();

  const copy = ()=>{
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(msg).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);});
    } else {
      const ta=document.createElement("textarea");ta.value=msg;
      document.body.appendChild(ta);ta.select();document.execCommand("copy");
      document.body.removeChild(ta);setCopied(true);setTimeout(()=>setCopied(false),2500);
    }
  };

  return (
    <div>
      <div style={S.hdr}>
        <div style={S.eyebrow}>Stage 1 — Every Monday 8am</div>
        <h1 style={S.h1}>WhatsApp Message Composer</h1>
        <p style={S.sub}>Fill in from your Sunday Sheet review. The message composes itself. Copy and send before 9am.</p>
      </div>

      <div style={S.note(C.tealL,C.teal)}>
        <div style={{...S.ntit,color:C.teal,fontStyle:"normal"}}>The Monday message IS the product</div>
        <div style={{...S.nbdy,fontStyle:"normal"}}>At Stage 1, this WhatsApp message is what your clients will eventually pay for. It must arrive before 9am every Monday without exception. It must be specific to their stock. It must contain at least one thing they did not already know. Three bullets. One recommendation. Never generic. Never late.</div>
      </div>

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Message Builder</span></div>
        <div style={S.cbdy}>
          <div style={{marginBottom:12}}>
            <label style={S.lbl}>Owner / contact name</label>
            <input style={{...S.inp,maxWidth:200}} value={owner} onChange={e=>setOwner(e.target.value)}/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={S.lbl}>Stock Alert 1 — most urgent</label>
            <input style={S.inp} value={alert1} onChange={e=>setAlert1(e.target.value)} placeholder="Drug — X days remaining (Y units). Action needed."/>
          </div>
          <div style={{marginBottom:12}}>
            <label style={S.lbl}>Stock Alert 2 — second most urgent (leave blank if only one)</label>
            <input style={S.inp} value={alert2} onChange={e=>setAlert2(e.target.value)} placeholder="Drug — STOCKOUT / X days remaining. Reorder suggested."/>
          </div>
          <div style={{display:"flex",gap:16,marginBottom:12,flexWrap:"wrap"}}>
            <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,fontWeight:600}}>
              <input type="checkbox" checked={showMvr} onChange={e=>setShowMvr(e.target.checked)}/> Include top mover
            </label>
            <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,fontWeight:600}}>
              <input type="checkbox" checked={showExp} onChange={e=>setShowExp(e.target.checked)}/> Include expiry flag
            </label>
          </div>
          {showMvr&&(
            <div style={{marginBottom:12}}>
              <label style={S.lbl}>Top mover this week</label>
              <input style={S.inp} value={mover} onChange={e=>setMover(e.target.value)} placeholder="Drug — X units, Y days stock (status)"/>
            </div>
          )}
          {showExp&&(
            <div style={{marginBottom:12}}>
              <label style={S.lbl}>Expiry flag (leave blank if none this week)</label>
              <input style={S.inp} value={expiry} onChange={e=>setExpiry(e.target.value)} placeholder="Drug — batch expires DD Mon YYYY (X days). Action."/>
            </div>
          )}
          <div style={{marginBottom:4}}>
            <label style={S.lbl}>Recommendation — one specific, actionable sentence</label>
            <textarea style={{...S.inp,minHeight:52,resize:"vertical",lineHeight:1.6}} value={recTxt} onChange={e=>setRecTxt(e.target.value)}/>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.chdr}>
          <span style={S.cht}>📱 Message Preview</span>
          <button style={{...S.btn(copied?C.green:C.teal)}} onClick={copy}>
            {copied?"✓ Copied!":"Copy Message"}
          </button>
        </div>
        <div style={{padding:16,background:"#ECE5DD"}}>
          <div style={{maxWidth:380}}>
            <div style={S.waBubble}>{msg}</div>
            <div style={S.waTime}>{new Date().toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit"})} ✓✓</div>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Monday Sending Checklist</span></div>
        <div style={S.cbdy}>
          {[
            ["Sunday 8–10pm: review your Sheet","Open column L (Alert Flag). Every ⚠ ACTION NEEDED and 👁 MONITOR row must appear in Monday's message. Note the top 2 most urgent drugs."],
            ["Verify numbers before you send","Never send a Days Remaining figure you have not double-checked against column F. One wrong number destroys trust faster than anything else."],
            ["Send before 9am Monday","Pharmacy owners order stock early in the week. Your alert must reach them before they have already called their distributor without it."],
            ["Follow up on critical alerts by Tuesday","If you flagged a stockout or < 7 days, send a second WhatsApp Tuesday: 'Did you manage to reorder the [drug]?' This is the difference between a tool and a service."],
            ["Log outcomes in your Evidence File","Did they act on the alert? What was the estimated KES value prevented? Every outcome recorded is a case study for your Stage 2 sales pitch."],
          ].map(([t,d],i)=>(
            <div key={i} style={{display:"flex",gap:10,paddingBottom:11,marginBottom:11,
              borderBottom:i<4?`1px solid ${C.border}`:"none"}}>
              <div style={{width:20,height:20,borderRadius:3,border:`2px solid ${C.tealM}`,flexShrink:0,marginTop:2}}/>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:C.dark,marginBottom:2}}>{t}</div>
                <div style={{fontSize:12,color:C.mid,lineHeight:1.55}}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 5 — STAGE 2 TOOLS
// ══════════════════════════════════════════════════════════════
function Stage2Tools() {
  const [clientName, setClientName] = useState("Mary Wanjiku Pharmacy");
  const [tier,       setTier]       = useState("Standard");
  const [amount,     setAmount]     = useState("3000");
  const [svcMonth,   setSvcMonth]   = useState(()=>new Date().toLocaleDateString("en-KE",{month:"long",year:"numeric"}));
  const [dueDate,    setDueDate]    = useState(()=>{const d=new Date();d.setDate(d.getDate()+7);return d.toLocaleDateString("en-KE");});
  const [invNo,      setInvNo]      = useState("DI-001");
  const [yourName,   setYourName]   = useState("Ezra");
  const [phone,      setPhone]      = useState("07XX XXX XXX");
  const [till,       setTill]       = useState("XXXXXXX");
  const [copied,     setCopied]     = useState({inv:false,pitch:false,onboard:false});

  const cp = (key,text)=>{
    const fn=()=>{ setCopied(p=>({...p,[key]:true})); setTimeout(()=>setCopied(p=>({...p,[key]:false})),2400); };
    if(navigator.clipboard?.writeText){ navigator.clipboard.writeText(text).then(fn); }
    else { const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);fn(); }
  };

  const TIERS = [
    {name:"Starter",  price:"KES 2,000–2,500", desc:"Up to 20 drugs tracked · Monday WhatsApp report · Monthly summary"},
    {name:"Standard", price:"KES 3,000–3,500", desc:"Up to 40 drugs · Monday report + weekly PDF · Monthly review call"},
    {name:"Plus",     price:"KES 4,500–5,500", desc:"Full KEML list · Real-time alerts · Bi-weekly site visit · Quarterly benchmark report"},
  ];

  const invoice = `DAWA INTEL — INVOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice No.   : ${invNo}
Date Issued   : ${new Date().toLocaleDateString("en-KE")}
Due Date      : ${dueDate}

BILL TO:
${clientName}

SERVICE:
Dawa Intel ${tier} Plan — ${svcMonth}
Weekly pharmaceutical stock intelligence reports
Stockout alerts · Expiry warnings · Regional benchmarks

AMOUNT DUE : KES ${parseInt(amount).toLocaleString()}

PAYMENT DETAILS:
M-PESA Till / Paybill : ${till}
Account Reference     : ${invNo}

Send M-PESA confirmation to WhatsApp: ${phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${yourName} · Dawa Intel · dawaintel.co.ke
"Smart Pharmacy. Smarter Decisions."`;

  const pitch = `WARM FOLLOW-UP SALES SCRIPT — Stage 2

CONTEXT: You're calling a pharmacy you approached
during Stage 1 but who didn't pilot with you — or
a new pharmacy introduced by a current client.

OPENING:
"Habari [Name]. This is ${yourName} from Dawa Intel.
[If follow-up:] I stopped by some time back —
you mentioned issues with [specific drug].
[If referral:] [Client name] suggested I call you —
they've been using our service for [X] months."

THE 30-SECOND CASE:
"We track pharmacy stock here in Nakuru and send
a Monday morning WhatsApp alert with the three
things you most need to know about your inventory
that week. One of our clients recently got an alert
before running out of metformin on a Saturday —
they reckon that saved them around KES 12,000 in
sales plus a few patients who might not come back.

The service is KES 3,000 a month.
That's one prevented event paying for the year."

THE ASK:
"Can I show you exactly what they received last
Monday? Five minutes, at your pharmacy, this week.
You decide after."

IF THEY SAY YES → Book the demo visit immediately.
IF THEY SAY "send info" → Send the WhatsApp report
  sample. Follow up in exactly 3 days.
IF THEY SAY NO → Ask: "What would make it worth
  trying for a month?" Learn. Move on. Next.

NEVER discount on the first call.
NEVER pitch more than 30 seconds unprompted.
ALWAYS follow up within the time you committed to.`;

  const onboarding = `STAGE 2 — CLIENT ONBOARDING CHECKLIST
Client : ${clientName}
Tier   : ${tier} — KES ${parseInt(amount).toLocaleString()}/month
Date   : ${new Date().toLocaleDateString("en-KE")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRE-VISIT (day before)
☐ Create their pharmacy tab in your Tracker Sheet
☐ Pre-fill the Google Form link with their pharmacy name
☐ Print or screenshot last week's sample report (another client's)
☐ Ask in advance: what are your top 20 drugs?

DURING VISIT — 90 minutes
☐ Sit with the owner + the staff member who will log daily
☐ Walk through the Form on THEIR phone — let them do it
☐ Enter current stock levels for top 20 drugs (ask them to count)
☐ Enter any known expiry dates for current batches in column I
☐ Show the sample report — explain Monday delivery
☐ Set expectation: first real report in 7 days

PAYMENT
☐ Confirm tier and amount: KES ${parseInt(amount).toLocaleString()}/month
☐ Send invoice ${invNo} via WhatsApp before leaving
☐ Get first month's M-PESA payment same day
   OR set a hard deadline: "By Friday, otherwise I'll need
   to delay your start date"

FIRST WEEK PROTOCOL
☐ Day 1: WhatsApp welcome — confirm Form is working
☐ Day 3: Check their Form responses — any anomalies? Call if so
☐ Day 7: Send first real Monday report (this is what they're paying for)
☐ Day 14: Brief call — any questions, any confusion?
☐ Day 25: Schedule Month 1 Review visit
☐ Day 28: On-site Month 1 Review — show them what the data found.
           Calculate the KES value of any alert they acted on.
           Ask: "Are you happy to continue next month?"`;

  return (
    <div>
      <div style={S.hdr}>
        <div style={S.eyebrow}>Stage 2 — First Paying Clients</div>
        <h1 style={S.h1}>Stage 2 Business Tools</h1>
        <p style={S.sub}>Invoice generator, pricing tiers, sales script, and onboarding checklist. Everything copy-ready.</p>
      </div>

      {/* Pricing tiers */}
      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Pricing Tiers</span></div>
        <div style={S.cbdy}>
          <div style={S.note(C.goldL,C.gold)}>
            <div style={{...S.ntit,color:C.gold,fontStyle:"normal"}}>Lead with the value, not the price</div>
            <div style={{...S.nbdy,fontStyle:"normal"}}>One prevented stockout = KES 8,000–25,000 in saved dispensing revenue. One prevented expiry write-off = KES 5,000–40,000. Your KES 3,000/month subscription pays for itself the first time it works. Always frame it that way — never apologise for the price.</div>
          </div>
          <div style={S.row3}>
            {TIERS.map(t=>(
              <div key={t.name}
                style={{border:`2px solid ${tier===t.name?C.teal:C.border}`,borderRadius:7,padding:12,
                  cursor:"pointer",background:tier===t.name?C.tealL:C.white,transition:"all 0.15s"}}
                onClick={()=>{setTier(t.name);setAmount(t.price.replace(/[^0-9]/g,"").slice(0,4));}}>
                <div style={{fontWeight:800,fontSize:13,color:C.tealD,marginBottom:3}}>{t.name}</div>
                <div style={{fontWeight:700,fontSize:12,color:C.gold,marginBottom:5}}>
                  {t.price}<span style={{fontWeight:400,color:C.muted,fontSize:11}}>/mo</span>
                </div>
                <div style={{fontSize:11,color:C.mid,lineHeight:1.5}}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice generator */}
      <div style={S.card}>
        <div style={S.chdr}><span style={S.cht}>Invoice Generator</span></div>
        <div style={S.cbdy}>
          <div style={{...S.row,marginBottom:10}}>
            <div><label style={S.lbl}>Client name</label><input style={S.inp} value={clientName} onChange={e=>setClientName(e.target.value)}/></div>
            <div><label style={S.lbl}>Invoice number</label><input style={S.inp} value={invNo} onChange={e=>setInvNo(e.target.value)}/></div>
          </div>
          <div style={{...S.row,marginBottom:10}}>
            <div><label style={S.lbl}>Service month</label><input style={S.inp} value={svcMonth} onChange={e=>setSvcMonth(e.target.value)}/></div>
            <div><label style={S.lbl}>Amount (KES)</label><input style={S.inp} type="number" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
          </div>
          <div style={{...S.row,marginBottom:10}}>
            <div><label style={S.lbl}>Due date</label><input style={S.inp} value={dueDate} onChange={e=>setDueDate(e.target.value)}/></div>
            <div><label style={S.lbl}>M-PESA Till / Paybill</label><input style={S.inp} value={till} onChange={e=>setTill(e.target.value)}/></div>
          </div>
          <div style={{...S.row,marginBottom:12}}>
            <div><label style={S.lbl}>Your name</label><input style={S.inp} value={yourName} onChange={e=>setYourName(e.target.value)}/></div>
            <div><label style={S.lbl}>Your WhatsApp number</label><input style={S.inp} value={phone} onChange={e=>setPhone(e.target.value)}/></div>
          </div>
          <div style={S.code}>{invoice}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
            <button style={S.btn(copied.inv?C.green:C.teal)} onClick={()=>cp("inv",invoice)}>
              {copied.inv?"✓ Copied!":"Copy Invoice"}
            </button>
            <span style={{fontSize:11,color:C.muted}}>Send this via WhatsApp — no PDF needed at Stage 2</span>
          </div>
        </div>
      </div>

      {/* Sales script */}
      <div style={S.card}>
        <div style={S.chdr}>
          <span style={S.cht}>Warm Follow-Up Sales Script</span>
          <button style={S.btn(copied.pitch?C.green:C.tealD)} onClick={()=>cp("pitch",pitch)}>
            {copied.pitch?"✓ Copied!":"Copy"}
          </button>
        </div>
        <div style={S.cbdy}><div style={S.code}>{pitch}</div></div>
      </div>

      {/* Onboarding checklist */}
      <div style={S.card}>
        <div style={S.chdr}>
          <span style={S.cht}>Client Onboarding Checklist</span>
          <button style={S.btn(copied.onboard?C.green:C.tealD)} onClick={()=>cp("onboard",onboarding)}>
            {copied.onboard?"✓ Copied!":"Copy"}
          </button>
        </div>
        <div style={S.cbdy}><div style={S.code}>{onboarding}</div></div>
      </div>

      <div style={S.note(C.greenL,C.green)}>
        <div style={{...S.ntit,color:C.green,fontStyle:"normal"}}>Stage 2 Complete When</div>
        <div style={{...S.nbdy,fontStyle:"normal"}}>
          ✅ 5+ clients paying KES 2,000–3,500/month — MRR ≥ KES 10,000<br/>
          ✅ 3+ clients have renewed after month 1 without being asked<br/>
          ✅ 2+ referrals received from existing clients<br/>
          ✅ Evidence File has 3+ documented case studies with KES values<br/>
          ✅ You have a clear view of which drugs are most commonly flagged across all clients — this is your first real dataset<br/><br/>
          <strong>At this point the business model is proven. Stage 3: build the real app using Stage 2 revenue to fund it.</strong>
        </div>
      </div>
    </div>
  );
}
