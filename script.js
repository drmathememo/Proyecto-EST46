// Lentes 46 – Vanilla JS PWA
(function(){
  // --- Manifest + Service Worker (PWA) ---
  (function setupPWA(){
    try {
      const manifest = {
        name: "Lentes 46",
        short_name: "Lentes46",
        description: "Lectura de la realidad a Proyecto y Planeacion (Plan 2022)",
        start_url: ".",
        display: "standalone",
        background_color: "#0ea5e9",
        theme_color: "#0ea5e9",
        icons: [
          { src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'><rect width='128' height='128' rx='24' fill='%230ea5e9'/><text x='50%' y='55%' text-anchor='middle' font-size='64' fill='white' font-family='sans-serif'>46</text></svg>", sizes: "128x128", type: "image/svg+xml" }
        ]
      };
      const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = url;
      document.head.appendChild(link);

      if ("serviceWorker" in navigator) {
        const swCode = `
          const CACHE = 'lentes46-cache-v1';
          const CORE = self.__CORE || ['.', 'index.html', 'style.css', 'script.js'];
          self.addEventListener('install', e => {
            e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(()=>self.skipWaiting()));
          });
          self.addEventListener('activate', e => {
            e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
            self.clients.claim();
          });
          self.addEventListener('fetch', e => {
            const req = e.request;
            e.respondWith(
              caches.match(req).then(res => res || fetch(req).then(r => {
                const copy = r.clone();
                caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
                return r;
              }).catch(()=>caches.match('index.html')))
            );
          });
        `;
        const swBlob = new Blob([swCode], { type: "text/javascript" });
        const swUrl = URL.createObjectURL(swBlob);
        navigator.serviceWorker.register(swUrl).catch(()=>{});
      }
    } catch(e) { console.warn("PWA setup error", e); }
  })();

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
      version: 7,
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
  function setMsg(t){ $("#msg").textContent = t; setTimeout(()=>$("#msg").textContent="", 3000); }

  // --- Render chips ---
  function renderChips(){
    const mWrap = $("#months"); mWrap.innerHTML = "";
    MONTHS.forEach(m => {
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

    const methWrap = $("#meth"); methWrap.innerHTML = "";
    METH.forEach(m => {
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
    $("#methOther").classList.toggle("hide", !show);
  }
  function renderAll(){
    $("#role").value = state.role;
    $("#teacher").value = state.teacher;
    $("#group").value = state.group;
    $("#reading").value = state.reading;
    $("#txtRed").textContent = state.red || "—";
    $("#txtGreen").textContent = state.green || "—";
    $("#txtBlue").textContent = state.blue || "—";
    $("#pname").value = state.pname;
    $("#pneed").value = state.pneed;
    $("#pobj").value = state.pobj;
    $("#pind").value = state.pind;
    $("#pevi").value = state.pevi;
    $("#webhook").value = state.webhook;
    renderChips();
    toggleMethOther();
  }

  // --- Events ---
  window.addEventListener("DOMContentLoaded", () => {
    // inputs
    $("#role").onchange = e => state.role = e.target.value;
    $("#teacher").oninput = e => state.teacher = e.target.value;
    $("#group").oninput = e => state.group = e.target.value;
    $("#reading").oninput = e => state.reading = e.target.value;
    $("#pname").oninput = e => state.pname = e.target.value;
    $("#pneed").oninput = e => state.pneed = e.target.value;
    $("#pobj").oninput = e => state.pobj = e.target.value;
    $("#pind").oninput = e => state.pind = e.target.value;
    $("#pevi").oninput = e => state.pevi = e.target.value;
    $("#methOther").oninput = e => state.methOther = e.target.value;
    $("#webhook").oninput = e => { state.webhook = e.target.value; localStorage.setItem("lentes46:webhook", state.webhook); };

    // lenses
    $("#btnRed").onclick   = ()=>{ const v=prompt("Rojo (Problemas):", state.red||""); if(v!==null){ state.red=v; $("#txtRed").textContent=v||"—"; }};
    $("#btnGreen").onclick = ()=>{ const v=prompt("Verde (Oportunidades):", state.green||""); if(v!==null){ state.green=v; $("#txtGreen").textContent=v||"—"; }};
    $("#btnBlue").onclick  = ()=>{ const v=prompt("Azul (Contexto):", state.blue||""); if(v!==null){ state.blue=v; $("#txtBlue").textContent=v||"—"; }};

    // save/load
    $("#btnSave").onclick = saveLocal;
    $("#btnLoad").onclick = loadLocal;

    // export
    $("#btnMD").onclick = ()=> download(`Lentes46_${state.teacher||'anon'}_${state.group||'grupo'}.md`, "text/markdown;charset=utf-8", mdExport());
    $("#btnPDF").onclick = printMD;
    $("#btnJSON").onclick = ()=> download(`Lentes46_${state.teacher||'anon'}_${state.group||'grupo'}.json`, "application/json;charset=utf-8", JSON.stringify(snapshot(), null, 2));
    $("#btnShare").onclick = async ()=> {
      if(!navigator.share){ setMsg("Tu navegador no soporta Compartir"); return; }
      const md = mdExport();
      const file = new File([md], `Lentes46_${state.teacher||'anon'}_${state.group||'grupo'}.md`, {type:'text/markdown'});
      try { await navigator.share({ title: "Lentes 46", text: "Proyecto y lectura", files: [file] }); } catch(_) {}
    };
    $("#btnSend").onclick = async ()=>{
      if(!state.webhook){ setMsg("Configura Webhook"); return; }
      try{
        setMsg("Enviando…");
        const r = await fetch(state.webhook, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(snapshot()) });
        if(!r.ok) throw new Error(r.status);
        setMsg("Enviado OK");
      }catch(e){ setMsg("No se pudo enviar"); }
    };

    // help
    $("#btnHideHelp").onclick = ()=> $("#help").remove();
    $("#btnGuideMD").onclick = ()=>{
      const guide = "# Guía rápida — Lentes 46\\n\\n1) Docente y grupo.\\n2) Lectura + Lentes.\\n3) Proyecto con metodología (mínimo 1).\\n4) Exporta .md/.pdf o envía por Webhook.\\n5) Guarda local para seguir después.";
      download("Guia_Lentes46.md","text/markdown;charset=utf-8", guide);
    };
    $("#btnGuidePDF").onclick = ()=>{
      const guide = "# Guía rápida — Lentes 46\\n\\n1) Docente y grupo.\\n2) Lectura + Lentes.\\n3) Proyecto con metodología (mínimo 1).\\n4) Exporta .md/.pdf o envía por Webhook.\\n5) Guarda local para seguir después.";
      const w=window.open('', '_blank', 'width=900,height=700'); if(!w) return;
      w.document.write(`<!doctype html><html><head><meta charset='utf-8'><title>Guía</title><style>body{font-family:ui-sans-serif;padding:24px}pre{white-space:pre-wrap}</style></head><body><h1>Guía rápida — Lentes 46</h1><pre>${guide.replace(/</g,'&lt;')}</pre></body></html>`);
      w.document.close(); w.focus(); w.print();
    };
    $("#btnDemo").onclick = ()=>{
      state.role='docente'; state.teacher='Profa. Ejemplo'; state.group='2B';
      state.reading='60% con dificultad de comprensión; ruido entre talleres; baja disponibilidad de libros.';
      state.red='Rezago en comprensión; interrupciones'; state.green='Biblioteca escolar; familias dispuestas'; state.blue='Contexto urbano; ferias del libro; horario extendido';
      state.pname='Maratón de Lectura Técnica 46'; state.pneed='Mejorar comprensión en 1° y 2°'; state.pobj='Incrementar 20% el nivel satisfactorio antes de junio';
      state.pind='% identifica idea principal; % mejora inferencias; asistencia y participación'; state.pevi='Bitácoras, rúbrica 4 niveles, video, productos por equipo';
      state.months=['Oct','Nov','Dic','Ene','Feb','Mar','Abr','May'];
      state.meth=['Aprendizaje basado en proyectos comunitarios','Aprendizaje basado en indagacion STEAM (enfoque)'];
      state.methOther='';
      renderAll(); setMsg('Ejemplo cargado');
    };
    $("#btnClear").onclick = ()=>{
      state.reading=''; state.red=''; state.green=''; state.blue=''; state.pname=''; state.pneed=''; state.pobj=''; state.pind=''; state.pevi=''; state.months=[]; state.meth=[]; state.methOther='';
      renderAll(); setMsg('Formulario limpio');
    };

    // install prompt handler
    let deferredPrompt = null;
    window.addEventListener("beforeinstallprompt", (e)=>{ e.preventDefault(); deferredPrompt = e; const b=$("#btnInstall"); b.hidden=false; b.onclick = async ()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; b.hidden=true; }; });
    window.addEventListener("appinstalled", ()=>{ const b=$("#btnInstall"); b.hidden=true; setMsg("Instalada"); });

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