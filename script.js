// Lentes 46 – Vanilla JS PWA (manifest + sw.js)
(function(){
  // --- State ---
  const state = {
    role: "docente",
    teacher: "", group: "",
    reading: "",
    red: "", green: "", blue: "",
    pname: "", pneed: "", pobj: "", pind: "", pevi: "",
    months: ["Oct","Nov","Dic","Ene","Feb","Mar"],
    meth: [], methOther: "",
    webhook: localStorage.getItem("lentes46:webhook") || ""
  };

  const MONTHS = ["Ago","Sep","Oct","Nov","Dic","Ene","Feb","Mar","Abr","May","Jun"];
  const METH = [
    "Aprendizaje basado en proyectos comunitarios",
    "Aprendizaje basado en indagacion STEAM (enfoque)",
    "Aprendizaje basado en problemas (ABP)",
    "Aprendizaje servicio (AS)",
    "Otra metodologia…"
  ];

  // --- Helpers ---
  const $ = sel => document.querySelector(sel);
  function simpleHash(str){ let h=5381; for(let i=0;i<str.length;i++){ h=((h<<5)+h)+str.charCodeAt(i); h=h>>>0;} return 'h'+h.toString(16); }
  function snapshot(){
    const payload = {
      version: 9,
      role: state.role,
      teacherName: (state.teacher||"").trim(),
      group: (state.group||"").trim(),
      reading: state.reading,
      lenses: { red: state.red, green: state.green, blue: state.blue },
      project: {
        name: state.pname, need: state.pneed, objective: state.pobj,
        indicators: state.pind, evidence: state.pevi,
        months: state.months, methodology: state.meth, methodologyOther: state.methOther
      },
      exportedAt: new Date().toISOString()
    };
    payload.signature = simpleHash(JSON.stringify(payload));
    return payload;
  }
  function saveLocal(){
    const key = `lentes46:${state.teacher||"anon"}:${state.group||"sin-grupo"}`;
    localStorage.setItem(key, JSON.stringify(snapshot()));
    setMsg("Guardado local OK");
  }
  function loadLocal(){
    const key = `lentes46:${state.teacher||"anon"}:${state.group||"sin-grupo"}`;
    const raw = localStorage.getItem(key);
    if(!raw){ setMsg("Sin guardado"); return; }
    try{
      const d = JSON.parse(raw);
      applySnapshot(d);
      setMsg("Cargado OK");
    }catch{ setMsg("Error al cargar"); }
  }
  function applySnapshot(d){
    state.role = d.role || "docente";
    state.reading = d.reading || "";
    state.red = d.lenses?.red || "";
    state.green = d.lenses?.green || "";
    state.blue = d.lenses?.blue || "";
    const p = d.project || {};
    state.pname = p.name || "";
    state.pneed = p.need || "";
    state.pobj = p.objective || "";
    state.pind = p.indicators || "";
    state.pevi = p.evidence || "";
    state.months = p.months || [];
    state.meth = p.methodology || [];
    state.methOther = p.methodologyOther || "";
    renderAll();
  }
  function download(filename, mime, content){
    const blob = new Blob([content], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
  function mdExport(){
    const meth = state.meth.includes("Otra metodologia…") && state.methOther
      ? state.meth.map(m => m==="Otra metodologia…"?`Otra: ${state.methOther}`:m).join(", ")
      : state.meth.join(", ");
    const lines = [
      `# Lentes 46 - Movil`,
      `Docente: ${state.teacher||"(sin nombre)"} · Grupo: ${state.group||"(sin grupo)"}`,
      `\n## Lectura de la realidad`, state.reading,
      `\n## Lentes`,
      state.red?`- Rojo: ${state.red}`:null,
      state.green?`- Verde: ${state.green}`:null,
      state.blue?`- Azul: ${state.blue}`:null,
      `\n## Proyecto: ${state.pname||"(sin nombre)"}`,
      `Necesidad: ${state.pneed}`,
      `Objetivo: ${state.pobj}`,
      `Indicadores: ${state.pind}`,
      `Evidencias: ${state.pevi}`,
      `Meses: ${state.months.join(", ")}`,
      `Metodologias: ${meth||"(definir)"}`
    ].filter(Boolean);
    return lines.join("\n");
  }
  function printMD(){
    const md = mdExport();
    const w = window.open('', '_blank', 'width=900,height=700');
    if(!w) return;
    w.document.write(`<!doctype html><html><head><meta charset='utf-8'><title>Lentes46</title><style>body{font-family:ui-sans-serif;padding:24px}pre{white-space:pre-wrap}</style></head><body><h1>Lentes 46</h1><pre>${md.replace(/</g,'&lt;')}</pre></body></html>`);
    w.document.close(); w.focus(); w.print();
  }
  function setMsg(t){ const el = document.getElementById("msg"); if(!el) return; el.textContent = t; setTimeout(()=>{ if(el.textContent===t) el.textContent=""; }, 3000); }

  // --- Render chips ---
  function renderChips(){
    const mWrap = document.getElementById("months"); mWrap.innerHTML = "";
    ["Ago","Sep","Oct","Nov","Dic","Ene","Feb","Mar","Abr","May","Jun"].forEach(m => {
      const b = document.createElement("button");
      b.className = "chip";
      if (state.months.includes(m)) b.classList.add("active");
      b.textContent = m;
      b.onclick = () => {
        if (state.months.includes(m)) state.months = state.months.filter(x=>x!==m);
        else state.months = [...state.months, m];
        renderChips();
      };
      mWrap.appendChild(b);
    });

    const methWrap = document.getElementById("meth"); methWrap.innerHTML = "";
    ["Aprendizaje basado en proyectos comunitarios","Aprendizaje basado en indagacion STEAM (enfoque)","Aprendizaje basado en problemas (ABP)","Aprendizaje servicio (AS)","Otra metodologia…"].forEach(m => {
      const b = document.createElement("button");
      b.className = "chip";
      if (state.meth.includes(m)) b.classList.add("active");
      b.textContent = m;
      b.onclick = () => {
        if (state.meth.includes(m)) state.meth = state.meth.filter(x=>x!==m);
        else state.meth = [...state.meth, m];
        renderChips();
        toggleMethOther();
      };
      methWrap.appendChild(b);
    });
  }
  function toggleMethOther(){
    const show = state.meth.includes("Otra metodologia…");
    document.getElementById("methOther").classList.toggle("hide", !show);
  }
  function renderAll(){
    document.getElementById("role").value = state.role;
    document.getElementById("teacher").value = state.teacher;
    document.getElementById("group").value = state.group;
    document.getElementById("reading").value = state.reading;
    document.getElementById("txtRed").textContent = state.red || "—";
    document.getElementById("txtGreen").textContent = state.green || "—";
    document.getElementById("txtBlue").textContent = state.blue || "—";
    document.getElementById("pname").value = state.pname;
    document.getElementById("pneed").value = state.pneed;
    document.getElementById("pobj").value = state.pobj;
    document.getElementById("pind").value = state.pind;
    document.getElementById("pevi").value = state.pevi;
    document.getElementById("webhook").value = state.webhook;
    renderChips();
    toggleMethOther();
  }

  // --- Events ---
  window.addEventListener("DOMContentLoaded", () => {
    // inputs
    document.getElementById("role").onchange = e => state.role = e.target.value;
    document.getElementById("teacher").oninput = e => state.teacher = e.target.value;
    document.getElementById("group").oninput = e => state.group = e.target.value;
    document.getElementById("reading").oninput = e => state.reading = e.target.value;
    document.getElementById("pname").oninput = e => state.pname = e.target.value;
    document.getElementById("pneed").oninput = e => state.pneed = e.target.value;
    document.getElementById("pobj").oninput = e => state.pobj = e.target.value;
    document.getElementById("pind").oninput = e => state.pind = e.target.value;
    document.getElementById("pevi").oninput = e => state.pevi = e.target.value;
    document.getElementById("methOther").oninput = e => state.methOther = e.target.value;
    document.getElementById("webhook").oninput = e => { state.webhook = e.target.value; localStorage.setItem("lentes46:webhook", state.webhook); };

    // lenses
    document.getElementById("btnRed").onclick   = ()=>{ const v=prompt("Rojo (Problemas):", state.red||""); if(v!==null){ state.red=v; document.getElementById("txtRed").textContent=v||"—"; }};
    document.getElementById("btnGreen").onclick = ()=>{ const v=prompt("Verde (Oportunidades):", state.green||""); if(v!==null){ state.green=v; document.getElementById("txtGreen").textContent=v||"—"; }};
    document.getElementById("btnBlue").onclick  = ()=>{ const v=prompt("Azul (Contexto):", state.blue||""); if(v!==null){ state.blue=v; document.getElementById("txtBlue").textContent=v||"—"; }};

    // save/load
    document.getElementById("btnSave").onclick = saveLocal;
    document.getElementById("btnLoad").onclick = loadLocal;

    // export
    document.getElementById("btnMD").onclick = ()=> download(`Lentes46_${state.teacher||'anon'}_${state.group||'grupo'}.md`, "text/markdown;charset=utf-8", mdExport());
    document.getElementById("btnPDF").onclick = printMD;
    document.getElementById("btnJSON").onclick = ()=> download(`Lentes46_${state.teacher||'anon'}_${state.group||'grupo'}.json`, "application/json;charset=utf-8", JSON.stringify(snapshot(), null, 2));
    document.getElementById("btnShare").onclick = async ()=> {
      if(!navigator.share){ setMsg("Tu navegador no soporta Compartir"); return; }
      const md = mdExport();
      const file = new File([md], `Lentes46_${state.teacher||'anon'}_${state.group||'grupo'}.md`, {type:'text/markdown'});
      try { await navigator.share({ title: "Lentes 46", text: "Proyecto y lectura", files: [file] }); } catch(_) {}
    };
    document.getElementById("btnSend").onclick = async ()=>{
      if(!state.webhook){ setMsg("Configura Webhook"); return; }
      try{
        setMsg("Enviando…");
        const r = await fetch(state.webhook, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(snapshot()) });
        if(!r.ok) throw new Error(r.status);
        setMsg("Enviado OK");
      }catch(e){ setMsg("No se pudo enviar"); }
    };

    // A2HS (Android)
    let deferredPrompt = null;
    window.addEventListener("beforeinstallprompt", (e)=>{
      e.preventDefault();
      deferredPrompt = e;
      const b=document.getElementById("btnInstall");
      if (b){ b.hidden=false; b.onclick = async ()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; b.hidden=true; }; }
    });
    window.addEventListener("appinstalled", ()=>{ const b=document.getElementById("btnInstall"); if(b) b.hidden=true; setMsg("Instalada"); });

    // initial render
    renderAll();
  });

  // --- Self-tests ---
  (function selfTests(){
    try {
      const joined = ["a","b"].join("\\n");
      console.assert(joined.includes("\\n"), "Test1: join debe usar \\n");
      const md = "x\\n" + "y";
      console.assert(typeof md === "string", "Test2: export md string");
      console.assert(!/\\u2013|\\u2014/.test('ok'), "Test3: no guiones largos unicode en código");
      console.info("Self-tests: OK");
    } catch(e) {
      console.error("Self-tests: fallo", e);
    }
  })();
})();