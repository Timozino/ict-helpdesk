import { useState, useMemo } from "react";

/* ICT Help Desk and Support Ticketing System | React only, mock data */

const H = 36e5;
const NOW = Date.now();
const TECHS = ["Amina Yusuf", "Chidi Okafor", "Tunde Bello", "Zainab Musa"];
const CATS = ["Hardware", "Software", "Network", "Email", "Account Access", "Printer"];
const PRI = ["Low", "Medium", "High", "Critical"];
const STAT = ["Open", "Assigned", "In Progress", "Resolved", "Closed"];
const SLA = { Critical: 4, High: 8, Medium: 24, Low: 72 };
const ME = { Staff: "Grace Eze", Technician: "Chidi Okafor", Admin: "Admin Office" };
const cls = (s) => "s-" + s.replace(" ", "");
const fmt = (t) => new Date(t).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
const hrs = (t) => (t.resolvedAt - t.created) / H;

const mk = (i, title, cat, pri, status, by, tech, ago, res) => ({
  id: "TKT-" + (1000 + i), title, cat, pri, status, by, tech,
  dept: ["Admin", "Academics", "Finance", "Library"][i % 4],
  desc: "Reported issue: " + title.toLowerCase() + ". Please assist as soon as possible.",
  created: NOW - ago * H,
  resolvedAt: res != null ? NOW - ago * H + res * H : null,
  note: res != null ? "Issue diagnosed and fixed. Confirmed working with the user." : "",
  comments: [],
  log: [{ t: NOW - ago * H, x: "Ticket submitted by " + by }],
});

const SEED = [
  mk(1, "Laptop will not boot", "Hardware", "High", "Resolved", "Grace Eze", "Tunde Bello", 96, 6),
  mk(2, "Cannot connect to staff Wi-Fi", "Network", "Critical", "Resolved", "Ibrahim Sani", "Amina Yusuf", 72, 3),
  mk(3, "Request Microsoft Office install", "Software", "Low", "Closed", "Ngozi Obi", "Chidi Okafor", 120, 30),
  mk(4, "Email not syncing on phone", "Email", "Medium", "In Progress", "Grace Eze", "Chidi Okafor", 20, null),
  mk(5, "Printer jam in Admin office", "Printer", "Medium", "Assigned", "Musa Danjuma", "Zainab Musa", 10, null),
  mk(6, "Forgot portal password", "Account Access", "High", "Resolved", "Ngozi Obi", "Amina Yusuf", 50, 2),
  mk(7, "Projector not detected in Lab 2", "Hardware", "High", "Open", "Ibrahim Sani", null, 5, null),
  mk(8, "Network switch down in Block B", "Network", "Critical", "In Progress", "Musa Danjuma", "Tunde Bello", 3, null),
  mk(9, "Antivirus update failing", "Software", "Medium", "Open", "Grace Eze", null, 30, null),
  mk(10, "New staff email account", "Email", "Low", "Resolved", "Ngozi Obi", "Zainab Musa", 80, 20),
  mk(11, "Keyboard keys not working", "Hardware", "Low", "Assigned", "Ibrahim Sani", "Tunde Bello", 8, null),
  mk(12, "Account locked after attempts", "Account Access", "Medium", "Resolved", "Musa Danjuma", "Chidi Okafor", 40, 5),
];

const stats = (list) => {
  const done = list.filter((t) => t.resolvedAt);
  const avg = done.length ? done.reduce((a, t) => a + hrs(t), 0) / done.length : 0;
  const met = done.filter((t) => hrs(t) <= SLA[t.pri]).length;
  return {
    total: list.length,
    open: list.filter((t) => ["Open", "Assigned", "In Progress"].includes(t.status)).length,
    unassigned: list.filter((t) => !t.tech).length,
    done: done.length,
    avg,
    sla: done.length ? Math.round((met / done.length) * 100) : 0,
  };
};

function Bars({ title, keys, list, field }) {
  const max = Math.max(1, ...keys.map((k) => list.filter((t) => t[field] === k).length));
  return (
    <section className="card">
      <h3>{title}</h3>
      {keys.map((k) => {
        const n = list.filter((t) => t[field] === k).length;
        return (
          <div className="bar" key={k}>
            <span>{k}</span>
            <div className="track"><i style={{ width: (n / max) * 100 + "%" }} /></div>
            <b>{n}</b>
          </div>
        );
      })}
    </section>
  );
}

function Kpis({ s }) {
  const items = [
    ["Total tickets", s.total], ["Active", s.open], ["Unassigned", s.unassigned],
    ["Resolved", s.done], ["Avg resolution", s.avg.toFixed(1) + " h"], ["SLA met", s.sla + "%"],
  ];
  return (
    <div className="kpis">
      {items.map(([l, v]) => (
        <div className="kpi" key={l}><small>{l}</small><strong>{v}</strong></div>
      ))}
    </div>
  );
}

function Rows({ list, open }) {
  if (!list.length) return <p className="empty">No tickets match. Change the filters or submit a new ticket.</p>;
  return (
    <div className="table">
      <div className="trow thead">
        <span>Ticket</span><span>Category</span><span>Priority</span><span>Status</span><span>Assigned to</span><span>Created</span>
      </div>
      {list.map((t) => (
        <button className="trow" key={t.id} onClick={() => open(t.id)}>
          <span className="tt"><b>{t.id}</b>{t.title}</span>
          <span data-l="Category">{t.cat}</span>
          <span data-l="Priority"><em className={"b p-" + t.pri}>{t.pri}</em></span>
          <span data-l="Status"><em className={"b " + cls(t.status)}>{t.status}</em></span>
          <span data-l="Assigned">{t.tech || "Unassigned"}</span>
          <span data-l="Created">{fmt(t.created)}</span>
        </button>
      ))}
    </div>
  );
}

function Detail({ t, role, me, update, close }) {
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const admin = role === "Admin";
  const work = admin || (role === "Technician" && t.tech === me);
  const log = (x, patch = {}) => update(t.id, (o) => ({ ...o, ...patch, log: [{ t: Date.now(), x }, ...o.log] }));
  const assign = (n) => n && log("Assigned to " + n + " by " + me, { tech: n, status: t.status === "Open" ? "Assigned" : t.status });
  const resolve = () => {
    if (!note.trim()) return;
    log("Resolved by " + me, { status: "Resolved", resolvedAt: Date.now(), note: note.trim() });
    setNote("");
  };
  const comment = () => {
    if (!msg.trim()) return;
    update(t.id, (o) => ({ ...o, comments: [...o.comments, { t: Date.now(), by: me, x: msg.trim() }] }));
    setMsg("");
  };
  return (
    <div className="overlay" onClick={close}>
      <aside className="modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <small>{t.id} | {t.cat}</small>
            <h2>{t.title}</h2>
          </div>
          <button className="x" onClick={close} aria-label="Close">x</button>
        </header>
        <div className="chips">
          <em className={"b " + cls(t.status)}>{t.status}</em>
          <em className={"b p-" + t.pri}>{t.pri}</em>
          <span className="sla">SLA target {SLA[t.pri]} h</span>
        </div>
        <p className="desc">{t.desc}</p>
        <dl className="meta">
          <div><dt>Requester</dt><dd>{t.by}</dd></div>
          <div><dt>Department</dt><dd>{t.dept}</dd></div>
          <div><dt>Submitted</dt><dd>{fmt(t.created)}</dd></div>
          <div><dt>Technician</dt><dd>{t.tech || "Unassigned"}</dd></div>
          {t.resolvedAt && <div><dt>Resolved in</dt><dd>{hrs(t).toFixed(1)} h</dd></div>}
        </dl>

        {admin && t.status !== "Closed" && (
          <label className="fld">Assign technician
            <select value={t.tech || ""} onChange={(e) => assign(e.target.value)}>
              <option value="">Choose technician</option>
              {TECHS.map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
        )}

        <div className="actions">
          {role === "Technician" && !t.tech && t.status === "Open" && (
            <button className="btn" onClick={() => assign(me)}>Take this ticket</button>
          )}
          {work && t.status === "Assigned" && (
            <button className="btn" onClick={() => log("Work started by " + me, { status: "In Progress" })}>Start work</button>
          )}
          {work && t.status === "In Progress" && (
            <div className="resolve">
              <textarea rows="3" placeholder="Describe how the issue was resolved" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn" disabled={!note.trim()} onClick={resolve}>Mark as resolved</button>
            </div>
          )}
          {t.status === "Resolved" && (role === "Staff" || admin) && (
            <>
              <button className="btn" onClick={() => log("Resolution confirmed and ticket closed by " + me, { status: "Closed" })}>Confirm and close</button>
              <button className="btn ghost" onClick={() => log("Ticket reopened by " + me, { status: t.tech ? "In Progress" : "Open", resolvedAt: null })}>Reopen</button>
            </>
          )}
        </div>

        {t.note && <div className="note"><b>Resolution note</b><p>{t.note}</p></div>}

        <h4>Comments</h4>
        {t.comments.length === 0 && <p className="muted">No comments yet.</p>}
        {t.comments.map((c, i) => (
          <div className="cmt" key={i}><b>{c.by}</b> <small>{fmt(c.t)}</small><p>{c.x}</p></div>
        ))}
        <div className="addc">
          <input placeholder="Write a comment" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && comment()} />
          <button className="btn" onClick={comment}>Post</button>
        </div>

        <h4>Activity</h4>
        <ul className="log">
          {t.log.map((l, i) => <li key={i}><small>{fmt(l.t)}</small>{l.x}</li>)}
        </ul>
      </aside>
    </div>
  );
}

function NewTicket({ me, role, submit }) {
  const blank = { title: "", cat: CATS[0], pri: "Medium", dept: "Admin", by: me, desc: "" };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.desc.trim() || !f.by.trim()) return setErr("Add a title, your name and a description to submit.");
    submit(f);
    setF(blank);
    setErr("");
  };
  return (
    <form className="card form" onSubmit={go}>
      <h3>Submit a support ticket</h3>
      <label className="fld">Requester name<input value={f.by} onChange={set("by")} readOnly={role === "Staff"} /></label>
      <label className="fld">Issue title<input value={f.title} onChange={set("title")} placeholder="Example: Projector not working in Lab 2" /></label>
      <div className="two">
        <label className="fld">Category<select value={f.cat} onChange={set("cat")}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="fld">Priority<select value={f.pri} onChange={set("pri")}>{PRI.map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <label className="fld">Department<select value={f.dept} onChange={set("dept")}>{["Admin", "Academics", "Finance", "Library"].map((c) => <option key={c}>{c}</option>)}</select></label>
      <label className="fld">Description<textarea rows="5" value={f.desc} onChange={set("desc")} placeholder="What happened, where, and since when?" /></label>
      {err && <p className="err">{err}</p>}
      <button className="btn" type="submit">Submit ticket</button>
    </form>
  );
}

export default function App() {
  const [tickets, setTickets] = useState(SEED);
  const [role, setRole] = useState("Admin");
  const [view, setView] = useState("dashboard");
  const [sel, setSel] = useState(null);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [q, setQ] = useState("");
  const [fs, setFs] = useState("All");
  const [fp, setFp] = useState("All");
  const [fc, setFc] = useState("All");
  const me = ME[role];

  const mine = useMemo(() => (role === "Staff" ? tickets.filter((t) => t.by === me) : tickets), [tickets, role, me]);
  const shown = mine.filter((t) =>
    (fs === "All" || t.status === fs) && (fp === "All" || t.pri === fp) && (fc === "All" || t.cat === fc) &&
    (t.title + t.id + t.by).toLowerCase().includes(q.toLowerCase())
  );
  const s = stats(mine);
  const update = (id, fn) => setTickets((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };
  const submit = (f) => {
    const id = "TKT-" + (1000 + tickets.length + 1);
    setTickets([{ ...f, id, status: "Open", tech: null, created: Date.now(), resolvedAt: null, note: "", comments: [],
      log: [{ t: Date.now(), x: "Ticket submitted by " + f.by }] }, ...tickets]);
    flash(id + " submitted");
    setView("tickets");
  };
  const nav = [["dashboard", "Dashboard"], ["tickets", "Tickets"], ["new", "New ticket"], ["reports", "Service reports"]];
  const go = (v) => { setView(v); setMenu(false); };
  const cur = tickets.find((t) => t.id === sel);

  return (
    <div className="app">
      <style>{CSS}</style>
      <aside className={"side" + (menu ? " on" : "")}>
        <div className="brand"><span>IT</span>HelpDesk</div>
        <nav>
          {nav.map(([k, l]) => (
            <button key={k} className={view === k ? "act" : ""} onClick={() => go(k)}>{l}</button>
          ))}
        </nav>
        <label className="role">Signed in as
          <select value={role} onChange={(e) => { setRole(e.target.value); setSel(null); }}>
            {Object.keys(ME).map((r) => <option key={r}>{r}</option>)}
          </select>
          <small>{me}</small>
        </label>
      </aside>
      {menu && <div className="scrim" onClick={() => setMenu(false)} />}

      <main>
        <header className="top">
          <button className="burger" onClick={() => setMenu(true)} aria-label="Open menu">Menu</button>
          <h1>{nav.find((n) => n[0] === view)[1]}</h1>
          <button className="btn" onClick={() => go("new")}>New ticket</button>
        </header>

        {view === "dashboard" && (
          <>
            <Kpis s={s} />
            <div className="grid">
              <Bars title="Tickets by status" keys={STAT} list={mine} field="status" />
              <Bars title="Tickets by priority" keys={PRI} list={mine} field="pri" />
            </div>
            <section className="card">
              <h3>Recent tickets</h3>
              <Rows list={[...mine].sort((a, b) => b.created - a.created).slice(0, 5)} open={setSel} />
            </section>
          </>
        )}

        {view === "tickets" && (
          <>
            <div className="filters">
              <input placeholder="Search by title, ID or requester" value={q} onChange={(e) => setQ(e.target.value)} />
              <select value={fs} onChange={(e) => setFs(e.target.value)}><option>All</option>{STAT.map((x) => <option key={x}>{x}</option>)}</select>
              <select value={fp} onChange={(e) => setFp(e.target.value)}><option>All</option>{PRI.map((x) => <option key={x}>{x}</option>)}</select>
              <select value={fc} onChange={(e) => setFc(e.target.value)}><option>All</option>{CATS.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
            <Rows list={shown} open={setSel} />
          </>
        )}

        {view === "new" && <NewTicket me={me} role={role} submit={submit} />}

        {view === "reports" && (
          <>
            <Kpis s={s} />
            <div className="grid">
              <Bars title="By category" keys={CATS} list={mine} field="cat" />
              <Bars title="By status" keys={STAT} list={mine} field="status" />
              <Bars title="By priority" keys={PRI} list={mine} field="pri" />
            </div>
            <section className="card">
              <h3>Technician performance</h3>
              <div className="scroll">
                <table className="rep">
                  <thead><tr><th>Technician</th><th>Assigned</th><th>Active</th><th>Resolved</th><th>Avg hours</th></tr></thead>
                  <tbody>
                    {TECHS.map((n) => {
                      const l = mine.filter((t) => t.tech === n);
                      const st = stats(l);
                      return <tr key={n}><td>{n}</td><td>{l.length}</td><td>{st.open}</td><td>{st.done}</td><td>{st.avg.toFixed(1)}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <button className="btn ghost noprint" onClick={() => window.print()}>Print report</button>
            </section>
          </>
        )}
      </main>

      {cur && <Detail t={cur} role={role} me={me} update={update} close={() => setSel(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

const CSS = `
*{box-sizing:border-box;margin:0}
.app{--p:#6d28d9;--pd:#4c1d95;--pl:#f3edff;--k:#0d0b14;--g:#6b6880;--ln:#e6e1f2;
font-family:"Segoe UI",system-ui,-apple-system,Roboto,sans-serif;color:var(--k);background:#faf9fd;min-height:100vh;display:flex}
button,input,select,textarea{font:inherit;color:inherit}
.side{width:240px;background:var(--k);color:#fff;padding:22px 16px;display:flex;flex-direction:column;gap:22px;position:sticky;top:0;height:100vh;flex-shrink:0}
.brand{font-weight:700;font-size:1.2rem;display:flex;align-items:center;gap:10px}
.brand span{background:var(--p);padding:6px 8px;border-radius:8px}
.side nav{display:flex;flex-direction:column;gap:6px;flex:1}
.side nav button{background:none;border:0;color:#cfc9e4;text-align:left;padding:11px 12px;border-radius:10px;cursor:pointer}
.side nav button:hover{background:#1c1830}
.side nav .act{background:var(--p);color:#fff}
.role{display:flex;flex-direction:column;gap:6px;font-size:.8rem;color:#b9b3d1}
.role select{background:#1c1830;border:1px solid #2f2950;color:#fff;padding:9px;border-radius:8px}
.role small{color:#fff;font-size:.85rem}
main{flex:1;min-width:0;padding:24px;max-width:1200px;margin:0 auto;width:100%}
.top{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.top h1{flex:1;font-size:1.5rem}
.burger{display:none;background:var(--k);color:#fff;border:0;padding:9px 14px;border-radius:8px}
.btn{background:var(--p);color:#fff;border:0;padding:10px 18px;border-radius:10px;cursor:pointer;font-weight:600}
.btn:hover{background:var(--pd)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn.ghost{background:#fff;color:var(--p);border:1.5px solid var(--p)}
.btn.ghost:hover{background:var(--pl)}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #b79cf2;outline-offset:1px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}
.kpi{background:#fff;border:1px solid var(--ln);border-left:4px solid var(--p);border-radius:12px;padding:14px}
.kpi small{color:var(--g)}
.kpi strong{display:block;font-size:1.7rem;margin-top:4px}
.kpi:nth-child(3){border-left-color:var(--k)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-bottom:16px}
.card{background:#fff;border:1px solid var(--ln);border-radius:14px;padding:18px;margin-bottom:16px}
.card h3{margin-bottom:12px;font-size:1.05rem}
.bar{display:grid;grid-template-columns:110px 1fr 28px;gap:10px;align-items:center;margin:9px 0;font-size:.9rem}
.track{background:var(--pl);height:10px;border-radius:9px;overflow:hidden}
.track i{display:block;height:100%;background:var(--p);border-radius:9px}
.bar b{text-align:right}
.filters{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px;margin-bottom:14px}
input,select,textarea{background:#fff;border:1px solid var(--ln);border-radius:10px;padding:10px 12px;width:100%}
.table{display:flex;flex-direction:column;gap:8px}
.trow{display:grid;grid-template-columns:2.4fr 1fr 1fr 1fr 1.2fr 1.3fr;gap:10px;align-items:center;text-align:left;background:#fff;border:1px solid var(--ln);border-radius:12px;padding:12px 14px;cursor:pointer;width:100%;font-size:.9rem}
.trow:hover{border-color:var(--p)}
.thead{background:var(--k);color:#fff;cursor:default;border-color:var(--k);font-weight:600}
.tt b{display:block;color:var(--p);font-size:.78rem}
.b{font-style:normal;font-size:.76rem;font-weight:600;padding:4px 10px;border-radius:20px;display:inline-block;background:var(--pl);color:var(--pd)}
.s-Open{background:#0d0b14;color:#fff}.s-Assigned{background:#ddd0fb;color:#3b0f94}.s-InProgress{background:#6d28d9;color:#fff}
.s-Resolved{background:#e4f6ea;color:#14633a}.s-Closed{background:#ececf2;color:#54516a}
.p-Low{background:#ececf2;color:#54516a}.p-Medium{background:#ddd0fb;color:#3b0f94}.p-High{background:#6d28d9;color:#fff}.p-Critical{background:#0d0b14;color:#fff}
.empty,.muted{color:var(--g);padding:14px 0}
.form{max-width:640px}
.fld{display:flex;flex-direction:column;gap:6px;font-size:.88rem;font-weight:600;margin-bottom:14px}
.fld input,.fld select,.fld textarea{font-weight:400}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.err{color:#b3261e;margin-bottom:10px}
.overlay{position:fixed;inset:0;background:rgba(13,11,20,.6);display:flex;justify-content:flex-end;z-index:30}
.modal{background:#fff;width:min(560px,100%);height:100%;overflow:auto;padding:22px}
.modal header{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}
.modal h2{font-size:1.25rem}
.modal small{color:var(--g)}
.x{background:var(--k);color:#fff;border:0;border-radius:8px;width:34px;height:34px;cursor:pointer;flex-shrink:0}
.chips{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
.sla{font-size:.8rem;color:var(--g)}
.desc{margin-bottom:14px;line-height:1.5}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.meta div{background:var(--pl);padding:10px;border-radius:10px}
.meta dt{font-size:.75rem;color:var(--g)}.meta dd{font-weight:600;margin:2px 0 0}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}
.resolve{width:100%;display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.note{background:#e4f6ea;border-radius:10px;padding:12px;margin-bottom:14px}
.modal h4{margin:16px 0 8px}
.cmt{background:#faf9fd;border:1px solid var(--ln);border-radius:10px;padding:10px;margin-bottom:8px}
.addc{display:flex;gap:8px}
.log{list-style:none;padding:0;border-left:3px solid var(--p);margin-left:4px}
.log li{padding:0 0 12px 12px;font-size:.88rem}
.log small{display:block}
.scroll{overflow-x:auto;margin-bottom:12px}
.rep{width:100%;border-collapse:collapse;min-width:420px}
.rep th{background:var(--k);color:#fff;text-align:left;padding:10px}
.rep td{padding:10px;border-bottom:1px solid var(--ln)}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--k);color:#fff;padding:12px 20px;border-radius:30px;border:2px solid var(--p);z-index:50}
.scrim{display:none}
@media(max-width:900px){
.side{position:fixed;left:0;top:0;z-index:40;transform:translateX(-100%);transition:transform .25s}
.side.on{transform:none}
.scrim{display:block;position:fixed;inset:0;background:rgba(13,11,20,.55);z-index:35}
.burger{display:block}
main{padding:16px}
.filters{grid-template-columns:1fr 1fr}.filters input{grid-column:1/-1}
.thead{display:none}
.trow{grid-template-columns:1fr 1fr;row-gap:8px}
.trow .tt{grid-column:1/-1;font-weight:600}
.trow [data-l]::before{content:attr(data-l);display:block;font-size:.7rem;color:var(--g)}
}
@media(max-width:480px){
.two,.meta{grid-template-columns:1fr}
.bar{grid-template-columns:84px 1fr 24px}
.top h1{font-size:1.2rem}
.btn{padding:10px 12px}
}
@media(prefers-reduced-motion:reduce){.side{transition:none}}
@media print{.side,.top,.noprint,.burger{display:none!important}.app{display:block}}
`;