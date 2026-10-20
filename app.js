(function(){
/* Fase 10 · Cuarto camino: interruptor de "Tu propia historia". Fase 11 · Brief 01: apagado. La demo es solo Sonia y el paso 1
   (elegir historia) ya no existe; esPropia() y sus ramas se quedan. Si se vuelve a encender, necesita otra entrada */
var DEMO_PROPIA = false;
/* ============================================================
   REFERENCIAS
   ============================================================ */
var screens = [].slice.call(document.querySelectorAll('.screen'));
var byId = {}; screens.forEach(function(s){ byId[s.id]=s; });
var hdrGlobal=document.getElementById('hdrGlobal'), hdrHilo=document.getElementById('hdrHilo'),
    hiloStack=document.getElementById('hiloStack'), hiloTitle=document.getElementById('hiloTitle'),
    hiloSub=document.getElementById('hiloSub'), hiloAv=document.getElementById('hiloAv'),
    hiloConfirmBadge=document.getElementById('hiloConfirmBadge'),
    scrTitle=document.getElementById('scrTitle'), tTitle=document.getElementById('tTitle'),
    tSub=document.getElementById('tSub'),
    /* Fase Móvil · header fijo de la mascota de Inicio (2.2), alterna con stRow en show() */
    stRow=document.getElementById('stRow'), mascotHd=document.getElementById('mascotHd'), mascotGreet=document.getElementById('mascotGreet'), mascotWrap=document.querySelector('#mascotHd .mascot-wrap'), /* Fase 10 · Brief 04 */
    composer=document.getElementById('composer'),
    chips=document.getElementById('chips'), chatInput=document.getElementById('chatInput'),
    micBtn=document.getElementById('micBtn'), editBar=document.getElementById('editBar'),
    fab=document.getElementById('fab'), nav=document.getElementById('nav'), content=document.getElementById('content'),
    TH=document.getElementById('TH'), A1=document.getElementById('A1'), /* Fase 11 · Brief 04 (B): sale H1 (Procesos en curso) */
    topMenu=document.getElementById('topMenu'), topBack=document.getElementById('topBack'), stBack=document.getElementById('stBack'),
    scrimExit=document.getElementById('scrimExit'), exitTitle=document.getElementById('exitTitle'),
    exitBody=document.getElementById('exitBody'), exitNeutralBtn=document.getElementById('exitNeutralBtn'),
    exitDangerBtn=document.getElementById('exitDangerBtn');
/* Fase 8 · quitadas pKey/pTitle/pNote: eran la caja de notas de diseño del panel, ya retirada de index.html */

var timers=[], lastMain='A1', cur='A1', curThread=null, pendingToast=null, pendingToastKey=null, undoSnap=null, detNoReset=false;
/* Fase 8 · Brief 6.1: toast sin botón "Deshacer", para acciones que no se pueden deshacer */
var pendingNote=null;
/* Fase 6 · #19: trámite recién agendado, se resalta una vez en Inicio antes de quedar solo en «En curso» (Fase 11 · Brief 04: ya no hay Procesos en curso) */
var freshConfirmKey=null;
/* Fase 6 · Brief 3: de dónde se entró a PROC (CAM/GAL/BACKMAIN), para que el atrás de DET vuelva a la puerta real de entrada */
var procFrom=null;
/* Fase 6 · H05: selección a medio hacer, sobrevive al salir del hilo */
var DRAFTS={};
/* Fase 6 · H04: qué cita se tocó en el Calendario, para que F2 sepa cuál mostrar */
var calSelKey='ped';
/* Fase 6 · avatares elegibles: ícono por persona (blanco + anillo de su color), en vez de iniciales */
var PICON={}, ANIMALS=['🦝','🦊','🐱','🐶','🐼','🐨','🦁','🐧','🦉','🐰'], iconPickKey=null; /* Fase 10 · Rediseño · Brief 12: el ícono ya no se edita desde el filtro "Ver" */
/* Fase 6 · Editar/eliminar perfil (I3): i3Key es a quién se está viendo (antes I3 siempre mostraba a Mateo,
   sin importar a quién se tocara en Familia). PROFILE_EDITS guarda la edición por código de persona
   (SO/MT/SF/MA), de sesión (se pierde con "Reiniciar demo"). Fase 8 · Estructura 1: propagateI3Edit() la
   refleja también en V/PNAME/INIT al guardar, así que sí se ve en el resto de la app. */
var i3Key=null, i3Editing=false, i3Edit=null, i3EditOrig=null, PROFILE_EDITS={};
/* Fase 10 · Rediseño · Brief 13b: fechas de nacimiento escritas en "Tú y tu familia" para quien la historia no trae
   (todas menos {p2}, que usa V.nac2raw). Crudas en dd/mm/aaaa; las leen i3DateRow() e i3EnterEdit(). El reinicio las limpia */
var OB_NAC={};
var OB_APROX={}; /* Fase 10 · Brief 18: edad aproximada escrita en el paso 3 ("No sé la fecha exacta"), en años, por persona */
var MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function fechaLarga(raw){ var m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw||''); return m ? (+m[1])+' de '+MESES[+m[2]-1]+' de '+m[3] : ''; }
/* Fase 10 · Rediseño · Brief 13b (corrección): la edad junto a la relación ("Hijo · 8 años") sale de la fecha de nacimiento
   cuando la hay (perfil editado, V.nac2raw de {p2} o OB_NAC), con obEdad() y el "hoy" del prototipo (HOY_SIM).
   Sin fecha, se queda la edad de la historia. La usan obPersonaEscribe e i3Subtitle (Fase 11 · Brief 02: ya no detConfirmar ni detEvid) */
function nacDe(k){
  var e=PROFILE_EDITS[k], raw = (e && e.nac) ? e.nac : (k==='MT' ? V.nac2raw : OB_NAC[k]);
  return raw && fechaValida(raw).ok ? raw : '';
}
function esEdad(s){ return /^\d+ (años?|mes(es)?)( aprox\.)?$/.test((s||'').trim()); }
/* Fase 11 · Brief 04b (A): r puede ser "relación · edad" o solo la edad (la relación es opcional) */
function relDeStr(s){ var w=(s||'').split(' · '); return w.length>1 ? w[0] : (esEdad(s) ? '' : (s||'')); }
function restoDeStr(s){ var w=(s||'').split(' · '); return w.length>1 ? w.slice(1).join(' · ') : (esEdad(s) ? s : ''); }
function edadHistoria(k){ var s=restoDeStr(PROFILES[PROF].v['r'+({SF:1,MT:2,MA:3})[k]]); return esEdad(s) ? s : ''; }
function edadDe(k){
  k=detSlot(k); /* lógica genérica de hide:['SF']: {p1} y {p2} serían la misma persona (con Sonia no se activa) */
  var e=PROFILE_EDITS[k];
  if(e && e.approx && e.edadAprox) return e.edadAprox+' años aprox.';
  if(!(e && e.nac) && OB_APROX[k]) return OB_APROX[k]+' años aprox.'; /* Fase 10 · Brief 18 */
  var n=nacDe(k); return n ? obEdad(n) : edadHistoria(k);
}
/* "relación · edad"; sin edad, "relación · resto" (como lo trae la historia) */
function relEdad(k, rel, resto){ var e=edadDe(k); return [rel, e || resto].filter(Boolean).join(' · '); } /* Fase 11 · Brief 04b (A) */ /* sin relación, solo la edad */

/* Fase 10 · Ajuste: si se sale del hilo mientras play() sigue en curso, lo que faltaba se guarda de una vez
   en el hilo (antes se perdía, y con ello los chips "Simular:" para seguir la demo) */
var PLAYS=[];
function clearTimers(){
  timers.forEach(clearTimeout); timers=[];
  var q=PLAYS; PLAYS=[];
  q.forEach(function(p){ if(p.ty) p.ty.remove(); while(p.i<p.list.length) commit(p.key, p.list[p.i++]); p.done(); });
}
function T(fn,ms){ var id=setTimeout(fn,ms); timers.push(id); return id; }
/* Fase 10 · Brief 01b: #app ahora tiene alto fijo, así que el único que se desplaza es .content (ya no la página).
   instant=true salta sin animación (al abrir el hilo, para que se vea el último mensaje). */
function down(instant){
  content.scrollTo({top:content.scrollHeight, behavior: instant ? 'instant' : 'smooth'});
}

/* ============================================================
   ÍCONOS
   ============================================================ */
var WARN='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>';
/* Fase 6 · portada de la Bóveda: un ícono simple por carpeta, mismo trazo 2 y linecap/linejoin round en las cuatro */
var CLIP_IC='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/></svg>';
var TUBE_IC='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6"/><path d="M10 2v13a2 2 0 0 0 4 0V2"/><path d="M10 12h4"/></svg>';
var PILL_IC='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(45 12 12)"/><line x1="8.5" y1="15.5" x2="15.5" y2="8.5"/></svg>';
var FOLDER_IC='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';

/* ============================================================
   TARJETAS / CICLO DE VIDA
   ============================================================ */

/* ============================================================
   PERFILES DE DATOS
   La interfaz, la navegación y los componentes son idénticos en los tres.
   Lo único que cambia son los datos: la variable independiente es la persona.
   ============================================================ */
/* Fase 8 · quitado el campo note de cada perfil: era la reseña de protopersona del panel, ya no se renderiza */
/* Fase Móvil · colores por rol: 2ª persona (SF) de rosado a naranja, 3ª persona (MT/MA según el perfil) de verde a azul; dueña (SO) y 4º slot gris sin cambio — mismos hex en los tres perfiles, verificados AA */
/* Fase Móvil · ajuste 2: tonos más claros (acercándose al mockup de referencia); dark/-av (avatar, texto blanco) topaba con el piso de AA 4.5:1 */
/* Fase Móvil · ajuste 3 (histórico, superado por el ajuste 8): tonos exploratorios más claros, dark/-av había quedado por debajo de AA 4.5:1 a propósito. Ver ajuste 8 más abajo — ya no aplica, se deja la nota por el registro. */
/* Fase Móvil · ajuste 5: dueña de cuenta (SO) de morado a aguamarina #0FC2B2, con #0B7A70 para el avatar — este par sí pasa AA (≈9.1:1/≈5.2:1) */
/* Fase Móvil · ajuste 8: azul con hex exacto pedido (#198BE9) para col; -av derivado más oscuro (#1670C4, ≈5.1:1 con blanco) para pasar AA */
/* Fase Móvil · ajuste 9: el naranja del ajuste 8 (#9A6110 en el avatar) se leía "ocre" — se cambian los roles: #E49217 (el hex exacto que pidió Lida) pasa al avatar (dark/-av), y col se aclara a #EDB868 para el naranja de la franja. El avatar queda por debajo de AA a propósito (≈2.5:1) — pedido explícito, ver Handoff. */
var PROFILES = {
  sonia:{
    label:'Sonia · carga doméstica',
    /* Fase 11 · Brief 01: sale intro (solo la usaba el paso 1, elegir historia) */
    v:{
      u:'Sonia', ru:'Tú', ape:'Pardo', fu:'Sonia Pardo Ruiz', f1:'Sofía Gómez Pardo', f2:'Mateo Gómez Pardo', f3:'Marta Ruiz Castaño', /* Fase 10 · Brief 19: nombres completos, solo para lo que se lee de un documento */ eps:'Compensar', tel:'307 7022', nac2:'4 de marzo de 2018', nac2raw:'04/03/2018',
      p1:'Sofía', r1:'11 meses', i1:'SF', /* Fase 11 · Brief 04b (A): la historia arranca sin relación; r = "relación · edad" solo si la persona la agrega */
      p2:'Mateo', r2:'8 años',   i2:'MT',
      p3:'Marta', r3:'65 años', /* Fase 11 · Brief 01 */ i3:'MA', iu:'SO',
      t1:'Control pediátrico', t1l:'control pediátrico',
      /* Fase 10 · Brief 03: pista de "Para quién" en Pegar texto */
      pistaPeg:'Por ser pediatría, ¿es de {p2} o de {p1}?', pegCand:['MT','SF'], /* Fase 10 · Brief 47b: las personas que nombra la pista */
      t2:'Cirugía de cataratas', t2x:'cirugía de cataratas', /* Fase 11 · Brief 01b */
      t3:'Losartán 50mg', t3n:'Losartán',
      lab:'Perfil lipídico', labl:'perfil lipídico',
      /* Fase 10 · Brief 02: valores del visor del resultado de {lab} (examen|valor|hi = fuera de rango, separados por ;) */
      labv:'Colesterol total|168 mg/dL;Triglicéridos|142 mg/dL|hi;HDL|52 mg/dL;LDL|98 mg/dL', labn:'Triglicéridos por encima del rango esperado.',
      tv:'Terapias de lenguaje', tvl:'terapias de lenguaje',
      /* Fase 10 · Brief 06: trámite que nace de "Me dieron órdenes nuevas" en ped; sigd = desde cuándo se puede agendar */
      tsig:'Vacuna de los 12 meses', tsigl:'vacuna de los 12 meses', sigd:'24 de noviembre', /* Fase 11 · Brief 01b */
      docm:'Dra. Alejandra Mendoza', docms:'Dra. Mendoza', doc1:'Dra. Paula López',
      doc2:'Dr. Andrés Gil', doc3:'Dr. Ramírez', docv:'Dr. Camilo Vargas', /* Fase 11 · Brief 01b */ docu:'Dr. De las Salas',
      sede1:'Compensar Centro', sede2:'Compensar Calle 127', dir1:'Cra 13 #52-30',
      hosp:'Hospital Simón Bolívar', hosp2:'Méderi',
      far1:'Cruz Verde Calle 80', far2:'Farmatodo Chapinero',
      ep2t:'Consulta de oftalmología', /* Fase 11 · Brief 01b */ ep4t:'Control de hipertensión', ep5t:'Consulta de pediatría',
      du1:'Epicrisis de urgencias', du2:'Resultado de radiografía', /* Fase 11 · Brief 01b */ du3:'Autorización de terapia física',
      du2b:'resultado de radiografía', du3b:'autorización de terapia física',
      carne:'Carné de vacunación', mail:'sonia.pardo@gmail.com' /* Fase 10 · Rediseño · Brief 12: sale del apellido (Pardo); lo usan el menú y el Brief 13 */,
      wt1:'SF', wt2:'MA', wt3:'MA', wlab:'MA', wtv:'MT', qmed:'{p3}', /* Fase 11 · Brief 01b: Marta lleva lo crónico (qmed por token) y Mateo las terapias */
      wurg:'MA', wort:'MA', wctr:'SF', whta:'MA', wfon:'MT', wna:'SF'
    },
    /* Fase 10 · Rediseño · Brief 09: colores por rol, iniciales oscuras; tint = fondo suave de la persona.
       Fase 11 · Brief 01b: dueña lavanda, i1 mandarina, i2 cielo, i3 rosa (la niebla pasa a las personas detectadas, --extra) */
    col:{SF:'#FFB054', MT:'#7DB8FF', SO:'#B69CFF', MA:'#FF94B8'},
    tint:{SF:'#FFF7EC', MT:'#F1F7FF', SO:'#F7F4FF', MA:'#FFECF2'},
    dark:{SF:'var(--r-texto)', MT:'var(--r-texto)', SO:'var(--r-texto)', MA:'var(--r-texto)'}, /* Fase 10 · Brief 22: rol, no hex */
    hide:[],
    nac:{SO:'14/05/1990', SF:'24/11/2025', MA:'23/08/1961'} /* Fase 11 · Brief 01b */ /* Fase 10 · Rediseño · Brief 13b (corrección 2): fechas de arranque (OB_NAC); la de {p2} es nac2raw */
  } /* Fase 11 · Brief 01: salen PROFILES.martha y PROFILES.laura; solo queda Sonia */
};
/* Fase 10 · Brief 15: cuarto camino, "Tu propia historia". Arranca sin nombres, fechas, relaciones, EPS ni trámites: todo lo
   escribe quien prueba. Solo se conservan "Tú" (ru, qmed) y los slots de cada trámite (w…), que no son texto. Colores por rol
   iguales a Sonia (dueña lavanda, SF mandarina, MT cielo, MA niebla). El Brief 16 llena t1/t1l */
PROFILES.propia = {
  label:'Tu propia historia',
  intro:'Una demo corta: pruebas un trámite con tus datos. Las otras historias muestran todo lo que hago.', /* Fase 10 · Brief 18 */
  v:(function(){ var s=PROFILES.sonia.v, v={}; for(var k in s) v[k] = (/^w/.test(k) || k==='ru') ? s[k] : ''; v.qmed='Tú'; return v; })(), /* Fase 11 · Brief 01b: en la propia historia qmed sigue siendo "Tú" */
  col:PROFILES.sonia.col, tint:PROFILES.sonia.tint, dark:PROFILES.sonia.dark,
  hide:[],
  nac:{}
};
function esPropia(){ return PROF==='propia'; }
/* Fase 10 · Brief 15: "{eps} EPS" no repite la palabra con "Nueva EPS" o con una EPS escrita que ya la trae (token {epsn}) */
function telLinea(conNumero){ return V.tel ? conNumero : 'Llama a la línea de '+(V.eps ? '{eps}' : 'tu EPS')+'. El número está en tu carné.'; } /* Fase 10 · Brief 21 (corrección): sin EPS guardada no queda "línea de ." */
function epsNombre(e){ e=(e||'').trim(); return /\bEPS\b/i.test(e) ? e : (e ? e+' EPS' : ''); }
var PROF='sonia', V=PROFILES.sonia.v;
var FULL_K={fu:'SO', f1:'SF', f2:'MT', f3:'MA'}; /* Fase 10 · Brief 19 (corrección): token → persona, para fx() */
function fx(t){
  if(typeof t!=='string') return t;
  /* Fase 10 · Brief 19 (corrección): {fu}/{f1}/{f2}/{f3} pasan por nombreCompleto(), que sigue lo editado en el paso 3
     y en la propia historia (sin nombres completos) devuelve solo el nombre */
  return t.replace(/\{(\w+)\}/g, function(m,k){ if(FULL_K[k]) return nombreCompleto(FULL_K[k]); if(k==='dmed') return String(diasMed()); /* Fase 11 · Brief 03 */ return (k in V) ? (/\{\w+\}/.test(V[k]) ? fx(V[k]) : V[k]) : m; }); /* Fase 11 · Brief 01b: un token puede traer otro adentro ({qmed} = {p3}) */
}
/* Fase Móvil · saludo de Inicio/tour. Fase 10 · Rediseño · Brief 13: siempre hay historia, así que siempre hay nombre */
function saludoHola(){ return 'Hola, '+fx('{u}'); }
function buildPeople(){
  var pr=PROFILES[PROF];
  V.epsn=epsNombre(V.eps); /* Fase 10 · Brief 15: token derivado de {eps} */
  PNAME={MT:V.p2, SF:V.p1, SO:V.ru, MA:V.p3};
  INIT ={MT:V.i2, SF:V.i1, SO:V.iu, MA:V.i3};
  PCOL ={MT:pr.col.MT, SF:pr.col.SF, SO:pr.col.SO, MA:pr.col.MA};
  PEOPLE={MT:[V.p2,pr.col.MT],SF:[V.p1,pr.col.SF],SO:[V.ru,pr.col.SO],MA:[V.p3,pr.col.MA]};
  var r=document.documentElement.style;
  r.setProperty('--mateo',pr.col.MT); r.setProperty('--sofia',pr.col.SF); r.setProperty('--sonia',pr.col.SO);
  /* Fase 10 · Rediseño · Brief 09: sin variantes -av; se escriben --marta y los tintes (--x-t) desde PROFILES, la única fuente */
  r.setProperty('--marta',pr.col.MA);
  pintarTintes(); /* Fase 10 · Brief 49: los tintes dependen del tema */
  /* quién existe de verdad en esta familia: sin duplicados */
  SLOTS=['SO','MT','SF','MA'].filter(function(k){ return pr.hide.indexOf(k)<0; });
}
var SLOTS=['SO','MT','SF','MA'];
/* Fase 10 · Brief 49 · Modo oscuro. Los tintes (--x-t) van en línea en <html>, así que en oscuro también se escriben desde aquí:
   el color de la persona al 18 % sobre la superficie (marta, que es gris, al 14 %). En claro, los de PROFILES */
function pintarTintes(){
  var pr=PROFILES[PROF], r=document.documentElement.style, osc=document.documentElement.getAttribute('data-tema')==='oscuro';
  var T={MT:'mateo', SF:'sofia', SO:'sonia', MA:'marta'};
  for(var k in T) r.setProperty('--'+T[k]+'-t', osc ? 'color-mix(in srgb, var(--'+T[k]+') 18%, var(--r-superficie))' : pr.tint[k]); /* Fase 11 · Brief 01b: Marta pasa a rosa (18 %); la niebla (14 %) queda en --extra-t */
}
/* Fase 10 · Brief 49 · Apariencia: 'claro' | 'oscuro' | 'sistema'. Arranca en Claro; se recuerda en localStorage.
   Es preferencia de quien presenta: resetDemo() no la toca */
var TEMA='claro', temaMQ=window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
try{ var temaGuardado=localStorage.getItem('taremi-tema'); if(['claro','oscuro','sistema'].indexOf(temaGuardado)>=0) TEMA=temaGuardado; }catch(e){}
function aplicarTema(valor){
  if(valor) TEMA=valor;
  var osc = TEMA==='oscuro' || (TEMA==='sistema' && temaMQ && temaMQ.matches);
  if(osc) document.documentElement.setAttribute('data-tema','oscuro'); else document.documentElement.removeAttribute('data-tema');
  pintarTintes();
  try{ localStorage.setItem('taremi-tema', TEMA); }catch(e){}
}
if(temaMQ){ var temaCambio=function(){ if(TEMA==='sistema') aplicarTema(); }; if(temaMQ.addEventListener) temaMQ.addEventListener('change', temaCambio); else if(temaMQ.addListener) temaMQ.addListener(temaCambio); }
aplicarTema();
/* las iniciales del avatar vienen del perfil, el color no cambia nunca */
function paintAvatars(root){
  var list=(root||document).querySelectorAll('.av[data-p], .av-one[data-p]');
  [].forEach.call(list, function(a){
    var k=a.getAttribute('data-p'), ic=PICON[k];
    if(ic){
      a.textContent=ic;
      a.classList.add('av-ic');
      a.style.setProperty('--ic-ring', PCOL[k]||'var(--r-borde)');
    } else if(INIT[k]){
      a.textContent=INIT[k];
      a.classList.remove('av-ic'); /* Fase 10 · Rediseño · Brief 13b (corrección 2): se puede volver a las iniciales */
    }
  });
}
/* Fase 6 · avatares elegibles: hoja de selección, reusa el color de la persona como anillo */
function openIconSheet(k){
  iconPickKey=k;
  /* "para Tú" no es gramatical en español — con preposición es "para ti" */
  document.getElementById('iconSheetTitle').textContent='Elige un ícono para '+(k==='SO'?'ti':PNAME[k]);
  /* Fase 10 · Rediseño · Brief 13b (corrección 2): opciones rellenas con el color de la persona (--ic-ring en la grilla) y brillo
     blanco al centro, como el avatar con ícono. La primera son sus iniciales, para volver a ellas (data-iconopt vacío) */
  document.getElementById('iconSheetSub').textContent = k==='SO' ? 'Tu color no cambia, solo el dibujo.' : 'Su color no cambia, solo el dibujo.';
  var grid=document.getElementById('iconGrid');
  grid.style.setProperty('--ic-ring', PCOL[k]||'var(--r-borde)');
  var h='<button type="button" class="ic-opt ic-ini'+(PICON[k]?'':' sel')+'" data-iconopt="" aria-label="Iniciales">'+INIT[k]+'</button>';
  ANIMALS.forEach(function(a){
    h+='<button type="button" class="ic-opt'+(PICON[k]===a?' sel':'')+'" data-iconopt="'+a+'">'+a+'</button>';
  });
  grid.innerHTML=h;
  closeSheets();
  document.getElementById('scrimIcon').style.display='flex';
}

var CARDS0 = [
  /* Fase 10 · Brief 01: sinCupo es una regla fija por trámite para "No hubo cita" (true → ped.nueva, false → slotsWgt()).
     Queda en la tarjeta para cambiarla después por el cálculo real con la vigencia. vence = la fecha que ya usa el prototipo. */
  {k:'ped', t:'{t1}', frase:'el control de {p1}', fraseCorta:'el control', /* Fase 10 · Brief 07: frase = cómo lo nombra el saludo; 08f: fraseCorta = sin la persona, solo al agrupar */ av:'SF', c:'var(--sofia)', st:'oculto', ord:1,
   sub:'{p1} · Agendar la cita', pill:'Urgente', pc:'urgente', sinCupo:true, vence:'10 de noviembre'}, /* Fase 11 · Brief 01b */
  {k:'cir', t:'{t2}', frase:'la autorización de {p3}', fraseCorta:'la autorización', av:'MA', c:'var(--marta)', st:'oculto', ord:2, /* Fase 11 · Brief 01b */
   sub:'{p3} · Radicar autorización', pill:'Pendiente', pc:'pendiente'},
  {k:'med', t:'{t3}', frase:'la entrega del {t3n} de {p3}', fraseCorta:'la entrega del {t3n}', av:'MA', c:'var(--marta)', st:'oculto', ord:3, /* Fase 11 · Brief 01b */ /* Fase 8 · Coherencia: med solo se revela al conectar correo en obFinish(), como ped/cir */
   sub:'{qmed} · Reclamar entrega 2 de 3', pill:'Pendiente', pc:'pendiente', lim:'18 de noviembre',
   ultEntrega:'9 de octubre', diasEntrega:30}, /* Fase 11 · Brief 03: datos de la ficha para calcular los días de pastillas (diasMed) */ /* Fase 10 · Brief 06: lim = fecha límite para en30() y «Sin agendar» (Fase 11 · Brief 05) */
  {k:'lip', t:'{lab}', frase:'la toma del {labl} de {p3}', fraseCorta:'la toma del {labl}', av:'MA', c:'var(--marta)', st:'oculto', ord:4,
   sub:'{p3} · Agendar la toma', pill:'Pendiente', pc:'pendiente', sinCupo:false, vence:'8 de diciembre'}, /* Fase 11 · Brief 01b: de Marta; vigencia de 60 días desde el 9 oct */
  {k:'ter', t:'{tv}', frase:'la orden de {tvl} de {p2}', fraseCorta:'la orden de {tvl}', av:'MT', c:'var(--mateo)', st:'oculto', ord:5, /* Fase 11 · Brief 01b: de Mateo */
   sub:'{p2} · Agendar antes del 18 dic', pill:'Pendiente', pc:'pendiente', lim:'18 de diciembre'}, /* Fase 10 · Brief 06: se revela en obFinish() como ped */
  /* Fase 10 · Brief 02: control A que nace de med.control (arquetipo C → crea una cita A). Oculto hasta entonces */
  {k:'ctl', t:'Control para renovar {t3n}', frase:'el control de {p3} para renovar el {t3n}', fraseCorta:'el control para renovar el {t3n}', av:'MA', c:'var(--marta)', st:'oculto', ord:6, /* Fase 11 · Brief 01b */
   sub:'{qmed} · Agendar el control', pill:'Pendiente', pc:'pendiente'},
  /* Fase 10 · Brief 06: la orden de seguimiento que sale del control de {p1} ("Me dieron órdenes nuevas"). desde = se puede agendar a partir de esa fecha */
  {k:'sig', t:'{tsig}', frase:'la cita de {tsigl} de {p1}', fraseCorta:'la cita de {tsigl}', av:'SF', c:'var(--sofia)', st:'oculto', ord:7,
   sub:'{p1} · Agendar desde el {sigd}', pill:'Pendiente', pc:'pendiente', desde:'{sigd}'}
];
var CARDS = JSON.parse(JSON.stringify(CARDS0));
/* Fase 8 · Coherencia: appVacia reemplaza a inicioEmptyOnce/bovEmptyOnce. No es de un solo uso: se
   mantiene en true hasta que algo real se guarde, para que el estado vacío sobreviva a navegar entre pantallas */
var appVacia=false;
/* Fase 6 · tour de orientación: aparece una sola vez, la primera vez que se entra a Inicio */
var tourSeen=false;
/* Fase 10 · Rediseño · Brief 13: salen obFamChosen y obSkipped ("Saltar" solo aparece después de elegir historia y crear la cuenta) */
function card(k){ for(var i=0;i<CARDS.length;i++) if(CARDS[i].k===k) return CARDS[i]; return null; }
/* Fase 10 · Brief 06 · regla de los 30 días: Inicio, la mascota y los avisos solo muestran lo que vence (lim/vence) o se puede
   empezar (desde) en 30 días o menos, o lo que no tiene fecha. Hoy en la historia es el viernes 6 de noviembre de 2026 (Fase 11 · Brief 01b). */
var HOY_SIM=new Date(2026,10,6), MESNUM={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11};
/* Fase 11 · Brief 03: días de pastillas = entrega anterior + días que cubre − hoy (con la historia, 2). Token {dmed} en fx() */
function diasMed(hoy){ /* Fase 11 · simular la tercera entrega: hoy (opcional) = la fecha del reloj del trámite; sin ella, HOY_SIM */
  hoy=hoy||HOY_SIM;
  var c=card('med'), m=c && /^(\d+) de (\w+)/.exec(c.ultEntrega||''); if(!m) return 0;
  var fin=new Date(HOY_SIM.getFullYear(), MESNUM[m[2]], +m[1]+c.diasEntrega);
  return Math.round((fin-hoy)/864e5);
}
function hoyTexto(){ return HOY_SIM.getDate()+' de '+Object.keys(MESNUM)[HOY_SIM.getMonth()]; }
function fechaLim(c){ return fx(c.lim||c.vence||c.desde||''); }
function diasA(txt){ var m=(txt||'').match(/(\d{1,2}) de (\w+)/); if(!m || !(m[2] in MESNUM)) return null;
  return Math.round((new Date(2026,MESNUM[m[2]],parseInt(m[1],10))-HOY_SIM)/864e5); }
function en30(c){ var d=diasA(fechaLim(c)); return d===null || d<=30; }
/* Fase 10 · Brief 03 · lo que se respondió en la detección de personas (DETECT, ver onboarding). Mientras no se
   haya confirmado (detOk), nadie queda fuera.
   detSlot(): lógica genérica para una historia con hide:['SF'] (antes Martha). Fase 11 · Brief 01: con Sonia no se activa */
function detSlot(k){ return (k==='SF' && PROFILES[PROF].hide.indexOf('SF')>=0) ? 'MT' : k; }
function detDe(k){ return detOk ? DETECT[detSlot(k)] : null; }
/* Fase 10 · Rediseño · Brief 13c: obAgregados = las personas de la historia que se agregaron en "Empecemos por ti". Quien no se
   agregó queda fuera de la familia, salvo que la detección la confirme (detOk, con «Sí» y sin "No es de mi familia"; Fase 11 · Brief 02: ya no la relación) */
var obAgregados=[];
function personaNoAgregada(k){
  k=detSlot(k); if(k==='SO' || obAgregados.indexOf(k)>=0) return false;
  var d=detOk ? DETECT[k] : null; return !(d && d.si && !d.fuera); /* Fase 11 · Brief 02: «Sí, es de mi familia» confirma, ya no la relación */
}
function personaFuera(k){ var d=detDe(k); return !!(d && d.fuera) || personaNoAgregada(k); }
/* un trámite solo se ve (Inicio, avisos, Calendario, mascota) si su persona está en la familia.
   Fase 11 · Brief 01: sale el nivel de cuidado; toda persona de la familia genera trámites y avisos */
function personaVisible(c){ return !personaFuera(fx(c.av)); }
function setCard(k, o, toast){
  var c=card(k); if(!c) return;
  undoSnap = {k:k, prev:JSON.parse(JSON.stringify(c))};
  for(var p in o) c[p]=o[p];
  /* H06 unificado: el toast de Inicio necesita saber a qué trámite pertenece para poder abrir su conversación al deshacer */
  if(toast){ pendingToast = toast; pendingToastKey = k; }
  /* Fase 11 · toast desactualizado: si el trámite vuelve a cambiar sin toast propio (p. ej. «Simular: se estancó»), el que esperaba ya no dice la verdad */
  else if(pendingToastKey===k){ pendingToast=null; pendingToastKey=null; }
}

var DRAFT_IC='<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
/* Fase Móvil · chevron de las cards de "Necesita tu atención", mismo trazo abierto que ya usan los botones "Volver" (topBack/stBack/hiloBack: M15 18l-6-6 6-6), espejado hacia la derecha — a pedido, reemplaza la flecha "→" por sentirse más intuitivo */
var CARD_CHEV='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
/* Fase 10 · Brief 28 · Lucide: chevron-down, x, check y el «!» de circle-alert (sin el círculo). Reemplazan a ▾, ✕ y ! sueltos */
var CHEV_D='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
var X_IC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
var ALERT_IC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
/* OK_IC sube aquí (antes ≈2230) para que PASOS_OK lo encuentre al cargar; los atributos ceden ante el CSS de cada contenedor */
var OK_IC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
/* Fase Móvil · separa la acción del prefijo de persona en un sub tipo '{p1} · Agendar la cita' → 'Agendar la cita', reusado por el saludo de la mascota (2.3 del brief) para no repetir el regex ni parsear el string a mano en cada lugar */
function actionOnly(sub){ return sub.replace(/^\{\w+\}\s*·\s*/,'').replace(/<\/?em>/g,''); }
/* Fase 10 · Brief 39: cardHTML() salió — la fila fresca de Inicio, su último uso, pasa a todoRowHTML() */

/* Fase 6 · H04: Avisos deja de escribir su propio texto y lee el mismo estado que la tarjeta.
   Fase 10 · Rediseño · Brief 12: es pantalla propia (#NOTIF); los mismos avisos se reparten en dos grupos
   ("Necesita tu atención" / "Para que sepas") y el círculo del ícono toma su color de una clase (.r/.a/.v) */
var notifHay=false;
/* Fase 10 · Brief 48: Configuración. Cuatro grupos (.wgt-lbl + .det-grp) y "Solo en esta demo" al final.
   Permisos y avisos solo informan (sin interruptores). Los avisos son los que existen en renderNotif():
   cita mañana, la EPS niega o incumple el plazo, llegan resultados (el de medicamentos todavía no existe). */
function cfgHace(t){
  var m = t ? Math.floor((Date.now()-t)/60000) : 0;
  if(m<1) return 'hace un momento';
  if(m<60) return 'hace '+m+' minuto'+(m===1?'':'s');
  var h=Math.floor(m/60); return 'hace '+h+' hora'+(h===1?'':'s');
}
/* Fase 10 · Brief 48c: Configuración por secciones. Apariencia arriba; Correo, Permisos y Avisos plegables (data-rev/data-revb,
   como la consulta) que arrancan cerrados al entrar (cerrar=true desde show) y se conservan al repintar por una acción. */
/* Fase 11 · Brief 06e: un interruptor por tipo de aviso, en memoria; el reinicio los enciende (resetDemo) */
var AVISOS_ON={citas:true, med:true, eps:true, res:true}, AVISOS_ON0={citas:true, med:true, eps:true, res:true};
function renderConfig(cerrar){
  var box=document.getElementById('cfgBody'); if(!box) return;
  var abiertos={};
  if(!cerrar) [].forEach.call(box.querySelectorAll('[data-revb^="cfg-"]'), function(b){ if(b.style.display!=='none') abiertos[b.getAttribute('data-revb')]=1; });
  var mail = cuentaMail || fx('{mail}');
  /* Fase 10 · Brief 48b: una sola forma de fila. Ícono (Lucide, --r-texto-2) · nombre corto en negrilla · descripción en gris ·
     estado corto a la derecha (.cfg-est); "Permitido" y "Conectado" llevan un check en --r-exito-texto */
  var SV='<svg class="cfg-ic" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var IC={
    user:SV+'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    mail:SV+'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    camera:SV+'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    mic:SV+'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
    calendar:SV+'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    alert:SV+'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    lock:SV+'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', /* Fase 10 · Brief 48c */
    bell:SV+'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    folder:SV+'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>', /* Fase 11 · Brief 06 (A) */
    file:SV+'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
  };
  var OK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function fila(ic, t, sub, est){
    var ok = est==='Permitido' || est==='Conectado';
    return '<div class="fam-r">'+IC[ic]+'<span class="card-main"><span class="card-title cfg-t">'+t+'</span>'+(sub?'<span class="card-sub">'+sub+'</span>':'')+'</span>'+
      (est?'<span class="cfg-est'+(ok?' ok':'')+'">'+(ok?OK:'')+est+'</span>':'')+'</div>';
  }
  function filaSw(clave, t, sub, lab){ var on=AVISOS_ON[clave]; /* Fase 11 · Brief 06e */
    return '<div class="fam-r"><span class="card-main"><span class="card-title cfg-t">'+t+'</span><span class="card-sub">'+sub+'</span></span>'+
      '<button type="button" class="cfg-sw'+(on?' on':'')+'" role="switch" aria-checked="'+on+'" aria-label="'+lab+'" data-aviso="'+clave+'"><span class="cfg-sw-k"></span></button></div>'; }
  function grupo(t, filas){ return '<div class="wgt-lbl">'+t+'</div><div class="det-grp">'+filas+'</div>'; }
  var CHEV='<svg class="epi-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  function pleg(key, ic, t, sub, est, cuerpo){
    var on=!!abiertos[key], ok = est==='Conectado';
    return '<button type="button" class="fam-r cfg-pl" data-rev="'+key+'" aria-expanded="'+on+'">'+IC[ic]+
      '<span class="card-main"><span class="card-title cfg-t">'+t+'</span>'+(sub?'<span class="card-sub">'+sub+'</span>':'')+'</span>'+
      (est?'<span class="cfg-est'+(ok?' ok':'')+'">'+(ok?OK:'')+est+'</span>':'')+CHEV+'</button>'+
      '<div class="cfg-plb" data-revb="'+key+'"'+(on?'':' style="display:none;"')+'>'+cuerpo+'</div>';
  }
  var h = cfgToast ? '<div class="toast" role="status">'+cfgToast+'</div>' : ''; cfgToast=null;
  /* Fase 10 · Brief 49 · Brief 48c: Apariencia arriba, en un control segmentado de una fila (.cfg-seg) */
  h+='<div class="wgt-lbl" id="cfgTemaLbl">Apariencia</div><div class="cfg-seg" role="radiogroup" aria-labelledby="cfgTemaLbl">'+
    [['claro','Claro'],['oscuro','Oscuro'],['sistema','Como mi celular']].map(function(o){ var on=TEMA===o[0];
      return '<button type="button" class="'+(on?'sel':'')+'" role="radio" aria-checked="'+on+'" data-tema="'+o[0]+'">'+o[1]+'</button>'; }).join('')+'</div>';
  h+=grupo('Tu cuenta', '<div class="fam-r"><span class="av" data-p="SO" style="background:'+PCOL.SO+'">'+INIT.SO+'</span>'+
    '<span class="card-main"><span class="card-title cfg-t">'+V.u+'</span><span class="card-sub">'+mail+' · '+(cuentaGoogle?'Con Google':'Con tu correo')+'</span></span></div>');
  var perm=[mailConnected&&'correo', camUsada&&'cámara', micUsado&&'micrófono'].filter(Boolean);
  var permRes = !perm.length ? 'Ninguno todavía' : cap1(perm.length===1 ? perm[0] : perm.slice(0,-1).join(', ')+' y '+perm[perm.length-1]);
  h+='<div class="det-grp cfg-secs">'+ /* sin título de grupo: cada fila ya dice qué es */
    pleg('cfg-mail', 'mail', 'Correo', '', mailConnected?'Conectado':'Sin conectar', mailConnected
      ? '<p class="cfg-intro">'+mail+'<br>Lo revisé '+cfgHace(mailRevisado)+'</p>'+
        '<div class="cfg-acc"><button type="button" class="btn-s" data-cfgrevisar="1">Revisar ahora</button>'+
        '<button type="button" class="close-dest danger" data-cfgoff="1">Desconectar mi correo</button></div>'
      : '<div class="cfg-acc"><button type="button" class="btn-p" data-tap="fabmail">Conectar tu correo</button></div>')+
    pleg('cfg-perm', 'lock', 'Permisos', permRes, '',
      fila('mail', 'Correo', 'Para buscar órdenes, resultados y autorizaciones.', mailConnected?'Permitido':'Aún no')+
      fila('camera', 'Cámara', 'Para escanear tus documentos.', camUsada?'Permitido':'Aún no')+
      fila('mic', 'Micrófono', 'Para dictarme y resumir la consulta.', micUsado?'Permitido':'Aún no')+
      '<p class="cfg-intro">Te pido cada permiso la primera vez que lo necesito. Para cambiarlos, ve a los ajustes de tu celular.</p>')+
    pleg('cfg-avisos', 'bell', 'Avisos', 'Citas, medicamentos, tu EPS y resultados' /* Fase 11 · Brief 04 (B) */, '',
      '<p class="cfg-intro">Te aviso solo cuando hay algo que hacer.</p>'+
      filaSw('citas', 'Citas', 'Un día antes, con lo que hay que llevar.', 'Avisos de citas')+
      filaSw('med', 'Medicamentos', 'Cuando puedes reclamar una entrega.', 'Avisos de medicamentos')+ /* Fase 11 · Brief 06b */
      filaSw('eps', 'Tu EPS', 'Si niega o se pasa del plazo, con el siguiente paso.', 'Avisos de tu EPS')+
      filaSw('res', 'Resultados', 'Cuando llegan.', 'Avisos de resultados'))+
    /* Fase 11 · Brief 06 (A): la promesa «descargarlos o borrarlos» tiene dónde cumplirse; los dos botones solo abren hojas */
    pleg('cfg-datos', 'folder', 'Tus datos', 'Descargarlos o borrarlos', '',
      '<p class="cfg-intro">Son los documentos y trámites tuyos y de tu familia.</p>'+
      '<div class="cfg-acc"><button type="button" class="btn-s" data-datosdl="1"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Descargar mi carpeta</button>'+
      '<button type="button" class="btn-danger" data-datosbor="1">Borrar mis datos</button></div>')+'</div>';
  h+=grupo('Solo en esta demo', /* Fase 11 · Brief 01: sale "Cambiar de historia" */
    '<button type="button" class="menu-i" id="cfgReset"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Reiniciar el prototipo</button>');
  box.innerHTML=fx(h); paintAvatars(box);
}
function renderNotif(){
  var IC={
    alerta:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
    cal:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    ok:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    doc:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>'
  };
  function item(tono,ic,t,d,when){ return '<div class="notif"><span class="notif-ic '+tono+'">'+IC[ic]+'</span><div class="notif-tx"><span class="notif-when">'+when+'</span><h5>'+t+'</h5><p>'+d+'</p></div></div>'; } /* Fase 11 · Brief 06f: la hora arriba */
  var aten='', sepas='';
  function on(k,x){ return AVISOS_ON[k] ? x : ''; } /* Fase 11 · Brief 06e: apagado, el aviso no se agrega */
  var cc=card('cir');
  if(cc && !personaVisible(cc)) cc=null; /* Fase 10 · Brief 03: "No es de mi familia" no avisa */
  if(cc && cc.st==='trabado' && cc.pill==='Negada')
    aten+=on('eps', item('r','alerta','{eps} negó la autorización','{t2} de {p3} · puedes pedir que reconsideren','Hace 2 horas'));
  else if(cc && cc.st==='trabado')
    aten+=on('eps', item('r','alerta','{eps} incumplió el plazo','{t2} de {p3} · venció ayer','Hace 2 horas'));
  else if(cc && cc.st==='accionable' && cc.aprobada) /* Fase 11 · Brief 03: la aprobación, por cualquier camino */
    aten+=on('eps', item('v','ok','{eps} aprobó la autorización','{t2} de {p3} · ya puedes agendar','Hoy'));
  var mc=card('med'); /* Fase 11 · Brief 03: el aviso de medicamentos que faltaba */
  if(mc && mc.st==='accionable' && personaVisible(mc))
    aten+=on('med', item('a','alerta','Ya puedes reclamar el {t3n} de {p3}','Le quedan {dmed} días · {far1} o {far2}','Hoy'));
  /* Fase 10 · Brief 02: los avisos salen del estado de CARDS — resuelto y descartado no avisan (salvo los resultados que llegaron),
     las citas del día siguiente dicen "Tu cita es mañana" */
  CARDS.forEach(function(x){
    if(!CITA[x.k] || x.st==='descartado' || x.st==='oculto' || !personaVisible(x)) return; /* Fase 10 · Brief 03 */
    var nom=THREADS[x.k].title, per=THREADS[x.k].p, dePer=esTuyo(x.k)?'':' de '+per;
    if(x.st==='encurso' && x.fase==='manana')
      sepas+=on('citas', item('a','cal','Tu cita es mañana',nom+dePer+' · '+x.when.replace(' · ',', ')+' · revisa qué llevar','Hoy'));
    else if(x.k==='ped' && x.st==='encurso' && x.fase==='agendada')
      sepas+=on('citas', item('v','ok',esTuyo(x.k)?'Agendé tu cita':'Agendé la cita de '+per,x.when.replace(' · ',', ')+' · lleva la orden'+(QLLEVAR.ped.cel.some(function(i){ return i.doc==='carne'; })?' y el carné':''),'Hoy')); /* Fase 10 · Brief 16: sin "de Tú" y sin carné si el control no lo pide */
    else if(x.st==='accionable' && x.ordenNueva) /* Fase 11 · Brief 03: cumple el "te aviso apenas llegue" de la orden nueva */
      aten+=on('citas', item('v','doc','Llegó la orden nueva'+dePer,nom+' · vence el '+x.vence+' · ya puedes agendar','Hoy'));
    else if(x.k==='ped' && x.st==='accionable' && x.sub.indexOf('orden nueva')<0 && en30(x)) /* Fase 10 · Brief 06: regla de los 30 días */
      aten+=on('citas', item('a','cal',(esTuyo(x.k)?'Tu cita':'La cita de '+per)+' sigue sin agendar', /* Fase 10 · Brief 16 */'Vence el '+x.vence+' · te busco horarios','Hoy'));
    else if(x.k==='lip' && x.st==='resuelto')
      sepas+=on('res', item('v','doc','Llegaron los resultados · {lab} de {p3}','Ya están en la Bóveda','Hoy')); /* Fase 11 · Brief 01b */
  });
  /* Fase 10 · Brief 19: lo último que guardé, con enlace a la portada de la Bóveda (bovMarcarNuevos lo reemplaza en cada guardado) */
  /* solo cuenta lo que sigue en la Bóveda (la detección puede sacar documentos de quien no es de la familia) */
  var an=(bovAviso||[]).filter(function(d){ return DOCS.indexOf(d)>=0; }).map(function(d){ return d.t; });
  if(an.length){
    var ad = an.length===1 ? an[0] : an.length===2 ? an[0]+' y '+an[1] : an[0]+', '+an[1]+' y '+(an.length-2)+' más';
    sepas+='<div class="notif"><span class="notif-ic v">'+IC.doc+'</span><div class="notif-tx"><span class="notif-when">Hoy</span><h5>Guardé '+an.length+' documento'+(an.length===1?'':'s')+' en la Bóveda</h5>'+
      '<p>'+ad+'</p><button type="button" class="link-u notif-link" data-go="G1">Ver en la Bóveda</button></div></div>'; /* Fase 11 · Brief 06f */
  }
  /* Fase 8 · el badge pasa de número fijo a punto: presente si hay algo, ausente si no hay nada (Yifrah) */
  notifHay = !!(aten || sepas); /* Fase 10 · Brief 02: el badge sale de los avisos reales */
  var box=document.getElementById('notifList');
  if(box){
    var h='';
    if(aten) h+='<p class="notif-grp">Necesita tu atención</p>'+aten;
    if(sepas) h+='<p class="notif-grp">Para que sepas</p>'+sepas;
    if(!h) h='<p class="notif-empty">No tengo avisos nuevos. Te escribo aquí cuando algo cambie.</p>';
    box.innerHTML=fx(h); paintAvatars(box);
  }
  paintNotifDot();
}
/* Fase 10 · Rediseño · Brief 12: el punto de la campana y el de "Avisos" en el menú usan la misma condición;
   estando en la pantalla de avisos, la campana no lo muestra */
function paintNotifDot(){
  var badge=document.getElementById('notifBadge');
  if(badge) badge.style.display = (notifHay && cur!=='NOTIF') ? 'flex' : 'none';
  var sd=document.getElementById('sideDot'); if(sd) sd.hidden=!notifHay;
}
/* Fase 10 · Brief 08e · recorrido por la barra: reemplaza la tarjeta "todo pasa por estos tres lugares".
   Velo sobre todo menos la barra, anillo turquesa en la pestaña del paso y burbuja con pico que la señala. */
var TOUR_STEPS=[
  /* Fase 10 · Brief 17: scr = la pantalla que se ve detrás del velo en cada paso ('gen' = la conversación general, en su bienvenida) */
  /* Fase 11 · Brief 04b (A): vuelven las paradas de Inicio y Calendario, con sus textos de antes del Brief 02 */
  {nav:'inicio', scr:'A1', t:'Inicio', p:'Aquí te muestro solo lo que vence en el próximo mes. Empieza por lo urgente.', /* Fase 11 · Brief 05 (B): el mismo texto de Ayuda › Inicio */
    pVacia:'Cuando tenga tus documentos, aquí te muestro solo lo que vence en el próximo mes.'} /* Fase 10 · Brief 39: con Inicio vacío */,
  {nav:'taremi', scr:'gen', t:'Taremi', p:'Pregúntame lo que quieras o cuéntame algo nuevo. Si es de un trámite, te llevo a él.'},
  {nav:'cal',    scr:'F1', t:'Calendario', p:'Tus citas y lo que falta agendar, aunque venza más adelante.'},
  {nav:'bov',    scr:'G1', t:'Bóveda', p:'Todos tus documentos, por persona.'}
];
var tourStep=-1; /* -1 = cerrado */
/* Fase 10 · Brief 17: el recorrido no cambia el estado de la app. A1_ULT = los avisos de un solo uso que gastó el último Inicio
   (el que abrió el recorrido); tourGuard los guarda junto con lo que tocan las pantallas del recorrido y tourClose() los devuelve */
var A1_ULT={}, tourGuard=null;
var tourVeil=document.getElementById('tourVeil'), tourBub=document.getElementById('tourBub');
function tourOpen(n){
  sideClose(true); popClose(true); /* Fase 10 · Rediseño · Brief 12 (corrección): el recorrido nunca queda encima de la barra lateral ni de un menú abierto */
  tourStep=n;
  if(!tourGuard){ /* Fase 10 · Brief 17 */
    var seen={}, started={}; for(var k in THREADS){ seen[k]=THREADS[k].seen; started[k]=THREADS[k].started; }
    tourGuard={ult:JSON.parse(JSON.stringify(A1_ULT)), seen:seen, started:started, bovFolder:bovFolder, calDaySel:calDaySel};
  }
  tourVeil.hidden=false; tourBub.hidden=false;
  tourPaint();
  tourBub.focus();
}
function tourPaint(){
  var st=TOUR_STEPS[tourStep], last=tourStep===TOUR_STEPS.length-1;
  document.getElementById('tourT').textContent=st.t;
  document.getElementById('tourP').textContent=(appVacia && st.pVacia) || st.p; /* Fase 10 · Brief 39 · Fase 11 · Brief 04b (A): vuelve pVacia */
  document.getElementById('tourNext').textContent=last?'Listo':'Siguiente';
  tourBub.style.setProperty('--bt-p', ((tourStep+1)/TOUR_STEPS.length*100)+'%');
  /* Fase 10 · Brief 17: detrás del velo, la pantalla del paso (show() pone la pestaña activa y el scroll arriba). La Bóveda, en la portada */
  if(st.scr==='gen'){ if(!(cur==='TH' && curThread==='gen')) openThread('gen'); }
  else if(cur!==st.scr){ if(st.scr==='G1') bovFolder=null; show(st.scr); }
  content.scrollTop=0;
  [].forEach.call(document.querySelectorAll('#nav .nav-item'), function(b){ b.classList.toggle('bt-ring', b.getAttribute('data-nav')===st.nav); });
  tourPlace();
}
/* la burbuja se corre hacia adentro (16 px de margen) y el pico sigue apuntando al centro de la pestaña */
/* Fase 10 · Brief 44 · marco fiel: en escritorio (768 px o más) #app mide 390 × 844 y, si la ventana es más baja, se reduce
   entero con zoom. MARCO es esa escala (1 en celular). getBoundingClientRect() devuelve medidas ya escaladas y los left/top que
   se escriben dentro de #app no lo están: quien mezcle los dos divide la diferencia por MARCO */
var MARCO=1;
function marcoEscala(){
  var esc=matchMedia('(min-width:768px)').matches;
  MARCO=esc ? Math.min(1, (window.innerHeight-48)/844) : 1;
  document.documentElement.style.setProperty('--marco-escala', MARCO);
}
marcoEscala();
window.addEventListener('resize', marcoEscala);
function tourPlace(){
  if(tourStep<0) return;
  var app=document.getElementById('app').getBoundingClientRect();
  var tab=document.querySelector('#nav .nav-item[data-nav="'+TOUR_STEPS[tourStep].nav+'"]').getBoundingClientRect();
  var w=tourBub.offsetWidth, cx=(tab.left+tab.width/2-app.left)/MARCO; /* Fase 10 · Brief 44 */
  var left=Math.max(16, Math.min(cx-w/2, app.width/MARCO-16-w));
  tourBub.style.left=left+'px';
  tourBub.style.setProperty('--bt-x', Math.max(20, Math.min(cx-left, w-20))+'px');
}
/* Fase 10 · Brief 17: al cerrar se devuelve lo guardado y se vuelve a Inicio. tourSeen va antes de show('A1') (renderInicio abre el
   recorrido si !tourSeen). sinVolver: el reinicio, que ya dejó todo limpio y va a la bienvenida */
function tourClose(sinVolver){
  tourStep=-1; tourSeen=true;
  tourVeil.hidden=true; tourBub.hidden=true;
  [].forEach.call(document.querySelectorAll('#nav .bt-ring'), function(b){ b.classList.remove('bt-ring'); });
  var g=tourGuard; tourGuard=null;
  if(sinVolver===true || !g) return;
  if(cur==='TH') curThread=null; /* que salir del chat no lo marque como visto */
  for(var k in g.seen){ if(THREADS[k]){ THREADS[k].seen=g.seen[k]; THREADS[k].started=g.started[k]; } }
  bovFolder=g.bovFolder; calDaySel=g.calDaySel;
  if(g.ult.toast){ pendingToast=g.ult.toast; pendingToastKey=g.ult.toastKey; }
  if(g.ult.note) pendingNote=g.ult.note;
  if(g.ult.fresh) freshConfirmKey=g.ult.fresh;
  show('A1');
}
document.getElementById('tourSkip').addEventListener('click', function(){ tourClose(); });
document.getElementById('tourNext').addEventListener('click', function(){
  if(tourStep<TOUR_STEPS.length-1){ tourStep++; tourPaint(); } else tourClose();
});
/* mientras dura, el foco no sale de la burbuja */
tourBub.addEventListener('keydown', function(e){
  if(e.key==='Escape'){ e.preventDefault(); tourClose(); return; } /* Fase 10 · Brief 17 */
  if(e.key!=='Tab') return;
  var f=[document.getElementById('tourSkip'), document.getElementById('tourNext')];
  if(e.shiftKey && (document.activeElement===f[0] || document.activeElement===tourBub)){ e.preventDefault(); f[1].focus(); }
  else if(!e.shiftKey && document.activeElement===f[1]){ e.preventDefault(); f[0].focus(); }
});
window.addEventListener('resize', tourPlace);
/* Fase 10 · Rediseño · Brief 14 · mascota (RV_Taremi, brazos de trazo). Un solo dibujo para todos los lugares.
   TM_BASE/TM_M son la tabla M de la referencia. Degradado, recorte y grano viven en svg.tm-defs (index.html): ninguna mascota repite ids.
   Colores en tokens --tm-* (styles.css). El halo solo desde 84 px. "descansa" sale en Inicio cuando todo está agendado (Fase 11 · Brief 13). */
var TM_CUERPO='M100 26C130 24 166 48 170 86C174 130 148 172 104 178C60 184 26 154 20 110C15 64 52 30 100 26Z';
var TM_BASE={ armL:'M34 118C18 126 14 142 24 150', armR:'M164 112C180 120 186 136 176 146', browL:'M68 80L88 78', browR:'M112 78L132 80', cejas:0,
  arco:0, eLx:80, eRx:120, eY:97, arcL:'M72 100C76 92 86 92 90 100', arcR:'M110 100C114 92 124 92 128 100',
  mouth:'M84 119C93 126 107 126 116 119', llena:0, wave:0, chispas:0, zz:0, burbujas:0 };
var TM_M={
  hola: { armR:'M164 104C180 94 188 78 184 60', mouth:'M82 116C90 130 110 130 118 116', wave:1 },
  calma: {},
  piensa: { eLx:86, eRx:126, eY:92, armR:'M164 124C150 142 128 150 116 140', cejas:1, browL:'M72 80L90 80', browR:'M114 74L132 70', mouth:'M94 122C100 124 106 123 110 119', burbujas:1 },
  celebra: { armL:'M36 104C20 92 14 74 20 56', armR:'M164 100C180 88 188 70 182 52', arco:1, mouth:'M80 114C86 134 114 134 120 114Z', llena:1, chispas:1 },
  atenta: { armR:'M164 108C178 106 190 98 196 84', cejas:1, browL:'M72 81C79 80 86 77 92 71', browR:'M116 71C122 77 129 80 136 81', eLx:84, eRx:124, eY:98, mouth:'M95 121L111 121' }, /* Fase 11 · Brief 12: cejas oblicuas y boca recta; preocupada, no triste ni alarmada */
  descansa: { arco:1, arcL:'M72 98C77 104 85 104 90 98', arcR:'M110 98C115 104 123 104 128 98', mouth:'M92 121C97 124 103 124 108 121', zz:1 }
};
function mascotaSVG(gesto, px){
  if(!TM_M[gesto]) gesto='calma';
  var o=Object.assign({}, TM_BASE, TM_M[gesto]);
  var ch = px<=42; /* Fase 11 · Brief 12: trazo grueso a 36 y 42 px */
  var ojos = o.arco
    ? '<path class="tm-trazo tm-arco" d="'+o.arcL+'"/><path class="tm-trazo tm-arco" d="'+o.arcR+'"/>'
    : '<circle class="tm-ojo" cx="'+o.eLx+'" cy="'+o.eY+'" r="'+(ch?9:7.5)+'"/><circle class="tm-ojo" cx="'+o.eRx+'" cy="'+o.eY+'" r="'+(ch?9:7.5)+'"/>'+
      '<circle class="tm-ojo-b" cx="'+(o.eLx+2.6)+'" cy="'+(o.eY-2.6)+'" r="'+(ch?3:2.4)+'"/><circle class="tm-ojo-b" cx="'+(o.eRx+2.6)+'" cy="'+(o.eY-2.6)+'" r="'+(ch?3:2.4)+'"/>';
  return '<span class="tm tm-'+gesto+(ch?' tm-s':'')+'" aria-hidden="true">'+(px>=84 ? '<span class="tm-halo"></span>' : '')+
    '<svg viewBox="0 0 200 200" width="'+px+'" height="'+px+'" focusable="false" aria-hidden="true">'+
    (px>=84 ? '<ellipse class="tm-piso" cx="98" cy="190" rx="52" ry="7"/>' : '')+ /* Fase 10 · Brief 14 (corrección): sin piso a 36 y 42 px */
    '<g class="tmBob">'+
      '<path class="tm-arm" d="'+o.armL+'"/>'+
      '<path class="tm-body" d="'+TM_CUERPO+'"/>'+
      '<rect class="tm-grano" x="0" y="0" width="200" height="200" clip-path="url(#tmBodyClip)" filter="url(#tmGrain)"/>'+
      '<ellipse class="tm-luzb" cx="68" cy="56" rx="22" ry="12" transform="rotate(-24 68 56)"/>'+
      '<ellipse class="tm-mejilla" cx="66" cy="116" rx="10" ry="6"/><ellipse class="tm-mejilla" cx="134" cy="116" rx="10" ry="6"/>'+
      (o.cejas ? '<path class="tm-trazo" d="'+o.browL+'"/><path class="tm-trazo" d="'+o.browR+'"/>' : '')+
      ojos+
      '<path class="tm-trazo'+(o.llena?' tm-boca-l':'')+'" d="'+o.mouth+'"/>'+
      '<g'+(o.wave?' class="tmWave"':'')+'><path class="tm-arm" d="'+o.armR+'"/></g>'+
    '</g>'+
    (o.chispas ? '<g class="tm-chispa"><path d="M28 44l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><path d="M176 30l2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4 6-2.4z"/><path d="M184 150l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>' : '')+
    (o.burbujas ? '<g class="tm-chispa"><circle cx="160" cy="40" r="5"/><circle cx="176" cy="26" r="7"/><circle cx="194" cy="8" r="9"/></g>' : '')+
    (o.zz ? '<g class="tm-z"><text x="150" y="44" font-size="26">z</text><text x="172" y="22" font-size="18">z</text></g>' : '')+
    '</svg></span>';
}
/* avatar de una tanda del chat (36 px, sin vaivén: ver .t-av en styles.css) */
function tAv(gesto){ return '<span class="t-av">'+mascotaSVG(gesto||'calma', 36)+'</span>'; }
/* Inicio (84 px): el estado del modelo manda el brillo; el gesto solo se repinta si cambia (no reinicia la animación) */
function mascotInicio(estado, gesto){
  mascotWrap.setAttribute('data-estado', estado);
  if(mascotWrap.getAttribute('data-gesto')===gesto) return;
  mascotWrap.setAttribute('data-gesto', gesto);
  mascotWrap.innerHTML='<div class="mascot-glow"></div>'+mascotaSVG(gesto, 84);
}
/* Fase 10 · Brief 05: la mascota baja al contenido como tarjeta, debajo del título. Se reinserta después de
   cada A1.innerHTML (el nodo se conserva, así mascotGreet/mascotWrap siguen apuntando a él). */
function mascotAInicio(){ A1.insertBefore(mascotHd, A1.firstChild); mascotHd.style.display='flex';
  /* Fase 10 · Brief 06: la tarjeta abre la pestaña Taremi (ver el clic en #mascotHd) */
  mascotHd.setAttribute('role','button'); mascotHd.setAttribute('tabindex','0'); mascotHd.setAttribute('aria-label','Hablar con Taremi'); }
/* Fase 10 · Brief 06 · fila de "Por hacer" / "En curso": toda la fila abre el hilo.
   Vista previa = último mensaje de Taremi en el hilo (sin HTML); si aún no hay, el sub de la tarjeta.
   Punto "sin revisar": el hilo nunca se abrió o tiene mensajes después de la última vez (THREADS[k].seen). gris = En curso */
var cursoOpen=false;
/* Fase 10 · Brief 06: mascota de la barra de contacto · Fase 10 · Rediseño · Brief 14: calma, 42 px; y la del onboarding (hola, 140 px) */
document.getElementById('genAv').innerHTML=mascotaSVG('calma', 42);
document.querySelector('#PROC .proc-m').innerHTML=mascotaSVG('piensa', 112); /* Fase 11 · Brief 12 */
document.querySelector('.ob-hero .ob-m').innerHTML=mascotaSVG('hola', 140);
mascotHd.addEventListener('keydown', function(e){ if((e.key==='Enter'||e.key===' ') && cur==='A1'){ e.preventDefault(); openThread('gen'); } });
/* Fase 10 · Rediseño · Brief 11: ícono de "En curso", calendario con check (lienzo 42) */
var CURSO_IC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 15l2 2 4-4"/></svg>';
function ultimoT(k){
  var ms=(THREADS[k]||{}).msgs||[];
  for(var i=ms.length-1;i>=0;i--){ var m=ms[i]; if(m.who!=='t') continue;
    var t = m.text || (m.comp && m.comp.t) || '';
    if(!t && m.wgt){ var mt=m.wgt.match(/class="wgt-t">([\s\S]*?)<\/div>/); t = mt ? mt[1] : ''; }
    t=fx(t).replace(/<[^>]+>/g,'').trim(); if(t) return t; }
  return '';
}
function todoRowHTML(c, gris){
  var av=fx(c.av), th=THREADS[c.k]||{}, last=c.st==='resuelto' ? '' : ultimoT(c.k); /* Fase 10 · Brief 39: resuelto → abajo va c.sub («Sofía · Cita del…»), no el último mensaje */
  var prev = last ? fx(th.p)+' · '+last : fx(c.sub).replace(/<[^>]+>/g,'');
  /* Fase 10 · Brief 25: el borrador vuelve a la fila (H05), con el mismo marcado que tenía cardHTML(): persona · Borrador: fecha */
  var d=DRAFTS[c.k];
  if(d && d.slot && !gris && c.st!=='trabado'){
    var wm=c.sub.match(/^(\{\w+\})\s*·\s*/), quien=fx(th.p || (wm ? wm[1] : ''));
    prev = (quien ? quien+' · ' : '')+'<span class="draft">'+DRAFT_IC+'Borrador:</span> <span style="color:var(--r-pendiente)">'+d.slot.replace(' · ',', ')+'</span>';
  }
  /* Fase 10 · Rediseño · Brief 11: cada fila es su propia tarjeta con el tinte de la persona (--tinte, desde TINTVAR); en curso, sin tinte */
  var tinte = (!gris && TINTVAR[av]) ? ' style="--tinte:var(--'+TINTVAR[av]+'-t)"' : '';
  return '<button type="button" class="todo-row'+(gris?' gris':'')+'" data-thread="'+c.k+'"'+tinte+'>'+
    '<span class="av" data-p="'+av+'" style="background:'+(PCOL[av]||'var(--r-borde)')+'">'+av+'</span>'+ /* Fase 10 · Brief 14 (corrección): en curso el avatar conserva su color o ícono */
    '<span class="card-main"><span class="todo-top"><span class="todo-t">'+c.t+'</span>'+(gris?'':'<span class="pill '+c.pc+'">'+c.pill+'</span>')+'</span>'+
    '<span class="todo-s">'+prev+'</span></span>'+
    /* Fase 10 · Brief 29: sale el punto «Sin revisar»; la pill ya dice el estado */
    '<span class="card-arrow" aria-hidden="true">'+CARD_CHEV+'</span></button>';
}
/* Fase 10 · Brief 07: saludo con jerarquía — "Hola, {u}." arriba y la frase debajo */
function mascotSaludo(linea){
  mascotGreet.innerHTML = fx('<span class="mascot-hola">'+saludoHola()+'.</span>'+(linea ? '<span class="mascot-line">'+linea+'</span>' : '')); /* Fase 11 · Brief 05 (B): sin línea vacía */
}
function renderInicio(){
  /* Fase 10 · Brief 08e: la primera vez que se entra a Inicio (tras el onboarding o tras saltarlo) sale el recorrido por la barra */
  if(!tourSeen && tourStep<0 && cur==='A1' && document.getElementById('ob').classList.contains('hidden')) setTimeout(function(){ if(!tourSeen && tourStep<0 && cur==='A1' && document.getElementById('ob').classList.contains('hidden')) tourOpen(0); }, 0);
  var tour=''; /* Fase 10 · Brief 08e: ya no hay tarjeta de tour */
  if(appVacia){
    /* Fase Móvil · 2.6.2: la mascota reemplaza el ícono+título que tenía este estado, se mantiene el párrafo de copy existente debajo */
    /* Fase 10 · Brief 15: sin documentos, en las cuatro historias. Con el correo ya revisado (propia) no se ofrece buscar otra vez */
    var revisado = mailConnected && !esPropia(); /* Fase 10 · Brief 16: en la propia historia la bandeja sí trae la orden */
    mascotSaludo(revisado ? 'Revisé tu correo y aún no encontré órdenes. Si tienes una en papel, tómale una foto.' /* Fase 11 · Brief 03: no hay aviso que cumpla "te aviso" */
      : 'Trae tus documentos con el botón +.'); /* Fase 11 · Brief 07: el mismo texto de la Bóveda vacía */
    mascotInicio('calma','calma'); /* Fase 10 · Brief 04 · Fase 10 · Rediseño · Brief 14: vacío → en calma */
    agendaPrimera=null; /* Fase 11 · Brief 03 */
    A1.innerHTML=tour+(revisado ? '' : '<div class="empty"><button type="button" class="btn-p" data-tap="fabmail">Buscar en mi correo</button></div>'); /* el mismo flujo que el botón + · Fase 11 · Brief 07: mismo nombre que en el paso 4 */
    mascotAInicio(); /* Fase 10 · Brief 05 */
    renderNotif();
    return;
  }
  /* Fase 8 · Esqueleto 2: el chip "Ver:" filtra Inicio igual que ya filtra la Bóveda */
  /* Fase 10 · Brief 03: personaVisible() deja fuera a los excluidos (también de la frase de la mascota, que sale de agenda) */
  var okFam = function(c){ return personaVisible(c) && (bovPerson==='all' || fx(c.av)===bovPerson); };
  /* Fase 10 · Brief 06: regla de los 30 días (en30) — lo que vence o empieza más tarde vive en el Calendario, no aquí */
  var trab = CARDS.filter(function(c){return c.st==='trabado' && okFam(c) && en30(c);});
  var conBorrador = function(c){ return !!(DRAFTS[c.k] && DRAFTS[c.k].slot); }; /* Fase 11 · Brief 14: un trámite con horario elegido a medias vuelve a «Por hacer» aunque esté lejos */
  var acc  = CARDS.filter(function(c){return c.st==='accionable' && okFam(c) && (en30(c) || conBorrador(c));}).sort(function(a,b){return a.ord-b.ord;});
  /* Fase 10 · Brief 01: las citas en mañana / hoy / por confirmar suben a "Necesita tu atención"; esperando resultado va a en curso */
  var citaF = CARDS.filter(function(c){return c.st==='encurso' && FASE_ATN[c.fase] && okFam(c);});
  var enc  = CARDS.filter(function(c){return ((c.st==='encurso' && !FASE_ATN[c.fase]) || c.st==='esperando') && okFam(c);});
  /* Fase 10 · Brief 01: orden de la agenda (v6) — Hoy → trabado → Mañana → resto por ord (vence pronto y desbloquea aún no tienen dato) */
  var agenda = trab.concat(acc, citaF).sort(function(a,b){ return rankAgenda(a)-rankAgenda(b) || a.ord-b.ord; });
  /* Fase 6 · tarjeta destacada: la primera de la agenda — freshCard nunca lo es */
  var heroKey = agenda.length ? agenda[0].k : null;
  agendaPrimera = heroKey; /* Fase 11 · Brief 03: «Lo más urgente» del chat abre esto */
  /* Fase Móvil · 2.3: saludo dinámico de la mascota, arma la frase con el mismo estado (trab/acc/heroKey) que ya calcula esta función, sin texto nuevo hardcodeado por fuera de estas piezas */
  var nPend = agenda.length; /* Fase 10 · Brief 01 */
  var greet = '', hook = '';
  if(nPend>0){
    /* Fase 10 · Brief 39: nombra solo el primero de la agenda (el más urgente); la lista de abajo ya trae el resto. Nunca cuenta */
    var nom='<b>'+(agenda[0].frase||agenda[0].t)+'</b>';
    /* Fase 11 · saludo de Inicio: sale "Lo demás está en tu lista." (la lista está debajo). Si lo primero está trabado,
       la razón va pegada a lo que explica y no se suma "Toca cada uno…" */
    if(agenda[0].st==='trabado'){
      greet = 'Empieza por '+nom+'. {eps} '+(agenda[0].pc==='negada' ? 'la negó.' : 'no respondió a tiempo.'); /* negada: no dice "a tiempo" porque sí respondió */
      hook = 'No fue culpa tuya, y ya sé qué hacer.';
    } else {
      greet = nPend>1 ? 'Empieza por '+nom+'.' : 'Hoy te toca '+nom+'.';
      hook = nPend>1 ? 'Toca cada uno y te digo cómo.' : 'Tócalo y te digo cómo.';
    }
  } else {
    greet = DOCS_PEND.length ? '' : 'Ya estás al día.'; /* Fase 10 · Brief 47. Fase 11 · Brief 05 (B): con documentos sin organizar solo "Hola, {u}."; lo explica la tarjeta */
  }
  /* Fase 10 · Brief 04: la cara refleja urgencia, no cantidad — trabado → estancado; cita hoy/mañana/por confirmar o algo urgente por vencer → atento; lo demás → calma */
  var estado = trab.length ? 'estancado'
    : (citaF.length || acc.some(function(c){ return c.pc==='urgente'; })) ? 'atento' : 'calma'; /* Fase 10 · Brief 06: trab/acc ya vienen filtrados por en30 */
  /* Fase 11 · Brief 13: lejos (lo accionable fuera de los 30 días) se calcula aquí y lo reutiliza el vacío de abajo; con todo agendado, nada por organizar y nada más adelante, descansa */
  var lejos = CARDS.filter(function(c){return c.st==='accionable' && okFam(c) && !en30(c) && !conBorrador(c);}).sort(function(a,b){ return (diasA(fechaLim(a))||0)-(diasA(fechaLim(b))||0) || a.ord-b.ord; })[0];
  mascotInicio(estado, estado!=='calma' ? 'atenta' : (nPend===0 && !lejos && !DOCS_PEND.length) ? 'descansa' : 'hola'); /* Fase 10 · Rediseño · Brief 14: al día saluda; atento o estancado → atenta */
  /* Fase 11 · saludo de Inicio: sale el gancho aparte de estancado ("{eps} … lo de {p}. No es por algo que hiciste…"); la razón ya va en el saludo, pegada al trámite */
  /* Fase Móvil · burbuja de diálogo: el gancho se envuelve en .mascot-hook para resaltar frente al saludo/conteo (ver styles.css) */
  /* Fase 10 · Brief 07: línea 1 "Hola, {u}." (Outfit) y línea 2 en peso normal (ver mascotSaludo) */
  mascotSaludo(greet + (hook ? ' <span class="mascot-hook">'+hook+'</span>' : ''));
  var h='';
  if(cur==='A1' && tourStep<0) A1_ULT={}; /* Fase 10 · Brief 17 */
  /* Fase 11 · toast desactualizado: "… ya está en «En curso»" solo sale si el trámite sigue en curso (cubre los cambios de estado que no pasan por setCard, como citaResolver o cita.muestras) */
  if(pendingToast && /«En curso»/.test(pendingToast) && (!card(pendingToastKey) || card(pendingToastKey).st!=='encurso')){ pendingToast=null; pendingToastKey=null; }
  if(pendingToast && cur==='A1'){
    A1_ULT.toast=pendingToast; A1_ULT.toastKey=pendingToastKey;
    h += '<div class="toast">'+pendingToast+(undoTipo(pendingToastKey) ? ' <button type="button" class="u" data-undo="1">Deshacer</button>' : '')+'</div>'; /* Fase 11 · Brief 10b */
    pendingToast=null;
  }
  /* Fase 8 · Brief 6.1: toast sin "Deshacer" — conectar correo desde el FAB no se puede deshacer */
  if(pendingNote && cur==='A1'){
    A1_ULT.note=pendingNote;
    h += '<div class="toast">'+pendingNote+'</div>';
    pendingNote=null;
  }
  /* Fase 6 · #19: lo recién resuelto se ve una vez como «Lo último que resolviste» — mismo patrón que bovFresh en la Bóveda.
     Fase 11 · Brief 14: agendar ya no pinta «Confirmada ✓» (lo dicen el aviso y «En curso»).
     Solo se consume cuando Inicio de verdad se muestra (cur==='A1'): resolver dispara renderInicio() mientras el hilo sigue abierto, y esa
     pasada no la debe gastar, o nadie llega a verla al volver. */
  var freshCard = null;
  if(freshConfirmKey && cur==='A1'){
    A1_ULT.fresh=freshConfirmKey;
    freshCard = card(freshConfirmKey);
    if(!freshCard || freshCard.st!=='resuelto') freshCard=null; /* Fase 11 · Brief 14: solo «Lo último que resolviste» */
    /* Fase 8 · Esqueleto 2: la tarjeta recién confirmada respeta el filtro de persona igual que el resto */
    if(freshCard && !okFam(freshCard)) freshCard=null;
    freshConfirmKey=null;
  }
  /* Fase 10 · Brief 39: la fila fresca usa la misma fila que "Por hacer" (todoRowHTML, con tinte y sin franja); resuelto → "Lo último que resolviste" (la pill ya dice Resuelto) */
  if(freshCard){ h += '<div class="fresh-h"><span class="fdot"></span><span>Lo último que resolviste</span></div><div class="todo-list">'+todoRowHTML(freshCard)+'</div>'; }
  /* Fase 10 · Brief 06: "Necesita tu atención" (tarjetas + hero) pasa a la lista "Por hacer": una tarjeta blanca, una fila por trámite, mismo orden de la agenda */
  h += docPendHTML(); /* Fase 10 · Brief 40: arriba de "Por hacer" o del vacío */
  if(nPend>0){
    h += '<h3 class="todo-h">Por hacer</h3><div class="todo-list">';
    agenda.forEach(function(c){ h+=todoRowHTML(c); });
    h += '</div><button type="button" class="link-u todo-more" data-go="F1">Ver todo lo próximo</button>';
  }
  if(nPend===0){
    /* Fase 10 · Brief 06: con un filtro activo, el vacío nombra a la persona */
    /* Fase 10 · Brief 08d: si quedó algo accionable fuera por en30(), el vacío nombra el próximo y lleva al Calendario */
    /* Fase 11 · Brief 14b: lo próximo vive en el Calendario; Inicio solo lleva el enlace */
    if(lejos) h += '<button type="button" class="link-u todo-more" data-go="F1">Ver todo lo próximo</button>'; /* Fase 11 · Brief 14b: sale «Más adelante»; vuelve el enlace de la agenda */
    else if(!(DOCS_PEND.length && bovPerson==='all')) h += (bovPerson!=='all' ? '<div class="empty"><p>Nada por hacer para '+PNAME[bovPerson]+'. Yo sigo pendiente de las fechas.</p></div>' : ''); /* Fase 11 · Brief 13: sin la segunda mascota ni «Todo lo de esta semana…» */
  }
  /* Fase 10 · Brief 06: "En curso" como archivo plegado al final (reemplaza la entrada a Procesos en curso) */
  if(enc.length){
    h += '<button type="button" class="curso-fold'+(cursoOpen?' open':'')+'" data-cursofold="1" aria-expanded="'+cursoOpen+'">'+
      '<span class="curso-fold-ic" aria-hidden="true">'+CURSO_IC+'</span>'+ /* Fase 10 · Rediseño · Brief 11 */
      '<span class="card-main"><span class="todo-t">En curso</span><span class="todo-s">Ya están agendados. Te aviso cuando toque.</span></span>'+
      '<span class="curso-fold-chev" aria-hidden="true">'+CARD_CHEV+'</span></button>';
    if(cursoOpen){ h += '<div class="todo-list gris">'; enc.forEach(function(c){ h+=todoRowHTML(c, true); }); h += '</div>'; }
  }
  A1.innerHTML=fx(tour+h); paintAvatars(A1);
  mascotAInicio(); /* Fase 10 · Brief 05 */
  /* Fase 10 · Brief 07: Inicio sin subtítulo (antes contaba pendientes) */
  renderNotif();
}

var G1el=document.getElementById('G1');
var PNAME={}, INIT={}, PCOL={};
var TINTVAR={MT:'mateo', SF:'sofia', SO:'sonia', MA:'marta'}; /* Fase 10 · Rediseño · Brief 10: tinte del encabezado del hilo (--x-t, escrito desde PROFILES) */
/* Fase 10 · Rediseño · Brief 09: se quita AV_MAP (apuntaba a las variantes oscuras del avatar); todo usa PCOL */
/* Nivel Episodio: la consulta de la que salió cada documento */
var EPIS=[
  {id:'urg', t:'Urgencias',              s:'{hosp2} · {docu}',        d:'19 de septiembre', dcorta:'19/09/26' /* Fase 11 · Brief 01b: fechas de la ficha */ /* Fase 10 · Brief 08b */, p:'{wurg}'},
  {id:'ort', t:'{ep2t}',  s:'{hosp} · {doc3}', d:'7 de octubre', dcorta:'07/10/26', p:'{wort}'},
  {id:'ctr', t:'{t1}',     s:'{sede1} · {docms}',  d:'8 de octubre', dcorta:'08/10/26', p:'{wctr}'},
  {id:'hta', t:'{ep4t}',s:'{eps} · medicina general',     d:'9 de octubre', dcorta:'09/10/26', p:'{whta}'},
  {id:'mg',  t:'Consulta de medicina general', s:'{sede1} · {doc2}', d:'13 de octubre', dcorta:'13/10/26', p:'SO'}, /* Fase 11 · Brief 01b: la consulta de Sonia, cerrada; no crea trámites ni avisos */
  {id:'fon', t:'{ep5t}',  s:'{eps} · {docv}',      d:'18 de junio', dcorta:'18/06/26', p:'{wfon}'},
  {id:'pro', t:'{eppro}', s:'{sede1} · Dra. Paula Rincón', d:'29 de octubre', dcorta:'29/10/26', p:'{wt1}', demo:1}, /* Fase 11 · Brief 01b: corrida con HOY_SIM */ /* Fase 10 · Brief 16: solo tiene documentos en la propia historia */
  {id:'na',  t:'Sin consulta asociada',  s:'Documentos que trajiste por tu cuenta', d:'', p:null}
];
var DOCS=[
  {ep:'urg', t:'{du1}',        s:'Resumen de la atención · 3 hojas', p:'{wurg}', ty:'soporte', pag:3,
   rel:'De esta atención salieron también el {du2b} y la {du3b}.'}, /* Fase 10 · Brief 04: nombra los documentos en vez de contarlos */
  {ep:'urg', t:'{du2}',        s:'Muñeca derecha · 19 de septiembre', /* Fase 11 · Brief 01b */ p:'{wurg}', ty:'resultado', pag:1, cat:'res',
   rel:'Responde a la orden que salió de la consulta de urgencias. El trámite se cerró cuando llegó este resultado.'},
  {ep:'urg', t:'{du3}',s:'Aprobada el 23 de septiembre',        p:'{wurg}', ty:'autorizacion', pill:['Completado','completo'],
   rel:'{eps} la aprobó con la epicrisis de urgencias como soporte.'},
  {ep:'ort', t:'Orden de {t2x}',  s:'{doc3} · 7 de octubre',     p:'{wort}', ty:'orden', pag:1, cat:'ord', th:'cir'},
  {ep:'ort', t:'Historia clínica, 7 de octubre',       s:'7 de octubre · 2 hojas',  p:'{wort}', ty:'soporte', pag:2, /* Fase 8 · Yifrah #1/#2: nombre lleva fecha, ya no coincide con el subtítulo auto de tipoDoc() */
   rel:'La adjunté a la solicitud de autorización de la {t2x}. Es el documento que {eps} exigía.', relth:'cir'},
  {ep:'ort', t:'Autorización de {t2x}',       s:'',                                p:'{wort}', ty:'autorizacion', dyn:'cir', th:'cir'},
  {ep:'ort', t:'Exámenes previos a la {t2x}', s:'Resultado · 16 de octubre',        p:'{wort}', ty:'resultado', pag:1, cat:'res', lab:true,
   rel:'Lo pidió el {doc3} en la misma consulta, como examen previo a la {t2x}.', relth:'cir'},
  {ep:'ctr', t:'Orden de {t1l}',   s:'{docms} · 8 de octubre',     p:'{wctr}', ty:'orden', cat:'ord', pill:['Vigente','espera'], th:'ped'},
  /* Fase 11 · Brief 14b: la orden de {labl} es de papel; ya no está en DOCS, nace al escanearla (ver lipDoc en el guardado del escaneo) */
  {ep:'hta', t:'Fórmula médica {t3}',  s:'3 entregas · la última en diciembre', p:'{whta}', ty:'orden', cat:'med', pill:['En curso','espera'], th:'med'},
  {ep:'fon', t:'Orden de {tvl}', s:'{docv} · 18 de junio',   p:'{wfon}', ty:'orden', cat:'ord', pill:['Por agendar','pendiente'], go:'G2'}, /* Fase 10 · Brief 06: "Por agendar" */
  {ep:'mg',  t:'Historia clínica, 13 de octubre', s:'13 de octubre · 1 hoja', p:'SO', ty:'soporte', pag:1,
   rel:'Chequeo de rutina. No dejó órdenes pendientes.'}, /* Fase 11 · Brief 01b */
  {ep:'na',  t:'Carné de vacunación',           s:'{p1} · actualizado en junio',    p:'{wna}', ty:'certificado', pag:1,
   rel:'No salió de ninguna consulta: lo escaneaste tú. Te lo recuerdo cuando hay un {t1l}.'}
];
/* Fase 10 · Brief 01: copia para que el reinicio quite los resultados que agregan las citas */
var DOCS0=JSON.parse(JSON.stringify(DOCS));
/* Fase 10 · Brief 08f: pills de lo que se guardó sin un dato; el visor ofrece completarlo */
var FALTA_PROC=['Falta el procedimiento','pendiente'], FALTA_MED=['Falta el médico','pendiente'];
var FALTA_CAMPO={'Falta el procedimiento':{k:'Procedimiento', ph:'Escribe el procedimiento', f:'proc'}, 'Falta el médico':{k:'Médico tratante', ph:'Nombre del médico', f:'med'}};
var TYPES=[['all','Todos'],['orden','Órdenes'],['autorizacion','Autorizaciones'],['resultado','Resultados'],['soporte','Historias clínicas'],['certificado','Certificados']];
/* Fase 11 · Brief 05 (B): «Fotos» solo sale en «Tipo» cuando hay al menos una guardada */
function tiposBov(){ return DOCS.some(function(d){ return d.ty==='imagen'; }) ? TYPES.concat([['imagen','Fotos']]) : TYPES; }
/* Fase 11 · Brief 05 (A): temas de salud de «Todos los documentos» (nombre interno; "condición" no sale en pantalla).
   Salen de las consultas que ya existen (ep) y no generan avisos ni tarjetas. Cada documento va al tema de su consulta, bajo su persona;
   el carné va a «Vacunas». Una consulta sin tema sale con su propio nombre y lo que no tiene consulta, en «Sin consulta asociada» */
var TEMAS=[
  {id:'chequeo',  t:'Chequeo general',          eps:['mg'],  esp:'Medicina general'},
  {id:'crec',     t:'Controles de crecimiento', eps:['ctr'], esp:'Pediatría'},
  {id:'vacunas',  t:'Vacunas',                  carne:true,  esp:'Carné de vacunación'},
  {id:'lenguaje', t:'Terapia de lenguaje',      eps:['fon'], esp:'Fonoaudiología'},
  {id:'hta',      t:'Hipertensión',             eps:['hta'], esp:'Medicina general'},
  {id:'catarata', t:'Cataratas',                eps:['ort'], esp:'Oftalmología'},
  {id:'muneca',   t:'Lesión de muñeca',         eps:['urg'], esp:'Urgencias'}
];
var TEMAS_ORDEN=['SO','SF','MT','MA']; /* Sonia, Sofía, Mateo, Marta */
var bovPerson='all', bovType='all', bovFrom=null, bovKeep=false, bovQuery='';
/* Fase 6 · portada de la Bóveda: null=portada, 'ord'|'res'|'med'=carpeta, 'all'=Todos los documentos.
   Fase 10 · corrección Bóveda: sale bovFreshFolder. La Bóveda abre siempre en la portada; lo recién guardado
   sigue saliendo primero en "Todos" (bovFresh). Los botones con data-bovcat siguen abriendo su carpeta */
var bovFolder=null;
function bovReset(){
  bovPerson='all'; bovType='all'; bovFrom=null; bovQuery='';
  bovFolder=null; /* Fase 10 · corrección Bóveda */
}
/* Fase 10 · Brief 19: lo recién guardado queda marcado (d.nuevo); BOVNEW = carpetas de la portada con punto de "nuevo"
   (se apaga al abrir cada una) y bovAviso = el aviso "Guardé N documentos" de Avisos (el siguiente guardado lo reemplaza) */
var BOVNEW={}, bovAviso=null;
function bovMarcarNuevos(docs){
  docs=(docs||[]).filter(Boolean); if(!docs.length) return;
  DOCS.forEach(function(d){ delete d.nuevo; });
  BOVNEW={all:true};
  docs.forEach(function(d){ d.nuevo=true; if(d.cat) BOVNEW[d.cat]=true; });
  bovAviso=docs;
  renderNotif();
}
function docIcon(){ return '<span class="doc-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--r-texto)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/></svg></span>'; }
var TYNAME={orden:'Orden médica',autorizacion:'Autorización',resultado:'Resultado',soporte:'Historia clínica',certificado:'Certificado',
  mensaje:'Mensaje de la EPS', /* Fase 10 · Brief 03: la cita que llega pegando texto */
  imagen:'Foto'}; /* Fase 11 · Brief 05 (B): las fotos que la cámara no alcanzó a leer */
function parentescoDe(code){
  if(code==='SO') return '';
  var rel = {MT:V.r2, SF:V.r1, MA:V.r3}[code];
  return relDeStr(rel); /* Fase 11 · Brief 04b (A) */
}
function tipoDoc(d){ return d.ty==='soporte' ? 'Resumen de la consulta' : TYNAME[d.ty]; }
/* Fase 6 · fila de documento, compartida entre "Todos" (agrupado por consulta, ícono genérico) y las
   carpetas planas (avatar de la persona en vez de ícono, sin la línea de árbol) — misma lógica de
   subtítulo/píldora/destino en los dos casos, para no duplicarla. */
/* Fase 10 · Brief 05: ¿el documento tiene algo pendiente? Misma fuente de la píldora que docRowHTML */
function docPill(d){ /* Fase 10 · Brief 08d: la orden de {labl} dice "Por agendar" mientras el trámite espera cita */
  if(d.vencida) return ['Vencida','espera']; /* Fase 10 · Brief 21 (corrección 2): la reemplazó la orden nueva */
  if(d.th && (d.ty==='orden' || d.dyn) && tramCerrado(d.th)) return ['Cerrado','espera']; /* Fase 10 · Brief 20: trámite cerrado con "Ya no la necesito" */
  if(d.th==='lip' && d.ty==='orden'){ var l=card('lip'); if(l && (l.st==='accionable' || l.st==='trabado')) return ['Por agendar','pendiente']; }
  /* Fase 10 · Brief 19: la orden de la cirugía sigue el estado de cir, igual que Inicio. Aprobada (bov 'completo') → sin pill */
  if(d.th==='cir' && d.ty==='orden' && !d.dyn){
    var c=card('cir');
    if(c && c.st!=='oculto' && !(c.bov && c.bov[2]==='completo')){
      if(c.st==='accionable') return ['Por radicar','pendiente'];
      if(c.st==='encurso') return ['En trámite','espera'];
      if(c.st==='trabado') return [c.pill, c.pc];
    }
  }
  return d.pill;
}
/* Fase 10 · Brief 20: ¿el trámite quedó cerrado (descartado)? Su orden y su autorización dicen "Cerrado" y la hoja ofrece reabrirlo */
function tramCerrado(k){ var c=card(k); return !!c && c.st==='descartado'; }
function docPend(d){
  var pill = d.dyn && !tramCerrado(d.dyn) ? (card(d.dyn).bov||[0,0,'pendiente']).slice(1) : docPill(d);
  return !!(pill && pill[1]==='pendiente');
}
/* Fase 10 · Brief 05 · Brief 34: cola de .epi-h plegable = contador de documentos + flecha, igual en «Lo que encontré» y en la Bóveda.
   Sale el punto de pendiente; en la Bóveda la pill «Pendiente» pasa a la segunda línea (epiPendHTML) */
function epiPendHTML(docs){ return docs.some(docPend) ? '<span class="pill pendiente epi-pend">Pendiente</span>' : ''; }
/* Fase 10 · Brief 44b: fecha = ep.dcorta. Con fecha, la cola es una columna de dos pisos (fecha arriba; contador y flecha abajo)
   alineada arriba con el título; sin fecha («Sin consulta asociada») queda solo el piso de abajo, centrado como antes */
function epiColaHTML(docs, fecha){
  var n=docs.length;
  return '<span class="epi-cola'+(fecha?' con-fecha':'')+'">'+(fecha?'<span class="epi-fecha">'+fecha+'</span>':'')+
    '<span class="epi-cola-fila"><span class="epi-n" role="img" aria-label="'+n+' documento'+(n===1?'':'s')+'">'+n+'</span>'+ /* Fase 10 · Brief 41b: vuelve al número solo */
    '<svg class="epi-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span></span>';
}
/* Fase 10 · Rediseño · Brief 11: hilo=true (Bóveda · documentos, lienzo 49 opción D): sin ícono de documento; tarjeta blanca con
   título, pill y flecha, y un punto del color de la persona sobre la línea de la consulta (--pc, del contenedor) */
function docRowHTML(d, flat, hilo, quieta){ /* Fase 10 · Brief 46: quieta = lo que todavía no está guardado («Lo que encontré», #famDocsList): <div> sin flecha ni data-docv */
  if(hilo){
    var hp=docPill(d);
    if(d.dyn && !tramCerrado(d.dyn)){ var hb=card(d.dyn).bov||['','Por radicar','pendiente']; hp=[hb[1],hb[2]]; }
    /* Fase 10 · Brief 29: .doc-fila sin ícono ni subtítulo, con el punto sobre la línea */
    return (quieta ? '<div class="doc-fila">' : '<button type="button" class="doc-fila"'+(d.go ? ' data-go="'+d.go+'"' : ' data-docv="'+DOCS.indexOf(d)+'"')+'>')+
      '<span class="epi-d-dot" aria-hidden="true"></span><span class="card-main"><span class="doc-t">'+d.t+'</span></span>'+
      (hp?'<span class="pill '+hp[1]+'">'+hp[0]+'</span>':'')+
      (quieta ? '</div>' : '<span class="doc-chev" aria-hidden="true">'+CARD_CHEV+'</span></button>');
  }
  var sub=d.s, pill=docPill(d);
  if(d.dyn && !tramCerrado(d.dyn)){ var b=card(d.dyn).bov||['{p3} · sin radicar','Por radicar','pendiente']; /* Fase 11 · Brief 01b */ /* Fase 10 · Brief 06: "Por radicar" */ sub=b[0].replace(/^[^·]+ · /,''); pill=[b[1],b[2]]; }
  else if(!pill){ sub = tipoDoc(d)+(d.pag ? ' · '+d.pag+' página'+(d.pag===1?'':'s') : ''); } /* Fase 10 · Brief 05: sin pag, no se muestra (antes "undefined páginas") */
  var target = d.go ? ' data-go="'+d.go+'"' : ' data-docv="'+DOCS.indexOf(d)+'"';
  var icon;
  if(flat){ var pcode=fx(d.p); icon='<span class="av" data-p="'+pcode+'" style="background:'+PCOL[pcode]+'">'+pcode+'</span>'; }
  else icon=docIcon();
  return '<button type="button" class="doc-fila"'+target+'>'+icon+ /* Fase 10 · Brief 29: Fila de documento (avatar 40 en carpetas) */
     '<span class="card-main"><span class="doc-t">'+d.t+'</span><span class="doc-s">'+sub+'</span></span>'+
     (pill?'<span class="pill '+pill[1]+'">'+pill[0]+'</span>':'')+
     '<span class="doc-chev" aria-hidden="true">'+CARD_CHEV+'</span></button>'; /* Fase 10 · Brief 06: flecha, la fila es tocable */
}
/* Fase 6 · portada de la Bóveda: 4 carpetas, conteos respetan el filtro de persona (bovPerson) */
var FOLDER_LABELS={ord:'Órdenes médicas', res:'Resultados de exámenes', med:'Medicamentos'};
function bovCatCount(cat){
  return DOCS.filter(function(d){
    var okP = bovPerson==='all' || fx(d.p)===bovPerson;
    var okCat = cat==='all' ? true : d.cat===cat;
    return okP && okCat;
  }).length;
}
/* Fase 10 · Brief 41: "Nuevo" solo distingue si algunas carpetas con documentos están marcadas y otras no; "Todos los documentos" nunca lo lleva */
function bovNuevoDistingue(){
  var conDocs=['ord','res','med'].filter(function(c){ return bovCatCount(c)>0; });
  return conDocs.some(function(c){ return !BOVNEW[c]; });
}
function bovCatCard(cat, label, icon){
  var n=bovCatCount(cat), empty=(n===0);
  var countTxt = empty ? 'Nada guardado aquí' : (n+' documento'+(n===1?'':'s'));
  var tag = empty ? 'div' : 'button';
  var nuevo = cat!=='all' && !empty && BOVNEW[cat] && bovNuevoDistingue(); /* Fase 10 · Brief 20: etiqueta "Nuevo" en vez del punto del Brief 19 · Brief 41: solo donde distingue */
  return '<'+tag+(empty?'':' type="button" data-bovcat="'+cat+'"')+(nuevo?' aria-label="'+label+', tiene documentos nuevos"':'')+' class="bov-cat bov-cat--'+cat+(empty?' vacia':'')+'">'+ /* Fase 10 · Brief 31: 'vacia' en vez de 'empty', que heredaba el bloque de pantalla vacía */
    '<span class="bov-cat-ic">'+icon+'</span>'+
    (nuevo ? '<span class="pill nuevo" aria-hidden="true">Nuevo</span>' : '')+
    '<span class="bov-cat-t">'+label+'</span>'+
    /* Fase 10 · Rediseño · Brief 11: el conteo de hoy más los puntos de las personas con documentos en la carpeta (lienzo 54) */
    '<span class="bov-cat-f"><span class="bov-cat-n">'+countTxt+'</span>'+bovCatDots(cat)+'</span></'+tag+'>';
}
function bovCatDots(cat){
  var ps=[];
  DOCS.forEach(function(d){
    var p=fx(d.p);
    if((bovPerson==='all' || p===bovPerson) && (cat==='all' || d.cat===cat) && PCOL[p] && ps.indexOf(p)<0) ps.push(p);
  });
  if(!ps.length) return '';
  return '<span class="bov-cat-dots" aria-hidden="true">'+ps.map(function(p){ return '<span style="background:'+PCOL[p]+'"></span>'; }).join('')+'</span>';
}
/* Fase 10 · Brief 16: la etiqueta "Solo en esta demo" en una fila; no es botón (Fase 11 · Brief 01: sale #obDemo) */
var DEMO_TAG='<span class="chip-sim ob-demo en-fila"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 5v14l8-7zM12 5v14l8-7z"/></svg>Solo en esta demo</span>';
/* Fase 10 · Brief 19: ¿la persona ya confirmó quién es esta persona? (la dueña, lo agregado en el paso 3 o lo confirmado en la detección) */
function relConfirmada(code){
  if(code==='SO') return true;
  var id=detSlot(code);
  return obAgregados.indexOf(id)>=0 || !!(detOk && DETECT[id] && DETECT[id].si && !DETECT[id].fuera); /* Fase 11 · Brief 02 */
}
/* Fase 10 · Brief 35: pend = pill «Pendiente» a 8 del nombre (solo en la Bóveda); bov = sin la etiqueta de demo, como antes en la Bóveda */
function epiHeaderHTML(ep, pend, bov){
  if(!ep.p) return '<span class="epi-t"><b>'+ep.t+'</b><small>'+ep.s+'</small></span>';
  /* Fase 10 · Brief 19: la relación solo sale para ti y para quien agregaste en el paso 3 o confirmaste en la detección */
  var par=relConfirmada(ep.p) ? parentescoDe(ep.p) : '';
  /* Fase 6 · tarjeta menos cargada: sede y doctor ya viven con detalle en el visor del documento (#11) — aquí solo lo que ubica de un vistazo */
  return '<span class="epi-t"><b>'+ep.t+'</b>'+ /* Fase 10 · Brief 44b: la fecha sube a la cola (epiColaHTML); el título usa todo el ancho */
    (pend ? '<small class="epi-sub"><span>'+PNAME[ep.p]+(par?' · '+par:'')+'</span>'+pend+'</small>' : '<small>'+PNAME[ep.p]+(par?' · '+par:'')+'</small>')+
    (ep.demo && !bov ? DEMO_TAG : '')+'</span>'; /* Fase 10 · Brief 16 */
}
/* Fase 10 · Brief 35: un solo orden de consultas para la Bóveda y «Lo que encontré»: la fecha más reciente arriba (dcorta dd/mm/aa),
   a igual fecha el orden de EPIS, «Sin consulta asociada» al final. Lo recién guardado lo sube renderBovResults() */
function epiOrden(){
  var k=function(ep){ var m=(ep.dcorta||'').split('/'); return m.length===3 ? +(m[2]+m[1]+m[0]) : -1; };
  return EPIS.map(function(ep,i){ return {ep:ep, i:i}; }).sort(function(a,b){
    var na=(a.ep.id==='na')-(b.ep.id==='na');
    return na || (k(b.ep)-k(a.ep)) || (a.i-b.i);
  }).map(function(o){ return o.ep; });
}
/* Fase 6 · editable=true agrega un lápiz sobre el avatar para elegir ícono (antes solo Mateo lo tenía, vía I3).
   Va como botón hermano del de navegación, no anidado, para no meter un <button> dentro de otro. */
/* Fase 11 · Brief 01: grouped=true (solo #FAM) muestra "Tú" y "Tu familia"; sale el nivel de cuidado. Los excluidos no aparecen */
function famRows(attr, sub, editable, grouped){
  var h='', grp=null;
  var orden = SLOTS.filter(function(k){ return !personaFuera(k); });
  /* 'X:id' = persona que solo existe por la detección (ej. Carlos Rincón si no se excluye): fila sin perfil que abrir */
  if(grouped) orden = orden.concat(detExtrasIn().map(function(id){ return 'X:'+id; }));
  orden.forEach(function(k){
    if(grouped){
      var g = k==='SO' ? 'Tú' : 'Tu familia'; /* Fase 11 · Brief 01: dos grupos, sin línea de consecuencia */
      if(g!==grp){ grp=g; h+='<div class="wgt-lbl">'+g+'</div>'; }
    }
    if(k.indexOf('X:')===0){ h+=detExtraRow(k.slice(2)); return; }
    var nm = k==='SO' ? V.u : PNAME[k];
    var rel = k==='SO' ? 'Tú' : ({MT:V.r2, SF:V.r1, MA:V.r3})[k];
    var cnt = DOCS.filter(function(d){ return fx(d.p)===k; }).length;
    var val = attr==='data-setwho' ? (k+'|'+(k==='SO'?'Tú':nm)) : k;
    var row = '<button type="button" class="fam-r" '+attr+'="'+val+'">'+
       '<span class="av" data-p="'+k+'" style="background:'+PCOL[k]+'">'+INIT[k]+'</span>'+
       '<span class="card-main"><span class="card-title" style="font-size:var(--fs-cuerpo);">'+(grouped ? nombreCompleto(k, ((PROFILE_EDITS[k]||{}).nm||'').trim()||undefined) : (k==='SO'&&attr!=='data-go'?'Tú':nm))+'</span>'+ /* Fase 11 · Brief 04b (A): en Familia, nombre completo */
       '<span class="card-sub">'+(grouped ? (k==='SO' ? ['Tú', edadDe('SO')].filter(Boolean).join(' · ') : rel) : (k==='SO'?V.u:rel))+(sub?' · '+cnt+' documento'+(cnt===1?'':'s'):'')+'</span></span>'+ /* y debajo la edad (con la relación, si se agregó) */
       (attr==='data-go'?'<span class="chev">'+CARD_CHEV+'</span>':'')+'</button>';
    if(editable){
      h+='<div class="fam-r-row">'+row+
        '<button type="button" class="av-badge av-badge-sm" data-iconpick="'+k+'" aria-label="Elegir ícono para '+nm+'">'+
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>'+
        '</button></div>';
    } else h+=row;
  });
  return h;
}
function buildFamLists(){
  var w=document.getElementById('whoList'); if(w) w.innerHTML=famRows('data-setwho', false);
  /* Fase 10 · Brief 30: el toast de «Agregar familiar» sale una vez, y el botón solo si queda alguien de la historia por agregar */
  var ft = famToast ? '<div class="toast" role="status">'+famToast+'</div>' : ''; famToast=null;
  var g=document.getElementById('famScreen'); if(g) g.innerHTML=ft+famRows('data-go2', false, true, true)+
    /* Fase 10 · Brief 02: misma fila "Próximamente" de Configuración; no abre nada */
    '<div class="menu-i soon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>Invitar a alguien que te ayude<span class="tag-soon">Próximamente</span></div>'+
    (famSiguiente() ? '<button type="button" class="btn-p" data-go="I1" style="margin-top:var(--esp-s);">Agregar familiar</button>' : ''); /* Fase 10 · Brief 30: sale del HTML fijo de #FAM */
  paintAvatars(document);
}

/* ============================================================
   Fase 6 · PERFIL DE PERSONA (I3) — editar y eliminar
   I3 era una pantalla fija para Mateo; ahora se parametriza por i3Key (a quién
   se tocó en Familia) y alterna entre vista y edición en la misma pantalla
   (mismo mecanismo de la app: togglear qué bloque se pinta, no una pantalla
   aparte). Las ediciones (PROFILE_EDITS) son de esta sesión — "Reiniciar demo"
   las deshace — y desde Fase 8 · Estructura 1 sí se propagan a V/PNAME/INIT.
   "Eliminar perfil" sigue sin hacer nada real: se muestra atenuado.
   ============================================================ */
function i3Name(k){
  var e=PROFILE_EDITS[k];
  if(e && e.nm && e.nm.trim()) return e.nm.trim().split(/\s+/)[0]; /* Fase 11 · Brief 04b (A): el perfil guarda el nombre completo; la app usa el primero */
  return k==='SO' ? V.u : PNAME[k];
}
/* token de parentesco (p.ej. "Hijo") a partir del dato combinado que ya usa famRows/parentescoDe ("Hijo · 8 años").
   Fase 10 · Brief 43: la relación es texto libre, así que el token se usa tal cual (antes se descartaba si no estaba en RELS) */
function i3RelToken(k){
  if(k==='SO') return '';
  return parentescoDe(k);
}
function i3RelLabel(p){ return p.rel==='Otro' ? (p.otro||'Otro') : p.rel; }
function i3Subtitle(k){
  if(k==='SO') return 'Tú';
  var e=PROFILE_EDITS[k];
  if(e){
    var relLabel = e.rel ? i3RelLabel(e) : i3RelToken(k); /* Fase 11 · Brief 04b (A) */ /* sin relación no hay "—" */
    var edadLabel = edadDe(k); /* Fase 10 · Rediseño · Brief 13b (corrección): sin fecha, la edad de la historia */
    return [relLabel, edadLabel].filter(Boolean).join(' · ');
  }
  return ({MT:V.r2, SF:V.r1, MA:V.r3})[k];
}
function i3DateRow(k){
  var e=PROFILE_EDITS[k];
  if(e){
    if(e.approx) return {label:'Edad aproximada', value:e.edadAprox+' años aprox.'};
    if(e.nac) return {label:'Fecha de nacimiento', value:fechaLarga(e.nac)||e.nac}; /* Fase 10 · Rediseño · Brief 13b (corrección): mismo formato que la historia */
  }
  if(k==='MT' && V.nac2) return {label:'Fecha de nacimiento', value:V.nac2};
  if(OB_APROX[k]) return {label:'Edad aproximada', value:OB_APROX[k]+' años aprox.'}; /* Fase 10 · Brief 18 */
  if(OB_NAC[k]) return {label:'Fecha de nacimiento', value:fechaLarga(OB_NAC[k])}; /* Fase 10 · Rediseño · Brief 13b */
  return null;
}
/* Fase 8 · Estructura 1: propaga nombre/parentesco/edad a V/PNAME/INIT — lo que ya
   lee el resto de la app vía fx()/PNAME[]/INIT[]. 'SO' no tiene parentesco (eres tú
   mismo) y sigue mostrándose como "Tú" en todas partes salvo {u}, mismo criterio ya
   aceptado para el perfil propio. */
function propagateI3Edit(k){
  var full=PROFILE_EDITS[k].nm.trim().replace(/\s+/g,' '), nm=full.split(' ')[0], ini=obInitials(nm); /* Fase 11 · Brief 04b (A): el campo trae el nombre completo; {pN}/{u} es el primero y {fN}/{fu} el completo */
  if(k==='SO'){ V.u=nm; V.iu=ini; if(full!==nm) V.fu=full; }
  else {
    var relEdad=i3Subtitle(k); // ya combina "relación · edad" con el mismo criterio que ve I3
    if(k==='SF'){ V.p1=nm; V.r1=relEdad; V.i1=ini; }
    else if(k==='MT'){ V.p2=nm; V.r2=relEdad; V.i2=ini; }
    else if(k==='MA'){ V.p3=nm; V.r3=relEdad; V.i3=ini; }
    if(full!==nm && OB_N[k]) V['f'+OB_N[k]]=full; /* Fase 11 · Brief 04b (A) */
  }
  refrescarPersonas();
}
/* Fase 10 · Brief 03: el mismo refresco, compartido con la detección de personas (detConfirmar) */
function refrescarPersonas(){
  buildPeople();
  renderInicio();
  buildFamLists(); updateChip(); paintAvatars(document);
}
function i3DocCount(k){ return DOCS.filter(function(d){ return fx(d.p)===k; }).length; }
var I3_PENCIL='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
function i3AvatarHTML(k){
  return '<div style="display:flex;justify-content:center;padding:var(--esp-s) 0 var(--esp-xs);position:relative;">'+
    '<span class="av av-ficha" data-p="'+k+'" style="background:'+PCOL[k]+'">'+INIT[k]+'</span>'+ /* Fase 10 · Brief 27: medidas a .av-ficha */
    '<button type="button" class="av-badge" data-iconpick="'+k+'" aria-label="Elegir ícono" style="position:absolute;left:50%;bottom:6px;transform:translateX(38px);">'+I3_PENCIL+'</button>'+
    '</div>';
}
/* Fase 10 · Brief 19 (corrección 3): "Nombre" = nombre (editado o no) + apellidos de la persona (nombreCompleto); en la propia historia, solo el nombre */
function i3ViewHTML(k){
  var dateRow=i3DateRow(k), cnt=i3DocCount(k), h='';
  h+=i3AvatarHTML(k);
  h+='<div class="doc-in"><span class="card-main"><span class="card-sub" style="margin:0">Nombre</span><span class="doc-t">'+nombreCompleto(k, ((PROFILE_EDITS[k]||{}).nm||'').trim() || i3Name(k))+'</span></span></div>';
  if(dateRow){
    h+='<div class="doc-in"><span class="card-main"><span class="card-sub" style="margin:0">'+dateRow.label+'</span><span class="doc-t">'+dateRow.value+'</span></span></div>';
  } else {
    h+='<div class="doc-in"><span class="card-main"><span class="card-sub" style="margin:0">Fecha de nacimiento</span><span class="doc-t" style="font-size:var(--fs-secundario);font-weight:var(--fw-regular);color:var(--r-texto-2);">Sin fecha registrada — puedes agregarla desde «Editar información»</span></span></div>';
  }
  h+='<button type="button" class="doc-in" data-bov="'+k+'"><span class="card-main"><span class="card-sub" style="margin:0">Documentos guardados</span><span class="doc-t">'+cnt+' en la Bóveda</span></span><span class="chev">'+CARD_CHEV+'</span></button>';
  h+='<button type="button" class="btn-s" data-i3edit="1">Editar información</button>';
  /* no tiene sentido eliminarte a ti mismo de tu propia familia */
  /* Fase 8 · Estructura 1: "Eliminar perfil" no elimina nada de verdad — atenuado con "Próximamente",
     mismo patrón que Configuración, en vez de fingir una confirmación destructiva que no ocurre */
  if(k!=='SO') h+='<button type="button" class="btn-danger soon" disabled>Eliminar perfil<span class="tag-soon">Próximamente</span></button>';
  return h;
}
/* Fase 11 · Brief 04b (A): el dato salió de los documentos (no lo escribió la persona): el nombre completo y la fecha de la historia */
function i3DeDocs(k, campo){
  if(k==='SO' || esPropia()) return false;
  var o=PROFILES[PROF], n=OB_N[k]; if(!n) return false;
  if(campo==='nm') return i3Edit.nm.trim()===(o.v['f'+n]||'');
  var orig = k==='MT' ? o.v.nac2raw : (o.nac||{})[k];
  return !i3Edit.approx && !!orig && i3Edit.nac===orig;
}
function i3EditHTML(k){
  var p=i3Edit, h='';
  h+=i3AvatarHTML(k);
  h+='<div class="field"><label>Nombre</label><input class="ob-inp" type="text" id="i3fNm" placeholder="Nombre completo" value="'+p.nm.replace(/"/g,'&quot;')+'">'+
     (i3DeDocs(k,'nm') ? '<p class="helper">Así aparece en sus documentos.</p>' : '')+'</div>'; /* Fase 11 · Brief 04b (A) */
  if(p.approx){
    h+='<div class="field"><label>Edad aproximada</label><input class="ob-inp'+(p.nacErr?' err':'')+'" type="text" inputmode="numeric" maxlength="3" id="i3fEdad" placeholder="Años" value="'+p.edadAprox.replace(/"/g,'&quot;')+'">'+
      (p.nacErr
        ? '<p class="err-msg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>'+p.nacErr+'</p>'
        : '<p class="helper">Me ayuda a saber qué controles y exámenes le tocan según la edad.</p>')+ /* Fase 10 · Brief 18: sin vacunas */
      '<button type="button" class="ob-link" data-i3toggleaprox="1">Sí sé la fecha exacta</button></div>';
  } else {
    h+='<div class="field"><label>Fecha de nacimiento</label><input class="ob-inp'+(p.nacErr?' err':'')+'" type="text" inputmode="numeric" maxlength="10" id="i3fNac" placeholder="dd / mm / aaaa" value="'+p.nac.replace(/"/g,'&quot;')+'">'+
      (p.nacErr
        ? '<p class="err-msg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>'+p.nacErr+'</p>'
        : '<p class="helper">'+(i3DeDocs(k,'nac') ? 'La calculé con la edad exacta de sus documentos. Puede tener un día de diferencia: corrígela si hace falta.' : 'Me ayuda a saber qué controles y exámenes le tocan según la edad.')+'</p>')+ /* Fase 10 · Brief 18: sin vacunas. Fase 11 · Brief 04b (A): de dónde salió la fecha */
      '<button type="button" class="ob-link" data-i3toggleaprox="1">No sé la fecha exacta</button></div>';
  }
  if(k!=='SO'){
    /* Fase 8 · Yifrah #9: "Parentesco" → "Relación" */
    h+='<div class="field"><label>Relación (opcional)</label><div class="sel-wrap">'+ /* Fase 11 · Brief 04b (A) */
       '<button type="button" class="box'+(p.rel?' filled':'')+'" data-i3relopen="1" style="width:100%;">'+
       '<span>'+(p.rel ? i3RelLabel(p) : 'Seleccionar')+'</span><span class="chev">'+CHEV_D+'</span></button></div>'+
       '<p class="helper">Si la agregas, aparece junto a su nombre.</p></div>';
  }
  var dirty = JSON.stringify(p) !== JSON.stringify(i3EditOrig);
  var ready = dirty && p.nm.trim() && (p.approx ? edadAproxValida(p.edadAprox).ok : fechaValida(p.nac).ok) && (k==='SO' || !p.rel || p.rel!=='Otro' || p.otro.trim()); /* Fase 11 · Brief 04b (A) */ /* la relación es opcional */
  /* Fase 8 · Reauditoría Yifrah: el CTA nombra también a quién, y solo se habilita si de verdad hay
     algo que guardar (ver i3EditOrig más abajo) */
  var saveLabel = k==='SO' ? 'Guardar mis cambios' : 'Guardar cambios de '+i3Name(k);
  h+='<button type="button" class="btn-p" data-i3save="1"'+(ready?'':' disabled')+'>'+saveLabel+'</button>';
  h+='<button type="button" class="btn-s" data-i3cancel="1">Cancelar</button>';
  return h;
}
function renderI3(){
  var k=i3Key||(i3Key='MT');
  var el=byId.I3;
  var title=k==='SO' ? 'Tu perfil' : 'Perfil de '+i3Name(k), sub=i3Subtitle(k);
  el.setAttribute('data-title', title);
  el.setAttribute('data-sub', sub);
  /* Fase 6 · a diferencia de F2/G1 (que solo se re-renderizan al entrar vía show()), I3 se vuelve a
     pintar sin pasar por show() (guardar, cancelar, togglear aproximada) — sin esto el título/subtítulo
     del header quedaban con el valor viejo aunque el cuerpo de la pantalla sí se actualizara. */
  if(cur==='I3'){ tTitle.textContent=title; tSub.textContent=sub; }
  var body=document.getElementById('i3Body');
  if(body) body.innerHTML = i3Editing ? i3EditHTML(k) : i3ViewHTML(k);
  if(!i3Editing){ var rs=document.getElementById('i3RelSheet'); if(rs) rs.style.display='none'; }
  paintAvatars(el);
}
function i3EnterEdit(k){
  var e=PROFILE_EDITS[k];
  if(e){
    i3Edit={nm:e.nm||i3Name(k), nac:e.nac||'', approx:!!e.approx, edadAprox:e.edadAprox||'', rel:e.rel||'', otro:e.otro||'', nacErr:''};
  } else {
    i3Edit={nm:nombreCompleto(k, i3Name(k)) /* Fase 11 · Brief 04b (A): el nombre como aparece en sus documentos */, nac:(k==='MT'?(V.nac2raw||''):(OB_NAC[k]||'')), approx:!!OB_APROX[k], edadAprox:OB_APROX[k]||'', rel:i3RelToken(k), otro:'', nacErr:''}; /* Fase 10 · Brief 18: approx desde el paso 3 */
  }
  /* Fase 8 · Reauditoría Yifrah: copia de los valores al entrar, para saber si de verdad hubo
     cambios antes de habilitar "Guardar" — ver dirty en i3EditHTML() */
  i3EditOrig=JSON.parse(JSON.stringify(i3Edit));
  i3Editing=true;
  renderI3();
}
function renderI3RelSheet(){
  var sheet=document.getElementById('i3RelSheet'); if(!sheet || !i3Edit) return;
  document.getElementById('i3RelList').innerHTML=relPickerHTML(i3RelLabel(i3Edit), 'data-i3rel="{v}"', 'i3'); /* Fase 10 · Brief 43 */
}
function openI3RelSheet(){ renderI3RelSheet(); document.getElementById('i3RelSheet').style.display='flex'; }

/* ===== Fase 6 · H01: visor de documento ===== */
function openViewer(ix){
  var d=DOCS[parseInt(ix,10)];
  if(!d){ return; }
  d=Object.assign({}, d); d.p=fx(d.p);
  var nombre=fx(nombreCompleto(d.p)||PNAME[d.p]||''); /* Fase 10 · Brief 19 (corrección): el paciente, como lo dice el documento */
  var ep=null; EPIS.forEach(function(e){ if(e.id===d.ep) ep=e; });
  var entidad='', medico='', fecha='', fechaLarga='';
  if(ep && ep.id!=='na'){
    var partes=(ep.s||'').split(' · ');
    entidad=fx(partes[0]||''); medico=fx(partes[1]||'');
    fecha=fx(ep.dcorta||''); fechaLarga=ep.d?fx(ep.d)+' de 2026':'';
  }
  if(d.fv) fecha=d.fv; /* Fase 10 · Brief 21 (corrección 2): la orden nueva trae su fecha, no la de la consulta */
  var falta = d.pill && FALTA_CAMPO[d.pill[0]]; /* Fase 10 · Brief 08f */
  if(d.med) medico=d.med; else if(d.fscan) medico=''; /* la fórmula escaneada solo muestra el médico que se escribió */
  var fix=document.getElementById('vFix');
  fix.hidden=!falta;
  fix.innerHTML = falta ? '<div class="exrow warn"><label class="card-main"><span class="ex-k">'+falta.k+'</span><input type="text" class="exinp" id="vFixInp" placeholder="'+falta.ph+'" autocomplete="off"></label></div>'+
    '<button type="button" class="btn-p" data-vfix="'+ix+'">Guardar</button>' : '';
  document.getElementById('vTitle').textContent=fx(d.t);
  document.getElementById('vSub').textContent=fx(PNAME[d.p])+' · '+tipoDoc(d);
  /* Fase 8 · Yifrah #6: el certificado (Carné de vacunación) no viene de la EPS — su cabecera dice "Subido por ti", no el nombre de la EPS */
  var origen = (d.ty==='certificado') ? 'Subido por ti' : fx('{epsn}').toUpperCase(); /* Fase 10 · Brief 16: sin "EPS EPS" (se había escapado del Brief 15) */
  var body=(d.demo ? DEMO_TAG : '')+'<div class="v-ph"><span>'+origen+'</span><span>'+fecha+'</span></div>'+
    '<p class="v-pn">'+nombre+'</p>';
  if(d.ty==='resultado' && d.lab){
    /* Fase 10 · Brief 02: los valores dependen de {lab} (V.labv / V.labn por perfil) */
    body+='<p class="v-lab">'+fx(d.t)+'</p>'+
      V.labv.split(';').map(function(r){ var f=r.split('|'); return '<div class="v-row"><span>'+f[0]+'</span><span'+(f[2]?' class="'+f[2]+'"':'')+'>'+f[1]+'</span></div>'; }).join('')+
      '<p style="font-size:10.5px;color:var(--papel-texto-3);margin:16px 0 0;line-height:1.5;">Valores de referencia según edad. '+V.labn+'</p>';
  } else if(d.ty==='orden'){
    body+='<p class="v-lab">Orden de servicio</p>'+
      '<div class="v-row"><span>Servicio</span><span>'+fx(d.proc||d.t)+'</span></div>'+
      (medico?'<div class="v-row"><span>Médico</span><span>'+medico+'</span></div>':'')+
      '<div class="v-row"><span>Vigencia</span><span>30 días</span></div>'+
      '<p style="font-size:10.5px;color:var(--papel-texto-3);margin:16px 0 0;line-height:1.5;">Presentar en el punto de atención con documento de identidad.</p>';
  } else if(d.ty==='autorizacion'){
    body+='<p class="v-lab">Autorización de servicio</p>'+
      '<div class="v-row"><span>Servicio autorizado</span><span>'+fx(d.t)+'</span></div>'+
      '<div class="v-row"><span>Radicado</span><span>#45892</span></div>'+
      '<div class="v-row"><span>Vigencia</span><span>60 días</span></div>';
  } else if(d.ty==='certificado'){
    /* Fase 8 · Yifrah #6: mismo hecho que declara d.rel; sin "Contiene los datos de la atención…", que aquí sería falso.
       El dato no trae fecha de subida (ep 'na'), así que la fecha solo se dice si existe. */
    body+='<p class="v-lab">'+fx(d.t)+'</p>'+
      '<p style="font-size:11px;color:var(--papel-texto-2);line-height:1.6;margin:0;">Lo subiste tú'+(fecha?' el '+fecha:'')+'. No viene de ninguna consulta ni de tu EPS.</p>';
  } else if(d.ty==='mensaje'){
    /* Fase 10 · Brief 03: la cita que llegó pegando texto muestra el mensaje tal cual */
    body+='<p class="v-lab">'+fx(d.t)+'</p><p class="v-msg">'+fx(PEG_MSG)+'</p>';
  } else {
    body+='<p class="v-lab">'+fx(d.t)+'</p>'+
      '<p style="font-size:11px;color:var(--papel-texto-2);line-height:1.6;margin:0;">Documento de '+tipoDoc(d).toLowerCase()+
      (fechaLarga?' emitido el '+fechaLarga:'')+'. Contiene los datos de la atención y las indicaciones del profesional tratante.</p>'+
      (medico||entidad?'<div class="v-row" style="margin-top:14px;"><span>Profesional</span><span>'+medico+'</span></div>'+
      '<div class="v-row"><span>Entidad</span><span>'+entidad+'</span></div>':'');
  }
  document.getElementById('vPage').innerHTML=body;
  document.getElementById('vBot').textContent = (d.ty==='soporte') ? 'Página 1 de 2' : 'Página 1 de 1';
  closeSheets();
  document.getElementById('viewer').style.display='flex';
}

/* Fase 10 · Brief 08f: guardar el dato que faltaba quita la pill (y con ella, si no queda otra, el punto del grupo) */
function vFixSave(ix){
  var d=DOCS[parseInt(ix,10)], inp=document.getElementById('vFixInp');
  if(!d || !inp) return;
  var v=inp.value.trim(); if(!v){ inp.focus(); return; }
  var falta=d.pill && FALTA_CAMPO[d.pill[0]]; if(!falta) return;
  d[falta.f]=v; delete d.pill;
  renderBoveda(); openViewer(ix); vFixToast();
}
function vFixToast(){ var fix=document.getElementById('vFix'); fix.hidden=false; fix.innerHTML='<div class="toast" role="status">Listo, quedó completa.</div>'; }

function openDocSheet(ix){
  var d=DOCS[ix]; if(!d) return;
  var ep=null; EPIS.forEach(function(e){ if(e.id===d.ep) ep=Object.assign({},e); });
  d=Object.assign({}, d); d.p=fx(d.p);
  var h='<div class="grab"></div>'+
    '<div class="doc-fila" style="margin-bottom:var(--esp-m);border-left:5px solid '+(PCOL[d.p]||'var(--r-borde)')+';">'+docIcon()+ /* Fase 10 · Brief 29. Fase 11 · Brief 05 (B): las fotos no tienen persona */
    '<span class="card-main"><span class="doc-t">'+d.t+'</span><span class="doc-s">'+(d.p ? PNAME[d.p]+' · ' : '')+tipoDoc(d)+'</span></span></div>';
  if(ep && ep.id!=='na'){
    h+='<p class="wgt-lbl" style="margin-bottom:var(--esp-s);">De qué consulta salió</p>'+
       '<div class="mm-card" style="margin-bottom:var(--esp-m);"><div><h5>'+ep.t+'</h5><p>'+ep.s+' · '+ep.d+'</p></div></div>';
  }
  if(d.rel){
    h+='<p class="wgt-lbl" style="margin-bottom:var(--esp-s);">Con qué está vinculado</p>'+
       '<p style="font-size:var(--fs-secundario);line-height:var(--lh-secundario);color:var(--r-texto);margin:0 0 var(--esp-m);">'+d.rel+'</p>';
  }
  var pth = d.relth || d.th;
  if(pth && tramCerrado(pth)) h+='<button type="button" class="btn-s" data-act="ped.reabrir" data-k="'+pth+'" style="margin-bottom:var(--esp-s);">Reabrir el trámite</button>'; /* Fase 10 · Brief 20 */
  else if(pth) h+='<button type="button" class="btn-s" data-thread="'+pth+'" style="margin-bottom:var(--esp-s);">Abrir ese trámite</button>';
  h+='<button type="button" class="btn-p" data-docview="'+ix+'" style="margin-bottom:var(--esp-s);">'+
     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:var(--esp-s);" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>Ver documento</button>'+
     '<button type="button" class="btn-s" data-close="1">Cerrar</button>';
  document.getElementById('scrimDocBody').innerHTML=fx(h); paintAvatars(document.getElementById('scrimDocBody'));
  document.getElementById('scrimDoc').style.display='flex';
}

function openDocsSheet(){
  var radicado = card('cir') && card('cir').st==='encurso';
  document.getElementById('docsTitle').textContent = radicado ? 'Lo que envié' : 'Lo que voy a enviar';
  document.getElementById('docsSub').textContent = fx('Dos documentos, ambos de {p3}.') /* Fase 11 · Brief 01b */;
  document.getElementById('scrimDocs').style.display='flex';
}
/* Fase 10 · Brief 07: la flecha del filtro apunta hacia abajo (abre un menú, no navega) */
var CHIP_CHEV='<span class="chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>';
function updateChip(){
  var chip=document.getElementById('famChip');
  /* Fase 8 · Esqueleto 2: sin nada guardado no hay nada que filtrar, el chip no se pinta */
  var stRow=document.getElementById('stRow');
  if(appVacia){ chip.style.display='none'; stRow.classList.remove('con-filtro'); return; }
  /* Fase 10 · Brief 06: el filtro vive junto al título y solo en Inicio, Calendario y Bóveda */
  chip.style.display = ['A1','F1','G1'].indexOf(cur)>=0 ? '' : 'none';
  /* Fase 10 · Rediseño · Brief 13 (corrección 3): con el filtro al lado, el subtítulo baja a su propia línea a todo el ancho */
  stRow.classList.toggle('con-filtro', chip.style.display!=='none');
  if(bovPerson!=='all' && ['A1','F1','G1'].indexOf(cur)>=0){
    chip.className='fam-top on';
    chip.innerHTML='<span class="av av-one" data-p="'+bovPerson+'" style="background:'+PCOL[bovPerson]+'">'+INIT[bovPerson]+'</span>'+
      '<span class="fam-label">Ver: '+PNAME[bovPerson]+'</span>'+CHIP_CHEV;
    chip.setAttribute('aria-label','Filtrar por persona. Viendo: '+PNAME[bovPerson]); /* Fase 10 · Brief 07 */
  } else {
    chip.className='fam-top';
    var fam=SLOTS.filter(function(k){ return !personaFuera(k); }); /* Fase 10 · Rediseño · Brief 13c: solo quien está en la familia */
    var vis=fam.slice(0,4) /* Fase 11 · Brief 06d: hasta 4, con Marta */, extra=fam.length-vis.length, mini='';
    vis.forEach(function(k){ mini+='<span class="av" data-p="'+k+'" style="background:'+PCOL[k]+'">'+INIT[k]+'</span>'; });
    if(extra>0) mini+='<span class="av" style="background:var(--marta)">+'+extra+'</span>'; /* Fase 10 · Rediseño · Brief 09: sin gris suelto */
    chip.innerHTML='<span class="fam-mini">'+mini+'</span><span class="fam-label">Ver: Todos</span>'+CHIP_CHEV;
    chip.setAttribute('aria-label','Filtrar por persona. Viendo: Todos'); /* Fase 10 · Brief 07 */
  }
  paintAvatars(chip);
}
function renderBoveda(){
  /* Fase 8 · Coherencia: appVacia (ver renderInicio) también cubre la primera Bóveda, sin tocar DOCS */
  if(appVacia){
    G1el.innerHTML='<div class="empty" style="padding-top:40px;">'+
      '<div class="ic-vacio">'+ /* Fase 10 · Brief 28 */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="12" y1="12" x2="12" y2="18"/></svg>'+
      '</div><h4>Tu Bóveda está vacía por ahora</h4>'+
      /* Fase 10 · Brief 17 (ajuste): en la propia historia no se escanea (Próximamente); se ofrece la bandeja, con el mismo botón de Inicio */
      (esPropia() ? '<p>Si busco en tu correo, guardo aquí lo que encuentre.</p>'+(mailConnected ? '' : '<button type="button" class="btn-p" data-tap="fabmail">Buscar en tu correo</button>')
        : '<p>Trae tus documentos con el botón +.</p>')+'</div>';
    G1el.setAttribute('data-sub',''); /* Fase 10 · Brief 07: la portada de la Bóveda no lleva subtítulo */
    if(cur==='G1') tSub.textContent='';
    updateChip();
    return;
  }
  if(loadFail){
    G1el.innerHTML='<div class="load-error">'+
      '<div class="ic-vacio gris">'+ /* Fase 10 · Brief 28 */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.2-8.6"/><path d="M21 3v6h-6"/></svg></div>'+
      '<h4>No pude cargar tus documentos</h4>'+
      '<p>Puede ser la conexión. Tus documentos siguen guardados, solo no logré traerlos ahora.</p>'+
      '<button type="button" class="btn-p" data-retry="bov">Reintentar</button></div>';
    /* Fase 8 · Yifrah #3: primera persona, igual que el cuerpo del error */
    G1el.setAttribute('data-sub',''); /* Fase 10 · Brief 07: el cuerpo ya dice que no pude cargar */
    if(cur==='G1') tSub.textContent='';
    G1el.setAttribute('data-back', bovFrom||'');
    updateChip();
    return;
  }
  updateChip();
  if(bovFolder===null) renderBovPortada();
  else if(bovFolder==='all') renderBovTodos();
  else renderBovFolder(bovFolder);
}
/* Fase 6 · portada: 4 carpetas + el buscador, que al primer carácter salta directo a "Todos" con la
   búsqueda ya aplicada. El atrás de la portada sigue usando bovFrom, igual que antes de las carpetas. */
function renderBovPortada(){
  var h='';
  /* Fase 10 · Brief 48: sale la línea fija de sincronización; el estado del correo vive en Configuración */
  h+='<div class="search"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--r-texto-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'+
    '<input id="bovSearchPortada" type="text" placeholder="Buscar en la Bóveda…" value="'+(bovQuery||'').replace(/"/g,'&quot;')+'"></div>';
  h+=docPendHTML(); /* Fase 10 · Brief 40: arriba de las carpetas */
  h+='<div class="bov-cats">'+
    bovCatCard('ord', FOLDER_LABELS.ord, CLIP_IC)+
    bovCatCard('res', FOLDER_LABELS.res, TUBE_IC)+
    bovCatCard('med', FOLDER_LABELS.med, PILL_IC)+
    bovCatCard('all', 'Todos los documentos', FOLDER_IC)+
    '</div>';
  G1el.innerHTML=fx(h); paintAvatars(G1el);
  var si=document.getElementById('bovSearchPortada');
  si.addEventListener('input', function(){
    bovQuery=si.value;
    bovFolder='all';
    renderBoveda();
    var si2=document.getElementById('bovSearch');
    if(si2){ si2.focus(); var len=si2.value.length; si2.setSelectionRange(len,len); }
  });
  si.addEventListener('click', function(e){ e.stopPropagation(); });
  /* Fase 10 · Brief 05: sin contador en la portada (las carpetas ya muestran el suyo) */
  var sub = ''; /* Fase 11 · Brief 07b: sin subtítulo, como Inicio y Calendario (revierte el cambio 6 del Brief 07) */
  G1el.setAttribute('data-title','Bóveda'); /* Fase 10 · Brief 07: "Bóveda de salud" no cabía junto al filtro a 320 px; igual que la pestaña */
  G1el.setAttribute('data-sub', sub);
  G1el.setAttribute('data-back', bovFrom||'');
  if(cur==='G1'){
    tTitle.textContent='Bóveda';
    tSub.textContent=fx(sub);
    topBack.style.display = bovFrom ? 'flex' : 'none';
    topMenu.style.display = bovFrom ? 'none' : 'flex';
    topBack.setAttribute('data-target', bovFrom||'');
  }
}
/* Fase 6 · carpeta ord/res/med: lista plana filtrada por cat + persona, sin agrupar por consulta.
   El atrás siempre vuelve a la portada (sentinel 'BOVPORTADA', ver topBack), no a bovFrom. */
function renderBovFolder(cat){
  var label=FOLDER_LABELS[cat];
  var docs=DOCS.filter(function(d){
    var okP = bovPerson==='all' || fx(d.p)===bovPerson;
    return okP && d.cat===cat;
  });
  /* Fase 10 · Brief 19: lo nuevo sale primero (como "Lo último que guardaste") y el punto de la carpeta se apaga al abrirla */
  docs.sort(function(a,b){ return (!!b.nuevo)-(!!a.nuevo); });
  if(cur==='G1') BOVNEW[cat]=false;
  var vacioBovTxt = (bovPerson!=='all') /* Fase 8 · Yifrah: vacío de carpeta sugiere quitar el filtro de persona */
    ? 'No hay documentos de '+PNAME[bovPerson]+' en esta carpeta. Prueba viendo a todos.'
    : 'No hay documentos con esos filtros.';
  var h = docs.length
    ? '<div class="bov-flat">'+docs.map(function(d){ return docRowHTML(d, true); }).join('')+'</div>'
    : '<p style="font-size:var(--fs-cuerpo);color:var(--r-texto-2);text-align:center;padding:30px var(--esp-xl);line-height:var(--lh-cuerpo);">'+vacioBovTxt+'</p>';
  G1el.innerHTML=fx(h); paintAvatars(G1el);
  var sub = docs.length+' documento'+(docs.length===1?'':'s')+(bovPerson!=='all'?' · '+PNAME[bovPerson]:'');
  G1el.setAttribute('data-title', label);
  G1el.setAttribute('data-sub', sub);
  G1el.setAttribute('data-back', 'BOVPORTADA');
  if(cur==='G1'){
    tTitle.textContent=label;
    tSub.textContent=fx(sub);
    topBack.style.display='flex';
    topMenu.style.display='none';
    topBack.setAttribute('data-target','BOVPORTADA');
  }
}
/* Fase 6 · "Todos los documentos": la Bóveda de siempre (buscador, chips de tipo, agrupación por
   consulta) — solo cambian el título y que el atrás vuelve a la portada en vez de a bovFrom. */
function renderBovTodos(){
  if(cur==='G1') BOVNEW.all=false; /* Fase 10 · Brief 19: el punto de "Todos" se apaga al abrir "Todos" */
  var h='';
  /* Fase 10 · Brief 48: sale la línea fija de sincronización; el estado del correo vive en Configuración */
  h+='<div class="search"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--r-texto-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'+
    '<input id="bovSearch" type="text" placeholder="Buscar en la Bóveda…" value="'+(bovQuery||'').replace(/"/g,'&quot;')+'">'+
    (bovQuery?'<button type="button" class="clr" data-bovclear="1" aria-label="Borrar búsqueda"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>':'')+
    '</div>';
  /* Fase Móvil · Punto 4: la fila deslizable de pestañas se pierde de vista en pantalla angosta —
     se reemplaza por un chip trigger que abre una hoja con las mismas 6 opciones */
  var tSel = (tiposBov().filter(function(t){ return t[0]===bovType; })[0]||TYPES[0])[1]; /* Fase 11 · Brief 05 (B) */
  h += '<button type="button" class="tabp plain" id="bovTypeChip" data-bovtypeopen="1" aria-haspopup="menu" aria-controls="bovTypeMenu" aria-expanded="false">Tipo: '+tSel+'<span class="chev">'+CHEV_D+'</span></button>';
  if(bovPerson!=='all'||bovType!=='all') h+='<button type="button" class="clearf" data-clearf="1">Quitar filtros</button>';
  h+='<div id="bovResults"></div>';
  G1el.innerHTML=fx(h);
  var si=document.getElementById('bovSearch');
  si.addEventListener('input', function(){ bovQuery=si.value; renderBovResults(); });
  si.addEventListener('click', function(e){ e.stopPropagation(); });
  renderBovResults();
  /* Fase 10 · Rediseño · Brief 11: el título se queda "Bóveda" y la vista va en el subtítulo (ver renderBovResults), para no chocar con el filtro */
  G1el.setAttribute('data-title','Bóveda');
  G1el.setAttribute('data-back', 'BOVPORTADA');
  if(cur==='G1'){
    tTitle.textContent='Bóveda';
    topBack.style.display='flex';
    topMenu.style.display='none';
    topBack.setAttribute('data-target','BOVPORTADA');
  }
}
/* Fase Móvil · Punto 4: mismo patrón que renderI3RelSheet() — pinta las opciones dentro de la hoja */
/* Fase 10 · Rediseño · Brief 12: el tipo de documento es menú pegado a #bovTypeChip (antes hoja m3menu) */
function renderBovTypeMenu(){
  var h='';
  tiposBov().forEach(function(t){ var on=bovType===t[0]; /* Fase 11 · Brief 05 (B) */ h+='<button type="button" role="menuitemradio" aria-checked="'+on+'" class="pop-i'+(on?' sel':'')+'" data-bovtype="'+t[0]+'">'+t[1]+'</button>'; });
  document.getElementById('bovTypeMenu').innerHTML=h;
}
/* Fase 10 · Rediseño · Brief 12: el filtro "Ver" es menú pegado a #famChip. Sin subtítulo ni conteo: sirve para elegir rápido */
function renderFamMenu(){
  var mini=''; SLOTS.filter(function(k){ return !personaFuera(k); }).slice(0,4) /* Fase 11 · Brief 06d */.forEach( /* Fase 10 · Rediseño · Brief 13c: solo quien está en la familia */function(k){ mini+='<span class="av" data-p="'+k+'" style="background:'+PCOL[k]+'">'+INIT[k]+'</span>'; });
  function opt(val, ic, nm){ var on=bovPerson===val;
    return '<button type="button" role="menuitemradio" aria-checked="'+on+'" class="pop-i'+(on?' sel':'')+'" data-fam="'+val+'">'+ic+'<span class="pop-nm">'+nm+'</span></button>'; }
  var h=opt('all','<span class="fam-mini">'+mini+'</span>','Toda la familia');
  SLOTS.filter(function(k){ return !personaFuera(k); }).forEach(function(k){
    h+=opt(k,'<span class="av" data-p="'+k+'" style="background:'+PCOL[k]+'">'+INIT[k]+'</span>',PNAME[k]);
  });
  h+='<div class="pop-div" role="separator"></div><button type="button" role="menuitem" class="pop-i pop-more" data-go="FAM"><span class="pop-nm">Administrar familia</span><span class="chev" aria-hidden="true">'+CARD_CHEV+'</span></button>';
  var m=document.getElementById('famMenu'); m.innerHTML=h; paintAvatars(m);
}
function renderBovResults(){
  var box=document.getElementById('bovResults'); if(!box) return;
  var q=(bovQuery||'').trim().toLowerCase();
  var list=DOCS.filter(function(d){
    var okP=(bovPerson==='all'||fx(d.p)===bovPerson), okT=(bovType==='all'||d.ty===bovType);
    var okQ=!q || fx(d.t).toLowerCase().indexOf(q)>-1 || fx(d.s).toLowerCase().indexOf(q)>-1 || tipoDoc(d).toLowerCase().indexOf(q)>-1;
    return okP && okT && okQ;
  });
  /* Fase 11 · Brief 05 (A): sin búsqueda ni «Tipo», una tarjeta por persona con sus temas; con búsqueda o tipo, la lista de siempre */
  if(!q && bovType==='all'){
    box.innerHTML=fx(bovTemasHTML(list)); paintAvatars(box);
    var lbl0 = bovPerson==='all' ? 'Todos los documentos' : 'Documentos de '+PNAME[bovPerson];
    G1el.setAttribute('data-sub', lbl0);
    if(cur==='G1') tSub.textContent=fx(lbl0);
    return;
  }
  var h='', shown=0;
  /* Fase 10 · Brief 19 (corrección): lo nuevo (d.nuevo) sale primero y, adentro de su consulta, va arriba.
     Sin búsqueda, "Lo último que guardaste" va sobre la primera tarjeta */
  var hayNuevo = !q && list.some(function(d){ return d.nuevo; });
  list.sort(function(a,b){ return (!!b.nuevo)-(!!a.nuevo); });
  /* Fase 10 · Brief 35 · Bóveda, lista de consultas: sale el bloque por persona. Una tarjeta .epi-card por consulta, igual a
     la de «Lo que encontré», ordenada por fecha (epiOrden). Se agrupa por la persona de cada documento: «Sin consulta asociada» sale una por persona */
  var grupos=[];
  epiOrden().forEach(function(ep){
    var pers=[];
    list.forEach(function(d){ var p=fx(d.p)||''; if(d.ep===ep.id && pers.indexOf(p)<0) pers.push(p); });
    pers.forEach(function(p){
      var docs=list.filter(function(d){ return d.ep===ep.id && (fx(d.p)||'')===p; });
      grupos.push({ep:ep, p:p, docs:docs, fresh: hayNuevo && docs.some(function(d){ return d.nuevo; })});
    });
  });
  if(hayNuevo) grupos.sort(function(a,b){ return b.fresh-a.fresh; }); /* sort estable: entre las frescas y entre las demás se queda el orden por fecha */
  grupos.forEach(function(g, i){
    var ep=Object.assign({}, g.ep), p=g.p, docs=g.docs; ep.p=p;
    shown+=docs.length;
    if(g.fresh && i===0) h+='<div class="fresh-h"><span class="fdot"></span><span>Lo último que guardaste · hace un momento</span></div>';
    var pv = PCOL[p] ? '--pc:'+PCOL[p]+';' : '';
    if(TINTVAR[p]) pv += '--tinte:var(--'+TINTVAR[p]+'-t);';
    /* Fase Móvil · patrón data-rev/data-revb de renderConf. Fase 10 · Brief 34c: todas arrancan cerradas, también la recién guardada */
    var key = 'bov-'+ep.id+'-'+p;
    h+='<div class="epi epi-card'+(ep.id==='na'?' epi-loose':'')+'"'+(pv?' style="'+pv+'"':'')+'>'+
       '<button type="button" class="epi-h" data-rev="'+key+'" aria-expanded="false">'+
       (p ? '<span class="av" data-p="'+p+'" style="background:'+PCOL[p]+'">'+p+'</span>' : '')+
       epiHeaderHTML(ep, epiPendHTML(docs), true)+
       epiColaHTML(docs, ep.dcorta)+'</button><div class="epi-b" data-revb="'+key+'" style="display:none;"><div class="epi-linea">'; /* Fase 10 · Brief 34c: al abrir manda el display de la hoja de estilos */
    /* Fase 6: todo documento abre su ficha primero (de ahí se puede saltar al trámite con "Abrir ese trámite") */
    docs.forEach(function(d){ h+=docRowHTML(d, false, true); });
    h+='</div></div></div>';
  });
  if(!shown){
    h += q /* Fase 8 · Yifrah: vacío de "Todos" sugiere quitar el filtro de categoría (el botón ya está visible arriba) */
      ? '<p style="font-size:var(--fs-cuerpo);color:var(--r-texto-2);text-align:center;padding:30px var(--esp-xl);line-height:var(--lh-cuerpo);">Nada con «'+fx(bovQuery)+'». Prueba con otra palabra.</p>'
      : '<p style="font-size:var(--fs-cuerpo);color:var(--r-texto-2);text-align:center;padding:30px var(--esp-xl);line-height:var(--lh-cuerpo);">No hay documentos con esos filtros. Prueba con otra categoría.</p>';
  }
  box.innerHTML=fx(h); paintAvatars(box);
  var label = bovPerson==='all' ? 'Todos los documentos' : 'Documentos de '+PNAME[bovPerson]; /* Fase 10 · Rediseño · Brief 11 · Brief 41: sin repetir */
  G1el.setAttribute('data-sub', label);
  if(cur==='G1') tSub.textContent=fx(label);
}
/* Fase 11 · Brief 05 (A): «Todos los documentos» por persona y tema. Caja de la mascota, una tarjeta por persona (tinte y borde de su color)
   y sus temas como filas cerradas; al abrir uno salen sus consultas con la línea de tiempo. Lo de DOCS_PEND no está en DOCS: no entra */
function bovTemaDe(d){
  if(d.ep==='na' && /^Carné de vacunación/.test(fx(d.t))) return 'vacunas';
  var t=TEMAS.filter(function(t){ return t.eps && t.eps.indexOf(d.ep)>-1; })[0];
  return t ? t.id : 'ep-'+d.ep;
}
function bovTemasHTML(list){
  var CHEV='<span class="epi-chev" aria-hidden="true">'+CHEV_D+'</span>';
  var epOf=function(id){ return EPIS.filter(function(e){ return e.id===id; })[0]; };
  var fechaCorta=function(ep){ var m=(ep.d||'').match(/(\d{1,2}) de (\w+)/); return m ? m[1]+' '+MESCORTO[MESNUM[m[2]]] : ''; };
  var h='<div class="bov-tm">'+mascotaSVG('calma', 36)+'<p>Los agrupé según el diagnóstico que dice cada documento. Si algo no cuadra, cuéntame en el chat.</p></div>';
  var personas=TEMAS_ORDEN.filter(function(k){ return list.some(function(d){ return fx(d.p)===k; }); });
  if(list.some(function(d){ return !PCOL[fx(d.p)]; })) personas.push(''); /* las fotos sin persona */
  if(!personas.length) return h+'<p style="font-size:var(--fs-cuerpo);color:var(--r-texto-2);text-align:center;padding:30px var(--esp-xl);line-height:var(--lh-cuerpo);">Todavía no hay documentos.</p>';
  personas.forEach(function(k){
    var docs=list.filter(function(d){ return k ? fx(d.p)===k : !PCOL[fx(d.p)]; });
    /* temas en el orden de TEMAS; luego las consultas sin tema; «Sin consulta asociada» al final */
    var ids=[]; docs.forEach(function(d){ var t=bovTemaDe(d); if(ids.indexOf(t)<0) ids.push(t); });
    var rank=function(id){ var i=TEMAS.map(function(t){ return t.id; }).indexOf(id); return id==='ep-na' ? 999 : i<0 ? 500 : i; };
    ids.sort(function(a,b){ return rank(a)-rank(b); });
    var pv = k ? ' style="--pc:'+PCOL[k]+';'+(TINTVAR[k] ? '--tinte:var(--'+TINTVAR[k]+'-t);' : '')+'"' : '';
    h+='<div class="tema-p'+(k?'':' sin-p')+'"'+pv+'>'+
      (k ? '<div class="tema-p-h"><span class="av" data-p="'+k+'" style="background:'+PCOL[k]+'">'+INIT[k]+'</span>'+
        '<span class="card-main"><b>'+PNAME[k]+'</b><small>'+docs.length+' documento'+(docs.length===1?'':'s')+'</small></span></div>' : '');
    ids.forEach(function(id){
      var tdocs=docs.filter(function(d){ return bovTemaDe(d)===id; });
      var tema=TEMAS.filter(function(t){ return t.id===id; })[0];
      var eps=[]; tdocs.forEach(function(d){ if(eps.indexOf(d.ep)<0) eps.push(d.ep); });
      eps=epiOrden().filter(function(e){ return eps.indexOf(e.id)>-1; }); /* la consulta más reciente arriba */
      var ult=eps.filter(function(e){ return e.d; })[0];
      var nom = tema ? tema.t : fx(epOf(id.slice(3)).t);
      var sub = tema ? (ult && !tema.carne ? ult.d+' · ' : '')+tema.esp : (ult ? ult.d : epOf(id.slice(3)).s);
      var key='tema-'+(k||'x')+'-'+id;
      h+='<div class="tema"><button type="button" class="tema-h" data-rev="'+key+'" aria-expanded="false">'+
        '<span class="card-main"><b>'+nom+'</b><small>'+sub+'</small></span>'+
        '<span class="epi-n">'+tdocs.length+'</span>'+CHEV+'</button>'+
        '<div class="tema-b" data-revb="'+key+'" style="display:none;">';
      eps.forEach(function(e){
        if(e.id!=='na' && !(tema && tema.carne)) h+='<div class="wgt-lbl tema-c">'+fx(e.t)+(fechaCorta(e)?' · '+fechaCorta(e):'')+'</div>';
        h+='<div class="epi-linea">';
        tdocs.filter(function(d){ return d.ep===e.id; }).forEach(function(d){ h+=docRowHTML(d, false, true); });
        h+='</div>';
      });
      h+='</div></div>';
    });
    h+='</div>';
  });
  return h;
}
/* Fase 6 · confirmación de correo: mismo patrón de agrupación que la Bóveda, sin buscador/filtros/pill ni visor — un PDF adjunto no tiene nada dudoso que revisar.
   Filas compactas por grupo, expandibles al tocar — mismo mecanismo data-rev/data-revb que ya usa DET, a nivel de episodio en vez de documento. */
function renderConf(){
  var box=document.getElementById('confList'); if(!box) return;
  /* Fase 10 · Brief 16: en la propia historia la búsqueda trae la orden de ejemplo (reemplaza el vacío del Brief 15) */
  var fuente = fabMailActive ? DOCS.concat(DOCS_BANDEJA) : DOCS; /* Fase 10 · Brief 45: desde la app, también lo que sigue en el correo */
  if(esPropia()){ var pp=proPend||proPreparar(); if(pp) fuente=fuente.concat([pp]); }
  var h='';
  epiOrden().forEach(function(epi){ /* Fase 10 · Brief 35: mismo orden por fecha que la Bóveda */
    if(epi.id==='na') return;
    var docs=fuente.filter(function(d){ return d.ep===epi.id; });
    if(!docs.length) return;
    var ep=Object.assign({}, epi); ep.p=fx(ep.p);
    var key='conf-'+ep.id;
    /* Fase 10 · Brief 34 · Consulta unificada: tarjeta con el tono de la persona (sin franja); contador dentro de la cola, sin punto de pendiente */
    var pv=(PCOL[ep.p] ? '--pc:'+PCOL[ep.p]+';' : '')+(TINTVAR[ep.p] ? '--tinte:var(--'+TINTVAR[ep.p]+'-t);' : ''); /* Fase 10 · Brief 46: --pc como en la Bóveda */
    h+='<div class="epi epi-card"'+(pv?' style="'+pv+'"':'')+'>'+
       '<button type="button" class="epi-h" data-rev="'+key+'" aria-expanded="false">'+
       '<span class="av" data-p="'+ep.p+'" style="background:'+PCOL[ep.p]+'">'+ep.p+'</span>'+
       epiHeaderHTML(ep)+
       epiColaHTML(docs, ep.dcorta)+'</button>'+ /* Fase 10 · Brief 05 · Brief 34 · Brief 44b: con la fecha */
       '<div class="epi-b" data-revb="'+key+'" style="display:none;"><div class="epi-linea">';
    docs.forEach(function(d){ h+=docRowHTML(d, false, true, true); }); /* Fase 10 · Brief 46: la misma fila de la Bóveda, sin tocar (sin ícono ni subtítulo) */
    h+='</div></div></div>';
  });
  box.innerHTML=fx(h);
  paintAvatars(box);
}
/* Fase 11 · Brief 04 (B): sale renderCurso(), que solo dibujaba #H1. Lo que espera respuesta está en «En curso», plegado en Inicio */

/* Fase 6 · H04: Calendario deja de tener la fecha quemada y lee las citas agendadas de verdad */
var DOWFULL={Lun:'Lunes',Mar:'Martes','Mié':'Miércoles',Jue:'Jueves',Vie:'Viernes','Sáb':'Sábado',Dom:'Domingo'};
/* el formato de c.when siempre es "Dow DD mes · hora" (mismo que arman slotHTML/horasWgt) */
function calDay(when){ var m=when.match(/(\d{1,2})/); return m?parseInt(m[1],10):0; }
/* Fase 10 · Brief 01: QLLEVAR se divide en tres grupos (En tu celular / Llévalo en físico / Preparación) con los mismos textos.
   doc = qué documento de DOCS abre "Para mostrar" (ver DOCREF); ayuno = horas, para decir desde qué hora no comer. */
var QLLEVAR={
  ped:{cel:[{t:'Orden médica del 8 de octubre', doc:'ped'},{t:'{carne} de {p1}', doc:'carne'}], fis:['Documento de identidad'], prep:[]},
  lip:{cel:[{t:'Orden de laboratorio del 9 de octubre', doc:'lip'}], fis:['Documento de identidad'], prep:[{t:'Ir en ayunas de 12 horas', ayuno:12}]},
  ter:{cel:[{t:'Orden de terapias vigente hasta el 18 de diciembre', doc:'ter'}], /* Fase 11 · Brief 01b: sale el carné de Sofía */ fis:['Ropa cómoda para la sesión'], prep:[]},
  med:{cel:[], fis:['Fórmula médica impresa','Documento de identidad'], prep:[]},
  /* Fase 10 · Brief 02 */
  cir:{cel:[{t:'Autorización de {eps} para la {t2x}', doc:'autcir'}], fis:['Documento de identidad'], prep:[]},
  ctl:{cel:[{t:'Fórmula médica {t3}', doc:'formula'}], fis:['Documento de identidad'], prep:[]}
};
var DOCREF={
  /* Fase 10 · Brief 21 (corrección 2): la orden vencida (reemplazada por la orden nueva) ya no es la del trámite */
  ped:function(d){ return d.th==='ped' && d.ty==='orden' && !d.vencida; },
  lip:function(d){ return d.th==='lip' && d.ty==='orden' && !d.vencida; },
  ter:function(d){ return d.ep==='fon' && d.ty==='orden' && !d.vencida; },
  carne:function(d){ return d.ty==='certificado'; },
  autcir:function(d){ return d.th==='cir' && d.ty==='autorizacion'; }, /* Fase 10 · Brief 02 */
  formula:function(d){ return d.th==='med' && d.ty==='orden'; }
};
function docIx(ref){ var f=DOCREF[ref]; if(!f) return -1; for(var i=0;i<DOCS.length;i++) if(f(DOCS[i])) return i; return -1; }
/* Fase 10 · Brief 01: el texto de siempre (lista con viñetas), para el detalle del Calendario */
function qllevarTxt(k){
  var Q=QLLEVAR[k]; if(!Q) return '';
  return Q.cel.map(function(i){return i.t;}).concat(Q.prep.map(function(i){return i.t;}), Q.fis).map(function(t){ return '· '+t; }).join('<br>');
}
/* Fase 10 · Brief 01: cierre de citas A (puntual) y B (con resultado). de = cómo se nombra la cita en las preguntas */
/* Fase 10 · Brief 02: cierre = cómo se nombra en el comprobante "Cerré …"; guarda = consulta (ep) donde quedan las órdenes nuevas
   (no crean trámites); formula = el control renueva la fórmula de med; pasos = el comprobante lleva el stepper con etiquetas de la autorización */
var CITA={ ped:{tipo:'A', de:'el control de {p1}', cierre:'el control de {p1}'},
  lip:{tipo:'B', de:'la toma del {labl} de {p3}'}, /* Fase 11 · Brief 01b: el texto sigue a la persona */
  ter:{tipo:'A', de:'la cita de {tvl} de {p2}', cierre:'la cita de {tvl} de {p2}', guarda:'fon', p:'{wtv}', ords:'Órdenes de la cita de {tvl}'},
  cir:{tipo:'A', de:'la {t2x} de {p3}', cierre:'la {t2x} de {p3}', guarda:'ort', p:'{wt2}', ords:'Órdenes de la {t2x}', pasos:true},
  ctl:{tipo:'A', de:'el control de {p3}', cierre:'el control de {p3}', formula:true} };
/* Fase 10 · Brief 02: el trámite es de la dueña de la cuenta (Fase 11 · Brief 01b: {qmed} es {p3}, así que med y ctl no lo son) */
var PASOS_OK='<div class="stepper"><div class="sd done">'+OK_IC+'</div><div class="sl done"></div><div class="sd done">'+OK_IC+'</div><div class="sl done"></div><div class="sd done">'+OK_IC+'</div><div class="sl done"></div><div class="sd done">'+OK_IC+'</div></div>';
/* la autorización (D) transformada en A llega a "Resuelto" en su stepper */
var PASOS_FIN=PASOS_OK+'<div class="step-lbl"><span>Orden</span><span>Autorización</span><span>Cita</span><span class="on">Resuelto</span></div>';
/* Fase 11 · Brief 04 (B): el cierre de las citas lleva sus etiquetas, como el de la autorización. A (ped, ctl, ter, sig) y B (lip); cir sigue con PASOS_FIN */
var PASOS_A=PASOS_OK+'<div class="step-lbl"><span>Orden</span><span>Cita</span><span>¿Cómo<br>te fue?</span><span class="on">Resuelto</span></div>'; /* Fase 11 · stepper: «¿Cómo te fue?» en dos líneas, para que quepa bajo su círculo */
var PASOS_B_L=['Orden','Toma','Resultado']; /* Fase 11 · Brief 14: el examen tiene tres pasos (sale «Resuelto») */
var PASOS_B=pasosHTML(PASOS_B_L, 2).replace('<div class="sd now">3</div>','<div class="sd done">'+OK_IC+'</div>'); /* los tres con check y «Resultado» en negrilla */
function pasosCierre(k){ return (CITA[k]&&CITA[k].pasos) ? PASOS_FIN : (CITA[k]&&CITA[k].tipo==='B') ? PASOS_B : PASOS_A; }
/* Fase 11 · stepper en cada cambio de paso: el mismo .stepper + .step-lbl de la autorización. cur = índice del paso actual (.now/.on);
   los anteriores llevan check y los siguientes su número. Solo va en el mensaje del cambio de paso, nunca fijo arriba del hilo */
function pasosHTML(labels, cur){
  var d='', l='';
  labels.forEach(function(t, i){
    if(i) d+='<div class="sl'+(i<=cur ? ' done' : '')+'"></div>';
    d+= i<cur ? '<div class="sd done">'+OK_IC+'</div>' : '<div class="sd '+(i===cur ? 'now' : 'todo')+'">'+(i+1)+'</div>';
    l+='<span'+(i===cur ? ' class="on"' : '')+'>'+t+'</span>';
  });
  return '<div class="stepper">'+d+'</div><div class="step-lbl">'+l+'</div>';
}
/* al agendar: la orden ya está y la cita (o la toma) es el paso actual. cir no: su comprobante sigue con el de la autorización */
function pasosAgendar(k){ if(!CITA[k] || CITA[k].pasos) return ''; return pasosHTML(CITA[k].tipo==='B' ? PASOS_B_L : ['Orden','Cita','¿Cómo<br>te fue?','Resuelto'], 1); }
/* medicamento: n = la entrega actual (1-3) o 4 = renovar. Sale del subtítulo de la tarjeta ("Reclamar entrega 2 de 3");
   si el subtítulo ya no la dice (p. ej. después de la queja), es la 2, la que nombran los textos del hilo. Sin fx(): corre al cargar THREADS */
function medEntregaN(){ var c=card('med'), m=c && /entrega (\d+)/i.exec(c.sub||''); return m ? +m[1] : 2; }
/* Fase 11 · aviso de entrega: vuelve la tarjeta de antes del stepper, con tres puntos de 22 px (uno por entrega, sin etiquetas).
   Sale el stepper grande de entregas (pasosMed, RENOVAR_IC). n = la entrega del aviso; recibida = ya llegó (la misma tarjeta se actualiza).
   Puntos: las hechas en tinta con check; la que se puede reclamar, rellena con anillo --r-seleccion; la recibida, check sobre --r-exito;
   las que faltan, círculo vacío con borde. Renovar se dice con texto cuando llega la última */
var ORDINAL=['primera','segunda','tercera'];
function medAvisoHTML(n, recibida, hoy){ /* Fase 11 · simular la tercera entrega: hoy = fecha simulada para los días de pastillas */
  var dots='';
  for(var i=1;i<=3;i++){
    dots+= i<n ? '<span class="ent-dot hecha">'+OK_IC+'</span>'
      : i===n ? (recibida ? '<span class="ent-dot recibida">'+OK_IC+'</span>' : '<span class="ent-dot lista"></span>')
      : '<span class="ent-dot"></span>';
  }
  var ord=ORDINAL[n-1]||'';
  if(!recibida) return '<div class="wgt-t">Ya puedes reclamar la '+ord+' entrega</div><div class="ent-dots" aria-hidden="true">'+dots+'</div>'+
    '<div class="wgt-d">Entrega '+n+' de 3. A {p3} le quedan '+(hoy ? diasMed(hoy) : '{dmed}')+' días de pastillas. Disponible en {far1}.</div>'+ /* {dmed} = diasMed() */
    '<button type="button" class="btn-p" data-act="med.reclamar">Marcar como reclamada</button>';
  var c=card('med'), sig=c && c.entrega ? c.entrega.dia+' de '+c.entrega.mesTexto : '';
  return '<div class="wgt-t">'+cap1(ord)+' entrega recibida</div><div class="ent-dots" aria-hidden="true">'+dots+'</div>'+
    '<div class="wgt-d">'+(n<3 ? 'Puedes reclamar la '+ORDINAL[n]+(sig ? ' desde el '+sig : '')+'.' : 'Con esta se acabó la fórmula. Para renovarla, {p3} necesita un control.')+'</div>';
}
/* la entrega llegó: no se agrega un mensaje; la tarjeta del aviso se actualiza en su lugar (objeto nuevo: INTRO.med no se toca, el reinicio la trae igual) */
function medAvisoRecibida(n){
  var ms=THREADS.med.msgs, ix=-1;
  ms.forEach(function(m,i){ if(m.medAviso) ix=i; });
  var nuevo={who:'t', medAviso:1, wgt:medAvisoHTML(n, true)};
  if(ix<0){ commit('med', nuevo); return; } /* sin la tarjeta en el hilo (no debería pasar): se publica una */
  var viejo=ms[ix]; ms[ix]=nuevo;
  if(cur==='TH' && curThread==='med') [].forEach.call(TH.children, function(e){ if(e.__m===viejo){ var x=msgEl(nuevo); x.style.animation='none'; TH.replaceChild(x, e); } });
}
function esTuyo(k){ return fx(THREADS[k].p)==='Tú'; }
/* ============================================================
   Fase 10 · Brief 16 · Tu propia historia: el control, de la orden al cierre
   La orden llega con el correo (onboarding o FAB) y crea ped para {p1} (slot SF) si está agregada; si no, para ti (SO).
   El nombre sale de la edad al crear el trámite (menos de 18 → pediátrico; 18 o más, o sin fecha → medicina general) y no se
   recalcula. Todo se escribe en V, CARDS, THREADS, CITA.ped y QLLEVAR.ped: el reinicio los devuelve (resetDemo)
   ============================================================ */
var CITA_PED0=JSON.parse(JSON.stringify(CITA.ped)), QLLEVAR_PED0=JSON.parse(JSON.stringify(QLLEVAR.ped));
var QLLEVAR0=JSON.parse(JSON.stringify(QLLEVAR)); /* Fase 10 · Brief 21 (corrección 2): la orden nueva cambia el ítem de la orden */
var proPend=null; /* la orden de "Lo que encontré", hasta que se guarda */
function cap1(t){ t=fx(t); return t.charAt(0).toUpperCase()+t.slice(1); }
function proNino(k){ var e=edadDe(k)||''; if(!e) return false; if(/mes/.test(e)) return true; var m=/(\d+) año/.exec(e); return !!m && +m[1]<18; }
/* Fase 10 · Brief 18: token del nombre de quien tiene el control ({p1}, {p2} o {p3}); sin slot, el del control ya creado (V.wt1) */
function proP(slot){ slot=slot||V.wt1; return OB_N[slot] ? '{p'+OB_N[slot]+'}' : '{ru}'; }
function proPreparar(){
  if(!esPropia() || card('ped').st!=='oculto') return null;
  /* Fase 10 · Brief 18: el control va a la primera persona agregada, en el orden de las tarjetas; si no hay, es tuyo (Fase 11 · Brief 01: sin nivel) */
  var slot='SO';
  ['SF','MT','MA'].some(function(k){ if(obAgregados.indexOf(k)>=0 && !personaFuera(k)){ slot=k; return true; } return false; });
  var tuyo=slot==='SO', nino=proNino(slot), pt=proP(slot);
  V.t1 = nino ? 'Control pediátrico' : 'Control de medicina general'; V.t1l = V.t1.toLowerCase();
  V.eppro = nino ? 'Consulta de pediatría' : 'Consulta de medicina general';
  V.wt1=slot; V.wctr=slot;
  V.doc1='Dra. Paula Rincón'; V.docm='Dr. Andrés Mora'; V.doc2='Dr. Andrés Mora';
  if(nino) V.carne='Carné de vacunación';
  var de = tuyo ? 'tu {t1l}' : 'el {t1l} de '+pt, quien = tuyo ? '{ru}' : pt;
  CITA.ped.de=de; CITA.ped.cierre=de;
  QLLEVAR.ped={cel:[{t:'Orden médica del 29 de octubre', doc:'ped'}].concat(nino ? [{t:tuyo ? 'Tu carné de vacunación' : '{carne} de '+pt, doc:'carne'}] : []),
    fis:['Documento de identidad'], prep:[]};
  var c=card('ped');
  c.av=slot; c.c = 'var(--'+OB_VAR[slot]+')'; /* Fase 10 · Brief 18: el color de la persona del control */
  c.frase=de; c.fraseCorta = tuyo ? null : 'el {t1l}';
  c.sub=quien+' · Agendar la cita'; c.pill='Pendiente'; c.pc='pendiente'; c.sinCupo=false; c.vence='28 de noviembre'; /* Fase 11 · Brief 01b */
  THREADS.ped.p=quien; THREADS.ped.sub=quien+' · <em>Vence el 28 de noviembre</em>';
  proPend={ep:'pro', t:'Orden de {t1l}', s:'Dra. Paula Rincón · 29 de octubre', p:'{wt1}', ty:'orden', cat:'ord', th:'ped', pag:1, demo:1};
  return proPend;
}
/* al guardar "Lo que encontré": la orden entra a la Bóveda y el control a Inicio (si su persona está en la familia) */
function proGuardar(){
  if(!esPropia() || !proPend) return;
  DOCS.push(proPend); bovMarcarNuevos([proPend]); /* Fase 10 · Brief 19 */ proPend=null;
  var c=card('ped'); if(personaVisible(c)) c.st='accionable';
  appVacia=false; bovFresh=true; /* Fase 10 · corrección Bóveda */
  paintChips(); renderBoveda(); renderInicio();
}
/* Fase 10 · Brief 16b: al cerrar el control de la propia historia (con o sin órdenes nuevas), la invitación a otra historia.
   Queda en el hilo (THREADS.ped.msgs), así que sale una sola vez y se ve al reabrirlo */
function proInvita(){
  return [{who:'t', text:'Así te acompaño en un trámite, de principio a fin. Con una familia que ya tiene autorizaciones, medicamentos y exámenes se ve todo lo que hago.'},
    {who:'t', wgt:'<button type="button" class="btn-s" data-act="pro.otra">Ver otra historia</button>'}];
}
function proIntro(){
  return [{who:'t', wgt:'<div class="wgt-t">'+(esTuyo('ped') ? 'La orden de tu {t1l} vence el 28 de noviembre' : 'La orden del {t1l} de '+proP()+' vence el 28 de noviembre') /* Fase 10 · Brief 18 */+'</div>'+
    '<div class="wgt-d">Puedo buscarte horarios en {eps} ahora mismo.</div>'+
    '<button type="button" class="btn-p" data-act="ped.agendar">Agendar cita</button>'}]; /* Fase 10 · Brief 21: "Tengo un problema" pasa al chip fijo */
}
/* qué llevar, en una frase (chat y nota de voz): sigue a QLLEVAR.ped, así que el carné solo sale si está en la lista */
function llevarFrase(){
  var carne=QLLEVAR.ped.cel.some(function(i){ return i.doc==='carne'; });
  return 'la orden médica'+(carne ? ', el carné de vacunación' : '')+' y el documento de identidad';
}
/* fases de encurso que suben a la agenda de Inicio (agendada se queda en «En curso», plegado en Inicio) */
var FASE_ATN={manana:1, hoy:1, porconfirmar:1};
function rankAgenda(c){ return c.fase==='hoy'?0 : c.st==='trabado'?1 : c.fase==='manana'?2 : 3; }
function horaDe(c){ return ((c&&c.when)||'').split(' · ')[1]||''; }
/* suma minutos a una hora "3:00 p.m." y la devuelve en el mismo formato */
function horaMas(h, min){
  var m=(h||'').match(/(\d{1,2}):(\d{2})\s*([ap])\.m\./); if(!m) return h;
  var t=(parseInt(m[1],10)%12)*60+parseInt(m[2],10)+(m[3]==='p'?720:0)+min;
  t=((t%1440)+1440)%1440;
  var hh=Math.floor(t/60), mm=t%60;
  return ((hh%12)||12)+':'+(mm<10?'0':'')+mm+' '+(hh<12?'a.m.':'p.m.');
}
/* "Lun 9 nov · 3:00 p.m." → "lunes 9 de noviembre" */
/* Fase 10 · Brief 02b: el mes sale de c.when (antes "de septiembre" iba fijo) */
var MESFULL={ene:'enero',feb:'febrero',mar:'marzo',abr:'abril',may:'mayo',jun:'junio',jul:'julio',ago:'agosto',sep:'septiembre',oct:'octubre',nov:'noviembre',dic:'diciembre'};
function fechaCita(c){ var d=((c&&c.when)||'').split(' · ')[0].split(' '); return (DOWFULL[d[0]]||d[0]||'').toLowerCase()+' '+(d[1]||'')+' de '+(MESFULL[d[2]]||'noviembre'); } /* Fase 11 · Brief 01b */
function renderCalendario(){
  /* Fase 8 · Esqueleto 2: el chip "Ver:" también filtra Calendario, citas y entrega de medicamentos */
  var okFam = function(c){ return personaVisible(c) && (bovPerson==='all' || fx(c.av)===bovPerson); }; /* Fase 10 · Brief 03 */
  /* Fase 10 · Brief 01: las citas que ya pasaron (resuelto, esperando resultado) siguen en su fecha (Fase 10 · Brief 14 corrección: sin ✓; resuelto lleva la pill) */
  var citas = CARDS.filter(function(c){ return (c.st==='encurso' || c.st==='resuelto' || c.st==='esperando') && c.when && okFam(c); });
  citas.sort(function(a,b){ return calDay(a.when)-calDay(b.when); });
  var byDay={};
  citas.forEach(function(c){ byDay[calDay(c.when)]=c; });
  /* Fase 11 · Brief 05 (A): punto de la entrega por reclamar en su fecha límite, en el color de la persona */
  var mc0=card('med'), ml0=mc0 && (mc0.st==='accionable' || mc0.st==='trabado') && okFam(mc0) && fechaLim(mc0).match(/(\d{1,2}) de noviembre/);
  if(ml0 && !byDay[+ml0[1]]) byDay[+ml0[1]]=mc0;
  var gridH='';
  CAL_DIAS.forEach(function(d){ /* Fase 11 · Brief 01b: noviembre, del lunes 2 al miércoles 18 */
    var c=byDay[d];
    if(c){
      /* Fase 10 · Rediseño · Brief 09: punto y borde del calendario con el color de la persona (PCOL), ya no la variante oscura */
      var col=PCOL[fx(c.av)]||c.c||'var(--r-borde)';
      /* Fase 10 · Brief 06: tocar el día filtra la lista a las citas de ese día (antes abría el detalle directo) */
      /* Fase 10 · Rediseño · Brief 11: el color de la persona va en --pc; el CSS pinta borde y punto (el día elegido pierde el borde) */
      gridH += '<button type="button" class="cal-d cita'+(d===calDaySel?' sel-d':'')+'" data-calday="'+d+'" aria-pressed="'+(d===calDaySel)+'" style="--pc:'+col+'">'+d+'<span class="cdot"></span></button>'; /* Fase 10 · Brief 14 (corrección): sin ✓; el día conserva borde y punto */
    } else if(d<HOY_SIM.getDate()){
      gridH += '<div class="cal-d off">'+d+'</div>';
    } else if(d===HOY_SIM.getDate()){
      gridH += '<div class="cal-d today">'+d+'</div>';
    } else {
      gridH += '<div class="cal-d">'+d+'</div>';
    }
  });
  var calDays=document.getElementById('calDays'); if(calDays) calDays.innerHTML=gridH;

  var mc=card('med'), showEntrega = mc && mc.st==='encurso' && mc.entrega && okFam(mc);
  /* Fase 11 · Brief 05 (A): mientras no se reclama, la entrega es un evento en su fecha límite (lim), con punto en la cuadrícula.
     Sale de «Sin agendar». Si lim no trae fecha, no hay evento */
  var medEv=null;
  if(mc && (mc.st==='accionable' || mc.st==='trabado') && okFam(mc)){
    var mm=fechaLim(mc).match(/(\d{1,2}) de (\w+)/);
    if(mm && mm[2] in MESNUM) medEv={day:+mm[1], mes:mm[2], n:(/entrega (\d+)/i.exec(fx(mc.sub))||[])[1]};
  }
  /* Fase 10 · Brief 06: con un día elegido, la lista muestra solo sus citas */
  if(calDaySel!==null){ citas=citas.filter(function(c){ return calDay(c.when)===calDaySel; }); showEntrega=false;
    if(medEv && !(medEv.mes==='noviembre' && medEv.day===calDaySel)) medEv=null; }
  var listH = calDaySel!==null ? '<button type="button" class="link-u cal-all" data-calday="all">Ver todas las citas</button>' : '';
  /* Fase 11 · Brief 05 (A): la fecha de cada evento, antes repetida con su estilo inline en citas y entrega.
     Brief 05 (ajuste): sin estilo inline; .cal-fecha pone 8 hasta su tarjeta y 16 desde el día anterior */
  var fechaP=function(t){ return '<p class="cal-fecha">'+t+'</p>'; };
  if(!citas.length && !showEntrega && !medEv){
    listH+='<p style="font-size:var(--fs-cuerpo);color:var(--r-texto-2);text-align:center;padding:30px var(--esp-xl);line-height:var(--lh-cuerpo);">'+
      /* Fase 11 · Brief 05 (A): el vacío se queda corto */
      (calDaySel!==null ? 'No hay citas ese día.' : bovPerson==='all' ? 'Todavía no tienes citas agendadas.' : PNAME[bovPerson]+' no tiene citas en estas semanas.')+'</p>';
  } else {
    listH+='<div class="wgt-lbl cal-lbl">Próximo</div>'; /* Fase 11 · Brief 05 (A) */
    var evs=[];
    citas.forEach(function(c){
      var parts=c.when.split(' · '), dparts=parts[0].split(' ');
      var dowFull=DOWFULL[dparts[0]]||dparts[0];
      var av=fx(c.av), col=PCOL[av]||c.c||'var(--r-borde)';
      /* Fase 10 · Brief 14 (corrección): la cita toma el estilo de las filas de Inicio (lienzo 47): sin franja, tinte de la persona (--tinte, como todoRowHTML) y pill "Resuelto" en vez del ✓ */
      var tinte = TINTVAR[av] ? ' style="--tinte:var(--'+TINTVAR[av]+'-t)"' : '';
      var mes=MESFULL[dparts[2]]||'noviembre'; /* Fase 11 · Brief 01b: el mes sale de c.when */
      evs.push({o:MESNUM[mes]*100+(+dparts[1]), h:fechaP(dowFull+' '+dparts[1]+' de '+mes)+
        '<button type="button" class="card cal-appt" data-go="F2" data-thread-key="'+c.k+'">'+
          '<span class="appt-in"'+tinte+'>'+
            '<span class="av" data-p="'+av+'" style="background:'+col+'">'+av+'</span>'+
            '<span class="card-main"><span class="card-title" style="font-size:var(--fs-cuerpo);">'+c.t+'</span><span class="card-sub">'+parts[1]+' · '+(c.sede||'')+'</span></span>'+
            (c.st==='resuelto' ? '<span class="pill completo">Resuelto</span>' : '')+
            '<span class="chev">'+CARD_CHEV+'</span>'+
          '</span>'+
        '</button>'});
    });
    /* Fase 11 · Brief 05 (A): la entrega por reclamar, en orden con las citas. Abre su trámite */
    if(medEv){
      var eav=fx(mc.av), ecol=PCOL[eav]||mc.c||'var(--r-borde)';
      var etinte = TINTVAR[eav] ? ' style="--tinte:var(--'+TINTVAR[eav]+'-t)"' : '';
      var edow=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date(HOY_SIM.getFullYear(), MESNUM[medEv.mes], medEv.day).getDay()];
      evs.push({o:MESNUM[medEv.mes]*100+medEv.day, h:fechaP(edow+' '+medEv.day+' de '+medEv.mes)+
        '<button type="button" class="card cal-appt" data-thread="med" data-from="cal">'+
          '<span class="appt-in"'+etinte+'>'+
            '<span class="av" data-p="'+eav+'" style="background:'+ecol+'">'+eav+'</span>'+
            '<span class="card-main"><span class="card-title" style="font-size:var(--fs-cuerpo);">'+mc.t+'</span><span class="card-sub">Último día para reclamar la entrega'+(medEv.n?' '+medEv.n:'')+'</span></span>'+
            '<span class="chev">'+CARD_CHEV+'</span>'+
          '</span>'+
        '</button>'});
    }
    evs.sort(function(a,b){ return a.o-b.o; }).forEach(function(e){ listH+=e.h; });
    /* Hallazgo #6 · la entrega vive solo en la lista (no en la grilla, que sigue fija a noviembre). Fase 10 · Brief 14 (corrección 2): mismo .appt-in que las citas, con su píldora */
    if(showEntrega){
      var mav=fx(mc.av), mcol=PCOL[mav]||mc.c||'var(--r-borde)';
      /* Fase 10 · Brief 14 (corrección 2): la entrega toma el mismo estilo que las citas (.cal-appt + .appt-in con --tinte), sin franja */
      var mtinte = TINTVAR[mav] ? ' style="--tinte:var(--'+TINTVAR[mav]+'-t)"' : '';
      listH += fechaP(mc.entrega.dia+' de '+mc.entrega.mesTexto)+
        '<button type="button" class="card cal-appt" data-go="F2" data-thread-key="med">'+
          '<span class="appt-in"'+mtinte+'>'+
            '<span class="av" data-p="'+mav+'" style="background:'+mcol+'">'+mav+'</span>'+
            '<span class="card-main"><span class="card-title" style="font-size:var(--fs-cuerpo);">'+mc.t+'</span><span class="card-sub">Disponible en {far1} y {far2}</span></span>'+
            '<span class="pill '+mc.pc+'">Entrega</span>'+
            '<span class="chev">'+CARD_CHEV+'</span>'+
          '</span>'+
        '</button>';
    }
  }
  listH += nocitaHTML(okFam); /* Fase 10 · Brief 06 */
  var calList=document.getElementById('calList'); if(calList) calList.innerHTML=fx(listH);
  paintAvatars(document.getElementById('F1'));
}
/* Fase 10 · Brief 06 · todo lo que se puede agendar y no tiene cita, urgente o no, por vencimiento.
   Un trámite está en un solo lugar: con cita (encurso + when) va en la cuadrícula; sin cita, aquí.
   Fase 11 · Brief 05 (A): es la fila plegada «Sin agendar · N» al final; la entrega del medicamento ya no está aquí */
var calDaySel=null;
var MESCORTO=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function agendable(c){
  if(c.st!=='accionable' && c.st!=='trabado') return false;
  if(c.k==='sig') return true; /* Fase 11 · Brief 05 (A): sale med, que es un evento con fecha */
  if(c.k==='cir') return /agendar/i.test(c.sub); /* la autorización (D) solo cuando ya se transformó en cita */
  return !!CITA[c.k];
}
function nocitaHTML(okFam){
  var ls=CARDS.filter(function(c){ return agendable(c) && okFam(c); });
  if(!ls.length) return '';
  var dd=function(c){ var d=diasA(fechaLim(c)); return d===null ? 9999 : d; };
  ls.sort(function(a,b){ return dd(a)-dd(b) || a.ord-b.ord; });
  /* Fase 11 · Brief 05 (A): salen la bandera, "Aún sin cita" y su explicación. Cerrada: avatares, cuenta y el primer vencimiento.
     Se abre en la misma pantalla (data-rev); el Calendario es para mirar: sin «Agendar» ni «Planear», la fila entera abre el trámite */
  var avs=[]; ls.forEach(function(c){ var a=fx(c.av); if(avs.indexOf(a)<0) avs.push(a); });
  var pv=ls.filter(function(c){ return c.lim || c.vence; })[0];
  var h='<div class="nocita"><button type="button" class="nocita-h" data-rev="nocita" aria-expanded="false">'+
    '<span class="fam-mini">'+avs.map(function(a){ return '<span class="av" data-p="'+a+'" style="background:'+(PCOL[a]||'var(--r-borde)')+'">'+(INIT[a]||a)+'</span>'; }).join('')+'</span>'+
    '<span class="card-main"><span class="todo-t">Sin agendar · '+ls.length+'</span>'+
    (pv ? '<span class="todo-s">El primero vence el '+fechaLim(pv)+'</span>' : '')+'</span>'+
    '<span class="chev epi-chev">'+CHEV_D+'</span></button><div class="nocita-b" data-revb="nocita" style="display:none;">';
  ls.forEach(function(c){
    var av=fx(c.av), f=fechaLim(c), m=f.match(/(\d{1,2}) de (\w+)/);
    var fecha = m ? '<b>'+m[1]+'</b>'+MESCORTO[MESNUM[m[2]]] : '<b>—</b>sin fecha';
    var det = c.desde ? 'Desde el '+f : f ? PNAME[av]+' · la orden vence ese día' : PNAME[av];
    h+='<button type="button" class="nocita-r" data-thread="'+c.k+'" data-from="cal"><span class="nocita-f">'+fecha+'</span>'+
      '<span class="av" data-p="'+av+'" style="background:'+(PCOL[av]||'var(--r-borde)')+'">'+av+'</span>'+
      '<span class="card-main"><span class="todo-t">'+c.t+'</span><span class="todo-s">'+det+'</span></span>'+
      '<span class="chev">'+CARD_CHEV+'</span></button>';
  });
  return h+'</div></div>';
}
function renderCalDetail(){
  var c=card(calSelKey);
  if(!c || ['encurso','resuelto','esperando'].indexOf(c.st)<0 || (!c.when && !c.entrega)){ calSelKey='ped'; c=card('ped'); } /* Fase 10 · Brief 01 */
  var k=calSelKey, F2el=document.getElementById('F2');
  var av=fx(c.av), col=PCOL[av]||c.c||'var(--r-borde)';
  var body;
  /* Hallazgo #6 · la entrega no tiene hora ni doc/sede (med.reclamar no los setea) — cuerpo propio, sin la bifurcación por hora que sí usan las citas */
  if(c.entrega){
    /* Fase 10 · Brief 05: el nombre del trámite ("Control para renovar…") no cabe en una línea; va al subtítulo */
    F2el.setAttribute('data-title', 'Tu entrega');
    F2el.setAttribute('data-sub', fx(c.t)+' · desde el '+c.entrega.dia+' de '+c.entrega.mesTexto);
    body =
      '<div class="card" style="background:'+col+'">'+
        '<span class="doc-in">'+
          '<span class="av" data-p="'+av+'" style="background:'+col+'">'+av+'</span>'+
          '<span class="card-main"><span class="doc-t">'+c.t+'</span><span class="doc-s">'+THREADS[k].p+' · Disponible en {far1} y {far2}</span></span>'+
        '</span>'+
      '</div>'+
      '<div class="wgt" style="flex:none;">'+
        '<div class="wgt-t">Qué llevar</div>'+
        '<div class="wgt-d">'+qllevarTxt(k)+'</div>'+
        '<button type="button" class="btn-s" data-go="G1" data-bovcat="med">Ver la fórmula en la Bóveda</button>'+
      '</div>'+
      '<button type="button" class="btn-p" data-thread="'+k+'" data-from="cal">Hablar con Taremi sobre esta entrega</button>';
  } else {
    var parts=c.when.split(' · '), dparts=parts[0].split(' ');
    var dowFull=DOWFULL[dparts[0]]||dparts[0];
    F2el.setAttribute('data-title', 'Tu cita'); /* Fase 10 · Brief 05: idem, el nombre pasa al subtítulo */
    F2el.setAttribute('data-sub', fx(c.t)+' · '+dowFull+' '+dparts[1]+' · '+parts[1]);
    body =
      '<div class="card" style="background:'+col+'">'+
        '<span class="doc-in">'+
          '<span class="av" data-p="'+av+'" style="background:'+col+'">'+av+'</span>'+
          '<span class="card-main"><span class="doc-t">'+c.t+'</span><span class="doc-s">'+THREADS[k].p+' · '+(c.doc||'')+'<br>'+(c.sede||'')+'</span></span>'+
        '</span>'+
      '</div>'+
      '<div class="wgt" style="flex:none;">'+
        '<div class="wgt-t">Qué llevar</div>'+
        '<div class="wgt-d">'+qllevarTxt(k)+'</div>'+
        '<button type="button" class="btn-s" data-go="G1" data-bovcat="ord">Ver la orden en la Bóveda</button>'+
      '</div>'+
      '<button type="button" class="btn-p" data-thread="'+k+'" data-from="cal">Hablar con Taremi sobre esta cita</button>';
  }
  var box=document.getElementById('F2body'); if(box) box.innerHTML=fx(body);
  paintAvatars(F2el);
}

/* ============================================================
   HILOS — el chat de verdad
   ============================================================ */
var THREADS = {
  ped:{title:'{t1}', p:'{p1}', sub:'{p1} · <em>Vence en 4 días</em>', av:'{wt1}', msgs:[], started:false},
  cir:{title:'{t2}', p:'{p3}', sub:'{p3} · orden del 7 oct',         av:'{wt2}', /* Fase 11 · Brief 01b */ msgs:[], started:false},
  med:{title:'{t3}', p:'{qmed}', sub:'{qmed} · fórmula de 3 entregas', av:'{wt3}', msgs:[], started:false},
  ter:{title:'{tv}', p:'{p2}', sub:'{p2} · vigente hasta diciembre', av:'{wtv}', msgs:[], started:false},
  lip:{title:'{lab}',p:'{p3}', sub:'{p3} · orden del 9 oct',         av:'{wlab}', msgs:[], started:false},
  ctl:{title:'Control para renovar {t3n}', p:'{qmed}', sub:'{qmed} · para renovar la fórmula', av:'{wt3}', msgs:[], started:false}, /* Fase 10 · Brief 02 */
  sig:{title:'{tsig}', p:'{p1}', sub:'{p1} · desde el {sigd}', av:'{wt1}', msgs:[], started:false}, /* Fase 10 · Brief 06 */
  gen:{title:'Taremi',             p:'',      sub:'Asistente de IA', /* Fase 11 · Brief 03: sale "responde al instante". Fase 11 · cierre: "de IA" */            av:'T',  c:'var(--r-seleccion-fuerte)', msgs:[], started:false}
};
var THREADS0 = JSON.parse(JSON.stringify(THREADS));

/* Fase 6 · jerarquía "hora protagonista": día y hora comparten una sola línea (el día como prefijo chico,
   la hora grande — es el dato que de verdad decide), en vez de apilados en dos líneas — eso hubiera sumado
   una línea completa de alto en vez de ahorrarla. Doctor y sede se funden en una línea con pin, sin el chip
   con borde de antes; con nombres largos igual puede pasar a dos líneas, pero ya no suma una tercera arriba.
   `when` sigue completo en data-slot (se usa tal cual en otras pantallas), acá solo se separa para mostrarlo. */
function slotHTML(fr,when,doc,sede){
  /* Fase 10 · Rediseño · Brief 11 (corrección, lienzo 45): textos a la izquierda ("Lun 9 nov · 9:00 a.m." en una línea y debajo
     "Doctor · Sede") y el indicador a la derecha. Sin íconos de mañana/tarde ni pin. La elegida toma el tinte de la persona (--tinte en #TH) */
  return '<button type="button" class="slot" data-slot="'+when+'" data-doc="'+doc+'" data-sede="'+sede+'">'+
    '<span class="slot-main"><span class="slot-when">'+when+'</span>'+
    '<span class="slot-who">'+doc+' · '+sede+'</span></span>'+
    '<span class="slot-radio" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12.5l4 4 8-9"/></svg></span></button>';
}
/* 3 sugeridos: los más cercanos, repartidos entre mañana y tarde */
/* Fase 6 · el mes entra en el día ("Lun 9 nov"), no en la hora — sin mes, "Lun 9" asume el mes
   sin decirlo, y una cita sí se puede agendar con meses de anticipación */
/* Fase 10 · Brief 02: ped vence el 10 de noviembre → solo se ofrecen los horarios anteriores (lun 9). Fase 11 · Brief 01b: fechas de la ficha */
function slotsWgt(k){
  if(k===undefined) k=K();
  return '<div class="wgt-t">Estos son los horarios más cercanos</div>'+
    slotHTML('am','Lun 9 nov · 9:00 a.m.','{doc1}','{sede2}')+
    slotHTML('pm','Lun 9 nov · 3:00 p.m.','{docm}','{sede1}')+
    (card(k) && card(k).sinCupo ? '' : slotHTML('am','Jue 12 nov · 7:00 a.m.','{doc1}','{sede2}'))+ /* Fase 10 · Brief 16: por sinCupo, no por la clave */
    '<button type="button" class="btn-p" data-act="ped.confirmar" disabled>Confirmar cita</button>'+
    '<button type="button" class="link-u" data-act="ped.mas">No me sirve ninguno</button>';
}
/* disponibilidad completa: primero el día, después la hora */
/* Fase 11 · Brief 01b: noviembre. CAL_DIAS = la cuadrícula (lun 2 a mié 18); el lunes 16 es festivo y no tiene cupo */
var CAL_DIAS=[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];
var DIAS_LIBRES=[9,10,12,13,17,18];
/* Fase 10 · Brief 02: para ped, el 10 (sin cupo) y los días después del vencimiento van en gris */
function calWgt(k){
  if(k===undefined) k=K();
  var cc=card(k)||{}, libres = cc.sinCupo ? [9] : DIAS_LIBRES; /* Fase 10 · Brief 16: por sinCupo y vence, no por la clave */
  var h='<div class="wgt-t">Elige un día y te muestro los horarios de ese día</div>'+
    '<div class="wgt-d">En gris, los días sin cupo.'+(cc.vence ? ' La orden vence el '+cc.vence+'.' : '')+'</div><div class="cal-w">';
  ['L','M','M','J','V','S','D'].forEach(function(d){ h+='<div class="cal-dow">'+d+'</div>'; });
  CAL_DIAS.forEach(function(d){
    if(libres.indexOf(d)>=0) h+='<button type="button" class="cal-d" data-day="'+d+'">'+d+'</button>';
    else h+='<div class="cal-d off'+(d===HOY_SIM.getDate()?' today':'')+'">'+d+'</div>';
  });
  h+='<div class="cal-d off">19</div><div class="cal-d off">20</div><div class="cal-d off">21</div><div class="cal-d off">22</div></div>'; /* Fase 11 · Brief 01b */
  h+='<button type="button" class="btn-p" data-act="ped.dia" disabled>Ver horarios de ese día</button>'+
     '<button type="button" class="link-u" data-act="ped.volversug">Volver a los horarios sugeridos</button>';
  return h;
}
var DOW={9:'Lun',10:'Mar',12:'Jue',13:'Vie',17:'Mar',18:'Mié'}; /* Fase 11 · Brief 01b */
function horasWgt(d){
  var pre=DOW[d]+' '+d, preS=pre+' nov';
  return '<div class="wgt-t">Horarios del '+pre.toLowerCase()+' de noviembre</div>'+
    slotHTML('am',preS+' · 8:00 a.m.','{doc1}','{sede2}')+
    slotHTML('am',preS+' · 11:30 a.m.','{doc2}','{sede1}')+
    slotHTML('pm',preS+' · 2:00 p.m.','{docm}','{sede1}')+
    slotHTML('pm',preS+' · 4:30 p.m.','{doc2}','{sede1}')+
    '<button type="button" class="btn-p" data-act="ped.confirmar" disabled>Confirmar cita</button>'+
    '<button type="button" class="link-u" data-act="ped.mas">Cambiar de día</button>';
}
/* ============================================================
   Fase 10 · Brief 21 · "Tengo un problema": chip fijo en cada hilo de trámite (#probBar, encima del compositor).
   Las opciones salen del estado del trámite (probOpts) y cada una termina en algo que pasa: un horario, una solicitud,
   un cierre o una persona a quien llamar. Salen PROB, problemaWgt() y su "Ninguna, solo quiero…"
   ============================================================ */
var PROB_L={ninguna:'Ninguna fecha me sirve', nonecesito:'Ya no la necesito', noir:'No puedo ir', nollegan:'Los resultados no llegan',
  farmacia:'No hay en la farmacia', notomo:'Ya no la tomo', falta:'No entiendo qué falta', otravez:'Lo necesito otra vez', otra:'Otra cosa'};
/* lo que se escribe en el hilo y equivale a una opción del estado (ver textReply) */
/* Fase 11 · Brief 10: «cambiar el horario» cuenta como «No puedo ir» */
var PROB_RE={noir:/no puedo ir|no voy a poder ir|no alcanzo a ir|cambiar (el horario|la cita|la hora|la fecha)|reprogramar/, nonecesito:/ya no (la|lo) necesito/, farmacia:/no hay/,
  nollegan:/no (han )?lleg(an|ado)/, ninguna:/no me sirve|otra fecha|ninguna fecha/, notomo:/ya no (la|lo) tomo/,
  otravez:/(la|lo) necesito otra vez/, falta:/qu[eé] falta/};
/* la autorización aprobada ya es una cita (D → A): su estado en la Bóveda quedó "Completado" */
function cirEsCita(c){ return !!c && !!c.bov && c.bov[1]==='Completado'; }
/* cita agendada, mañana u hoy (no "¿Cómo te fue?") */
function conCita(c){ return !!c && c.st==='encurso' && !!c.when && c.fase!=='porconfirmar'; }
function probOpts(k){
  var c=card(k); if(!c) return ['otra'];
  if(c.st==='descartado') return ['otravez','otra'];
  if(k==='med') return ['farmacia','notomo','otra'];
  if(k==='cir' && !cirEsCita(c)) return c.st==='accionable' ? ['falta','nonecesito','otra'] : ['otra']; /* D radicada, estancada, negada…: sus caminos ya existen */
  if(CITA[k]){
    if(c.st==='accionable') return ['ninguna','nonecesito','otra'];
    if(conCita(c)) return ['noir','nonecesito','otra'];
    if(c.st==='esperando' && CITA[k].tipo==='B') return ['nollegan','otra'];
    return ['otra']; /* ¿Cómo te fue? y esperando orden nueva (Solicitada) */
  }
  return c.st==='accionable' ? ['nonecesito','otra'] : ['otra']; /* sig: la EPS aún no abre agenda, no hay fechas que rechazar */
}
/* Fase 11 · Brief 10b: "Deshacer" solo sale si hay algo que ofrecer: cita agendada (opciones de probOpts) o autorización radicada/apelada/escalada */
function undoTipo(k){
  var c=card(k); if(!c) return '';
  if(k==='cir' && !cirEsCita(c) && c.st==='encurso') return 'radicada';
  return conCita(c) && probOpts(k).some(function(o){ return o!=='otra'; }) ? 'cita' : '';
}
/* la orden que respalda el trámite (la última, así que la orden nueva manda) y su fecha */
function ordenDoc(k){ for(var i=DOCS.length-1;i>=0;i--){ var d=DOCS[i]; if(d.ty==='orden' && (d.th===k || (k==='ter' && d.ep==='fon'))) return d; } return null; }
function ordenFecha(k){ var d=ordenDoc(k), m=d && fx(d.s||'').match(/\d{1,2} de [a-záéíóú]+/); return m ? m[0] : ''; }
function tramRadicado(k){
  var c=card(k); if(k!=='cir' || !c || !c.bov || c.bov[1]==='Sin enviar') return '';
  return c.pill==='Escalado' ? 'SNS-2026-84417' : (c.pill==='Negada' || c.pill==='Apelada') ? 'AUT-2026-11938' : '#45892';
}
/* datos del trámite para "Hablar con una persona" */
function tramDatos(k){
  if(!THREADS[k] || k==='gen' || !card(k)) return '';
  var p=THREADS[k].p, m=/^\{p([123])\}$/.exec(p), rad=tramRadicado(k), f=rad ? '' : ordenFecha(k);
  return '<b>Trámite:</b> '+THREADS[k].title+'<br><b>Persona:</b> '+(m ? '{f'+m[1]+'}' : esTuyo(k) ? '{fu}' : p)+
    (rad ? '<br><b>Radicado:</b> '+rad : '')+(f ? '<br><b>Fecha de la orden:</b> '+f : '') /* Fase 10 · Brief 21 (corrección) */;
}
/* cancela la cita agendada: la tarjeta vuelve a como estaba antes de agendar (c.antes, igual que "No hubo cita") y sale del Calendario */
function citaRevertir(k){
  var c=card(k), c0=null; CARDS0.forEach(function(x){ if(x.k===k) c0=x; });
  if(freshConfirmKey===k) freshConfirmKey=null;
  if(pendingToastKey===k){ pendingToast=null; pendingToastKey=null; undoSnap=null; }
  if(citaGrab===k) citaGrabStop();
  var a0=c.antes||{sub:c0.sub, pill:c0.pill, pc:c0.pc, th:THREADS0[k].sub};
  c.st='accionable'; c.fase=null; c.when=null; c.pill=a0.pill; c.pc=a0.pc; c.sub=a0.sub;
  THREADS[k].sub=a0.th; refreshHilo(k);
  renderInicio();
}
/* Fase 11 · Brief 04b (B): antes de cancelar, una hoja. ok() corre solo con «Cancelar la cita»; «No, mantenerla» cierra y no pasa nada */
var cancelPend=null, cancelYa=false;
function citaPideConfirmar(k, ok){
  var c=card(k);
  document.getElementById('cancTitle').textContent = esTuyo(k) ? '¿Cancelo tu cita?' : '¿Cancelo la cita de '+fx(THREADS[k].p)+'?';
  var cuando=cap1(fechaCita(c))+', '+horaDe(c);
  document.getElementById('cancSub').textContent = cuando+(/\.$/.test(cuando) ? '' : '.')+' Después tendrás que buscar otro cupo.'; /* "9:00 a.m." ya trae el punto */
  cancelPend=ok;
  document.getElementById('scrimCancelar').style.display='flex';
}
/* Fase 11 · Brief 04b (B): lo que cambia de la queja ante Supersalud según el trámite */
var QUEJA={
  cir:{motivo:'no respondió la autorización en 5 días hábiles', adjunto:'el radicado AUT-2026-11938 y el plazo vencido',
    adjCorto:'Adjunté el radicado y el plazo vencido.', radicado:'SNS-2026-84417', chip:['cir.simAprobada','Simular: llegó la autorización'],
    despues:function(){
      setCard('cir',{st:'encurso', sub:'{p3} · queja en Supersalud', pill:'Escalado', pc:'espera',
        bov:['{p3} · queja enviada a Supersalud','Escalado','espera']}, '{t2} ya está en «En curso»'); /* Fase 10 · Rediseño · Brief 10 */
      THREADS.cir.sub='{p3} · queja en Supersalud'; refreshHilo('cir');
      renderInicio();
    }},
  med:{motivo:'no llevó el {t3n} a domicilio en 48 horas', adjunto:'la constancia de que no había',
    adjCorto:'Adjunté la constancia de que no había.', radicado:'SNS-2026-85102', chip:['med.domicilio','Simular: llegó a domicilio'],
    despues:function(){ /* Fase 11 · Brief 05 (B): como cir, la tarjeta de Inicio dice que la queja va y que espera la entrega */
      setCard('med',{sub:'{qmed} · queja enviada, espera la entrega', pill:'Escalado', pc:'espera'});
      THREADS.med.sub='{qmed} · queja enviada, espera la entrega'; refreshHilo('med');
      renderInicio();
    }}
};
function quejaRevision(k){
  var q=QUEJA[k];
  return {who:'t', wgt:'<div class="wgt-t">Antes de enviar, revisa que esté bien</div>'+
    '<div class="wgt-d"><b>Queja ante:</b> Supersalud<br><b>Contra:</b> {epsn}<br><b>Motivo:</b> '+q.motivo+'<br><b>Adjunto:</b> '+q.adjunto+'</div><div class="wgt-d">No envío nada hasta que confirmes.</div>'+
    '<button type="button" class="btn-p" data-act="queja.enviar">Confirmar y enviar</button>'+
    '<button type="button" class="btn-s" data-act="queja.cancelar">Cancelar</button>'};
}
function citaCancelar(k){
  var c=card(k), f=fechaCita(c);
  var m={who:'t', comp:{cancel:1, t: esTuyo(k) ? 'Cancelé tu cita del '+f : 'Cancelé la cita de '+THREADS[k].p+' del '+f, canal:'Por el portal de {eps}', time:'Hoy · 9:41 a.m.'}}; /* Fase 11 · comprobantes: el canal va en la línea de la hora. Fase 11 · Brief 03: el canal. Brief 04b: cancel = sin verde */
  citaRevertir(k);
  return m;
}
/* bloquea los widgets del hilo que traen alguna de esas acciones (mismo patrón m.lk de pegBloqueaAgendar) */
function bloquearActs(k, acts){
  THREADS[k].msgs.forEach(function(m,i,a){ if(m.wgt && !m.lk && acts.some(function(x){ return m.wgt.indexOf('data-act="'+x+'"')>=0; })) a[i]=Object.assign({},m,{lk:true}); });
  if(cur==='TH' && curThread===k) [].forEach.call(TH.querySelectorAll('.wgt [data-act]'), function(b){ if(acts.indexOf(b.getAttribute('data-act'))>=0) lock(b); });
}
/* la orden nueva quedó pedida: fuera los horarios viejos y la tarjeta pasa a "Solicitada" hasta el chip "Simular: llegó la orden nueva" */
function ordenSolicitada(k){
  bloquearActs(k,['ped.agendar','ped.confirmar','ped.mas','ped.dia','ped.nueva']);
  setCard(k,{st:'encurso', sub:THREADS[k].p+' · esperando orden nueva', pill:'Solicitada', pc:'espera'}, THREADS[k].title+' ya está en «En curso»');
  THREADS[k].sub=THREADS[k].p+' · esperando orden nueva'; refreshHilo(k);
  renderInicio();
}
/* "Ninguna fecha me sirve": con cupo antes del vencimiento, el calendario completo; sin cupo, pido la orden nueva. pre = mensajes antes (la cancelación) */
function probNinguna(k, pre){
  var c=card(k);
  if(c.sinCupo){
    play(k, pre.concat([{who:'t', think:1, text:'No hay cupo antes del '+c.vence+', cuando vence la orden. Le pedí a {eps}, por su portal, una orden nueva. Te aviso apenas llegue.'}, /* Fase 11 · Brief 04 (C) */
      {who:'t', wgt:simChip('ped.llegoOrden','Simular: llegó la orden nueva')}]));
    ordenSolicitada(k);
  } else play(k, pre.concat([{who:'t', wgt:calWgt(k)}]));
}
function probConfirmaCierre(k){
  var c=card(k);
  return '<div class="wgt-t">Entiendo. ¿La cierro?</div><div class="wgt-d">'+
    (conCita(c) ? 'Cancelo la cita del '+fechaCita(c)+' y dejo de recordártela. La orden sigue en la Bóveda por si cambias de opinión.'
                : 'Dejo de recordártela. La orden sigue en la Bóveda.')+'</div>'+ /* Fase 11 · Brief 04 (C) */
    '<button type="button" class="btn-s" data-act="ped.cerrar">Sí, ciérrala</button><button type="button" class="btn-s exit" data-act="ped.salir">No, sigamos</button>';
}
/* cierra el trámite con "Reabrir" (Brief 20). pre = mensajes antes del cierre */
function tramCerrar(k, pre, txt){
  var c=card(k);
  c.antesCierre={st:c.st, sub:c.sub, pill:c.pill, pc:c.pc, th:THREADS[k].sub};
  play(k, pre.concat([{who:'t', text:txt}, {who:'t', wgt:'<button type="button" class="btn-s" data-act="ped.reabrir">Reabrir</button>'}]));
  setCard(k,{st:'descartado'}, THREADS[k].title+' se cerró');
  renderInicio();
}
/* cada opción, después de que su texto quedó en el chat como mensaje de la persona */
var PROB_H={
  ninguna:function(k){ probNinguna(k,[]); },
  noir:function(k){ probNinguna(k,[citaCancelar(k)]); },
  nonecesito:function(k){ play(k,[{who:'t', wgt:probConfirmaCierre(k)}]); },
  nollegan:function(k){ play(k,[{who:'t', /* Fase 10 · Brief 42: sin think */ text:'Cada laboratorio tiene su tiempo. Los resultados pueden quedar listos sin llegar al correo.' /* Fase 11 · Brief 01: sin "a veces" */+' Si en dos semanas no han llegado, te aviso y te digo cómo pedirlos.'},
    {who:'t', wgt:simChip('cita.resultados','Simular: llegaron los resultados')}]); },
  farmacia:function(k){ play(k,[{who:'t', cara:'atenta', think:1, comp:{t:'Dejé constancia de que hoy no había', s:'{eps} tiene 48 horas para llevártelo a casa.', time:'Hoy · 9:41 a.m.'}},
    {who:'t', wgt:'<div class="chipwrap">'+ /* Fase 11 · Brief 04b (B): también puede no llegar */
      '<button type="button" class="chip-o chip-sim" data-act="med.domicilio">'+SIM_IC+'Simular: llegó a domicilio</button>'+
      '<button type="button" class="chip-o chip-sim" data-act="med.noLlego">'+SIM_IC+'Simular: no llegó</button></div>'}]); },
  notomo:function(k){ play(k,[{who:'t', text:'Entiendo. Antes de dejarla, cuéntaselo a quien la formuló. ¿Te ayudo a pedir un control?'} /* Fase 11 · Brief 04 (C) */,
    {who:'t', wgt:'<button type="button" class="btn-s" data-act="med.pedirctl">Pedir un control</button><button type="button" class="btn-s" data-act="med.hablado">Ya lo hablé con el médico</button>'}]); },
  falta:function(k){ play(k,[{who:'t', wgt:'<div class="wgt-t">Te lo explico corto</div><div class="wgt-d">'+CIR_INTRO+'</div><button type="button" class="btn-p" data-act="cir.radicar">Entendido, radícala</button>'}]); },
  otravez:function(k){ tramReabrir(k,false); },
  otra:function(k){ play(k,[{who:'t', text:'Cuéntame qué pasa con tus palabras. Si no puedo resolverlo, te digo a quién acudir.'} /* Fase 11 · Brief 04 (C) */,
    {who:'t', wgt:'<button type="button" class="btn-s" data-act="nm.humano">Hablar con una persona</button>'}]); }
};
function probRun(k, o, txt){
  if(!PROB_H[o] || probOpts(k).indexOf(o)<0) return;
  if(o==='noir' && conCita(card(k)) && !cancelYa){ citaPideConfirmar(k, function(){ cancelYa=true; probRun(k, o, txt); cancelYa=false; }); return; } /* Fase 11 · Brief 04b (B): nada se publica hasta confirmar */
  commit(k,{who:'s', text:txt||PROB_L[o]});
  PROB_H[o](k);
}
/* al salir del desvío, se retoma el accionable propio de cada trámite */
function resumeWgt(k){
  if(k==='cir' && !cirEsCita(card('cir'))) /* Fase 10 · Brief 21: la autorización aprobada ya es cita */ return '<div class="wgt-t">Seguimos, entonces</div><div class="wgt-d">La orden del {doc3} está lista para radicar ante {eps}.</div><button type="button" class="btn-p" data-act="cir.radicar">Radicar autorización</button>';
  if(k==='med') return '<div class="wgt-t">Seguimos, entonces</div><div class="wgt-d">Entrega 2 de 3 · disponible en {far1} y {far2}.</div><button type="button" class="btn-p" data-act="med.reclamar">Marcar como reclamada</button>';
  return slotsWgt(k); /* Fase 10 · Brief 02 */
}

/* Fase 11 · Brief 04 (C): un solo texto para la intro de la autorización (INTRO.cir y PROB_H.falta) */
var CIR_INTRO='Esta cirugía se ordenó por fuera de la red de {eps}. Por eso necesita autorización antes de darte fecha. Yo radico la solicitud y sigo el plazo.';
var INTRO = {
  ped: [{who:'t', wgt:'<div class="wgt-t">La orden del control de {p1} se vence el 10 de noviembre</div>'+
        '<div class="wgt-d">Puedo buscarte horarios disponibles en {eps} ahora mismo.</div>'+
        '<button type="button" class="btn-p" data-act="ped.agendar">Agendar cita</button>'}], /* Fase 10 · Brief 21 */
  cir: [{who:'t', wgt:'<div class="wgt-t">Guardé esta orden del {doc3}</div>'+
        '<div class="wgt-d">'+CIR_INTRO+'</div>'+ /* Fase 11 · Brief 04 (C) */
        '<button type="button" class="btn-p" data-act="cir.radicar">Radicar autorización</button>'}], /* Fase 10 · Brief 21 */
  med: [{who:'t', medAviso:1, wgt:medAvisoHTML(medEntregaN(), false)}], /* Fase 10 · Brief 21. Fase 11 · aviso de entrega: la tarjeta de los puntos; se actualiza al llegar */
  ter: [{who:'t', wgt:'<div class="wgt-t">La orden de terapias de {p2} vence el 18 de diciembre</div>'+
        '<div class="wgt-d">Quedan 12 sesiones. Conviene pedir cupo con tiempo.</div>'+ /* Fase 11 · Brief 04 (C) */
        '<button type="button" class="btn-p" data-act="ped.agendar">Buscar horarios</button>'}],
  lip: [{who:'t', wgt:'<div class="wgt-t">La toma de laboratorio de {p3} está sin agendar</div>'+
        '<div class="wgt-d">{lab} · debe ir en ayunas de 12 horas.</div>'+
        '<button type="button" class="btn-p" data-act="ped.agendar">Agendar la toma</button>'}],
  /* Fase 10 · Brief 02 */
  ctl: [{who:'t', wgt:'<div class="wgt-t">La fórmula de {t3n} de {p3} se acaba con la entrega 3</div>'+ /* Fase 11 · Brief 01b */
        '<div class="wgt-d">Para renovarla, {p3} necesita un control con medicina general. Puedo buscarte horarios en {eps} ahora mismo.</div>'+
        '<button type="button" class="btn-p" data-act="ped.agendar">Buscar horarios</button>'}],
  /* Fase 10 · Brief 06: la agenda de la EPS aún no llega a esa fecha (los horarios del prototipo son de noviembre), así que no ofrece agendar */
  sig: [{who:'t', wgt:'<div class="wgt-t">La orden de {tsigl} de {p1} se puede agendar desde el {sigd}</div>'+
        '<div class="wgt-d">{eps} todavía no abre agenda para esa fecha. Lo dejé en el Calendario, en «Sin agendar».</div>'+ /* Fase 11 · Brief 04 (C) · Brief 05 (A): «Sin agendar» */
        '<button type="button" class="btn-s" data-go="F1">Ver en el calendario</button>'}],
  gen: [{who:'t', text:'Hola, {u}. Pregúntame lo que quieras. También puedes dictarme una nota de voz.'}] /* Fase 11 · Brief 04 (C) */
};

/* Fase 10 · Brief 21: cada fila recuerda su mensaje (__m) para que lock() lo marque con lk y siga bloqueado al volver al hilo */
function msgEl(m0){ var d=msgEl0(m0); d.__m=m0; return d; }
function msgEl0(m0){
  var m={}; for(var kk in m0) m[kk]=m0[kk];
  m.text=fx(m.text); m.wgt=fx(m.wgt); m.raw=fx(m.raw); m.sep=fx(m.sep); m.toast=fx(m.toast);
  if(m.comp){ m.comp=Object.assign({},m.comp); m.comp.t=fx(m.comp.t); m.comp.s=fx(m.comp.s); m.comp.ev=fx(m.comp.ev); m.comp.canal=fx(m.comp.canal); /* Fase 11 · comprobantes */ }
  if(m0.voice) m.voice={t:m0.voice.t, tx:fx(m0.voice.tx)};
  var d=document.createElement('div');
  if(m.sep){ d.className='sep'; d.innerHTML='<span>'+m.sep+'</span>'; return d; }
  if(m.toast){ d.className='toast'; d.innerHTML=m.toast+(undoTipo(curThread) ? ' <button type="button" class="u" data-undo="hilo">Deshacer</button>' : ''); return d; /* Fase 11 · Brief 10b */ }
  if(m.comp){
    d.className='row';
    d.innerHTML=tAv(m.cara || (m.comp.fin ? 'celebra' : 'calma'))+'<div class="comp'+(m.comp.cancel?' cancel':'')+'">'+ /* Fase 10 · Rediseño · Brief 14: comp.fin = cierre a "Resuelto". Fase 11 · Brief 04b: cancel = X sobre blanco */
      '<span class="comp-ck">'+(m.comp.cancel ? X_IC : '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>')+'</span>'+
      '<span class="comp-b"><span class="comp-t">'+m.comp.t+'</span>'+
      (m.comp.s?'<span class="comp-s">'+m.comp.s+'</span>':'')+
      (m.comp.x||'')+ /* Fase 10 · Brief 01: html extra del comprobante (stepper del cierre) */
      '<span class="comp-time"><span>'+(m.comp.time||'Hoy · 9:41 a.m.')+'</span>'+(m.comp.canal ? ' <span>· '+m.comp.canal+'</span>' : '')+'</span>'+ /* Fase 11 · comprobantes: hora y canal en una línea; si no cabe, el canal baja entero */
      (m.comp.ev?'<button type="button" class="comp-ev" '+(m.comp.go?'data-go="'+m.comp.go+'"':'')+(m.comp.doc?' data-docview="'+m.comp.doc+'"':'')+'>'+
        (m.comp.icon||'<svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/></svg>')+
        m.comp.ev+'<span class="chev">'+CARD_CHEV+'</span></button>':'')+
      '</span></div>';
    return d;
  }
  if(m.who==='s'){
    d.className='row s';
    var edBtn = m.ed ? '<button type="button" class="ed" data-editid="'+m.ed+'">Editar</button>' : '';
    if(m.voice){
      var bars=''; for(var i=0;i<22;i++){ bars+='<i style="height:'+(4+((i*7)%15))+'px"></i>'; }
      d.innerHTML='<div class="bub s"><div class="voice-w"><span class="voice-play"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span><span class="voice-bar">'+bars+'</span><span class="voice-time">'+m.voice.t+'</span></div>'+(m.voice.tx ? '<span class="voice-tr">“'+m.voice.tx+'”</span>' : '')+''+edBtn+'</div>';
    } else { d.innerHTML='<div class="bub s">'+m.text+edBtn+'</div>'; }
    return d;
  }
  /* Fase 10 · Rediseño · Brief 10: un widget que solo trae chips "Simular:" se arma suelto, sin avatar ni contenedor blanco */
  if(m.wgt && /chip-sim/.test(m.wgt) && !/<button(?![^>]*chip-sim)/.test(m.wgt)){
    d.className='row sim'; d.innerHTML=m.wgt; return d;
  }
  /* Fase 10 · Rediseño · Brief 10 (corrección): un widget que solo trae botones (.btn-s/.btn-p/.btn-danger), sin título ni texto,
     va suelto en la columna de las burbujas (row opts). El .wgt se conserva en el DOM porque lock() lo busca; el CSS le quita la tarjeta */
  var soloBtns = m.wgt && !m.wgtCls && /<button[^>]*class="btn-(s|p|danger)\b/.test(m.wgt) &&
    !m.wgt.replace(/<button[^>]*class="btn-(s|p|danger)\b[^"]*"[^>]*>[\s\S]*?<\/button>/g,'').trim();
  /* Fase 10 · Rediseño · Brief 11: si solo trae una .btn-p es una acción que propone Taremi (lienzo 53, "Ver los horarios"):
     va en la columna de las burbujas y a lo ancho (row act); a la derecha quedan solo las respuestas de la persona */
  var soloAct = soloBtns && (m.wgt.match(/<button/g)||[]).length===1 && /<button[^>]*class="btn-p\b/.test(m.wgt);
  d.className = soloAct ? 'row act' : soloBtns ? 'row opts' : 'row';
  if(m.wgtCls && /\bfull\b/.test(m.wgtCls)) d.className += ' full'; /* Fase 10 · Rediseño · Brief 11: herramienta a ancho completo, sin la sangría del chat */
  var inner = m.wgt ? '<div class="wgt'+(m.wgtCls?' '+m.wgtCls:'')+'">'+m.wgt+'</div>' : (m.raw ? m.raw : '<div class="bub t">'+m.text+'</div>');
  /* Fase 10 · Rediseño · Brief 14: una fila de error (.wgt.err o .crit) va atenta */
  d.innerHTML=tAv(m.cara || ((m.wgtCls && /\berr\b/.test(m.wgtCls)) || (m.raw && /class="crit"/.test(m.raw)) ? 'atenta' : 'calma'))+inner; /* Fase 11 · Brief 13: m.cara elige el gesto del avatar */
  /* Fase 10 · Brief 03b: m.lk = widget ya bloqueado fuera del hilo (ver pegBloqueaAgendar); se vuelve a bloquear cada vez que se pinta */
  var lb=m0.lk && d.querySelector('.wgt button'); if(lb) lock(lb);
  return d;
}

function renderThread(key){
  TH.innerHTML='';
  THREADS[key].msgs.forEach(function(m){ var e=msgEl(m); e.style.animation='none'; TH.appendChild(e); });
  down(true); /* Fase 10 */
}
function startEdit(id){
  var k=curThread; if(!k) return;
  var ms=THREADS[k].msgs, ix=-1;
  ms.forEach(function(m,i){ if(m.ed===id) ix=i; });
  if(ix<0) return;
  clearTimers();
  var m=ms[ix];
  var txt = m.voice ? m.voice.tx : m.text;
  THREADS[k].msgs = ms.slice(0, ix);
  renderThread(k);
  chatInput.value=txt; chatInput.focus(); micMode(); /* Fase 10 · Ajuste */
  editing=true; editBar.style.display='flex';
}
function cancelEdit(){ editing=null; editBar.style.display='none'; chatInput.value=''; micMode(); }
/* Fase 10 · Ajuste: con texto en el campo, el botón del micrófono se vuelve "Enviar" */
function micMode(){
  var s=!!chatInput.value.trim();
  micBtn.classList.toggle('send', s);
  micBtn.setAttribute('aria-label', s ? 'Enviar mensaje' : 'Grabar nota de voz');
}
function seed(key, list){ list.forEach(function(m){ THREADS[key].msgs.push(m); }); THREADS[key].started=true; }

function commit(key, m){
  THREADS[key].msgs.push(m);
  if(cur==='TH' && curThread===key){ TH.appendChild(msgEl(m)); down(); }
}
function makeTyping(){
  var d=document.createElement('div');
  d.className='typing';
  d.innerHTML=tAv('piensa')+'<div class="dots-t"><i></i><i></i><i></i></div>';
  return d;
}
/* corrección 1.2 — la animación de "escribiendo" solo donde Taremi procesa de verdad */
/* Fase 10 · Brief 02b: fin (opcional) corre cuando se publica el último mensaje, también si clearTimers() lo adelanta;
   m.delay (opcional) alarga la espera antes de ese mensaje */
function play(key, list, fin){
  var p={key:key, list:list, i:0, ty:null, done:done}; PLAYS.push(p); /* Fase 10 · Ajuste: p.i = siguiente mensaje sin publicar */
  function done(){ var j=PLAYS.indexOf(p); if(j>=0) PLAYS.splice(j,1); if(fin){ var f=fin; fin=null; f(); } }
  function step(){
    if(p.i>=list.length){ done(); return; }
    var m=list[p.i];
    if(m.who==='t' && m.think){
      var ty=makeTyping(); p.ty=ty;
      if(cur==='TH' && curThread===key){ TH.appendChild(ty); down(); }
      /* Fase 10 · Brief 42: "escribiendo" solo donde hay procesamiento, y no más de 1 s (think:1 = 600 ms, think:2 = 1000 ms) */
      T(function(){ ty.remove(); p.ty=null; p.i++; commit(key,m); T(step,200); }, m.think===2?1000:600);
    } else {
      /* Fase 10 · Brief 42: una respuesta ya lista tarda 0,36 s en total (200 antes + 160 después); los delay explícitos no cambian */
      var wait = m.delay || ((m.who==='t') ? 200 : 0);   // amortiguador corto, no animación
      T(function(){ p.i++; commit(key,m); T(step, 160); }, wait);
    }
  }
  step();
}

/* Fase 10 · Brief 06 · pestaña Taremi: el chat general es el hilo gen, con dos estados.
   Sin conversación (gen sin mensajes de la persona) → bienvenida con la mascota y 3 sugerencias;
   con conversación → se ve como un hilo, con la barra de contacto (#hdrHilo.gen). Brief 06b: ver genHello(). */
var GEN_SUG=['¿Qué le toca a {p1}?','¿Cómo va la autorización?','¿Cuántas pastillas le quedan a {p3}?'];
/* Fase 10 · Rediseño · Brief 13c (corrección): un chip que nombra a una persona solo sale si está en la familia (personaFuera);
   si sale alguno, lo reemplaza el siguiente chip general de CHIP_GEN */
var CHIP_P={'¿Qué le toca a {p1}?':'SF', '¿Cuántas pastillas le quedan a {p3}?':'MA'}, /* Fase 11 · Brief 01b */ CHIP_GEN=['¿Cómo va la autorización?','¿Cuántas pastillas le quedan a {p3}?','¿Qué llevo a la cita?'];
/* Fase 10 · Brief 15: en la propia historia, un chip que nombra un trámite solo sale si el trámite existe (genVisible) */
var CHIP_T={'¿Qué le toca a {p1}?':'ped' /* Fase 11 · Brief 04b */, '¿Cómo va la autorización?':'cir','¿Cuántas pastillas le quedan a {p3}?':'med','¿Qué llevo a la cita?':'ped'};
function chipOk(q){ return (!CHIP_P[q] || (!personaFuera(CHIP_P[q]) && !esPropia())) && /* Fase 10 · Brief 16b: en la propia historia no sale "¿Qué le toca a {p1}?" (supone un niño y ofrece escanear) */ !((esPropia() || (DOCS_PEND||[]).length) && CHIP_T[q] && !genVisible(card(CHIP_T[q]))); } /* Fase 11 · Brief 04b (A): con documentos sin organizar, tampoco se habla de trámites que aún no existen */
function chipsFam(list){
  var out=list.filter(chipOk);
  CHIP_GEN.forEach(function(q){ if(out.length<list.length && out.indexOf(q)<0 && chipOk(q)) out.push(q); });
  return out;
}
function genHelloHTML(){
  return '<div class="gen-hello"><div class="gen-hello-m"></div>'+
    '<h2 class="gen-hello-t">'+'¿En qué te ayudo, {u}?'+'</h2>'+
    '<p class="gen-hello-s">Pregúntame o mándame un documento. Soy una IA: no reemplazo a tu médico.</p>'+ /* Fase 11 · cierre */
    '<div class="gen-sugs">'+chipsFam(GEN_SUG).map(function(q){ var t=fx(q);
      return '<button type="button" class="gen-sug" data-chip="'+t+'"><span>'+t+'</span><span class="card-arrow" aria-hidden="true">'+CARD_CHEV+'</span></button>'; }).join('')+
    '</div></div>';
}
/* Fase 10 · Brief 06b · una sola conversación: al entrar a la pestaña, el historial de gen queda arriba
   y la bienvenida va al final (genHi = la bienvenida está a la vista). La barra de contacto se ve si hay historial. */
var genHi=false;
function genHello(){
  var hist = THREADS.gen.msgs.length>0;
  var d=document.createElement('div'); d.innerHTML=fx(genHelloHTML());
  var h=d.firstChild;
  h.querySelector('.gen-hello-m').innerHTML=mascotaSVG('hola', hist ? 120 : 150); /* Fase 10 · Rediseño · Brief 14. Fase 11 · Brief 14c: con historial, más chica */
  TH.appendChild(h); genHi=true;
  hdrHilo.style.display = hist ? 'block' : 'none';
  chips.style.display='none'; fab.classList.remove('fab-chips');
  TH.classList.toggle('gen-w', !hist);
}
/* de la bienvenida a la conversación: se retira la bienvenida y se sigue debajo del historial;
   el separador de fecha solo abre la conversación la primera vez */
function genConv(){
  if(cur!=='TH' || curThread!=='gen' || !genHi) return;
  var h=TH.querySelector('.gen-hello'); if(h) h.remove();
  genHi=false; TH.classList.remove('gen-w');
  hdrHilo.style.display='block'; chips.style.display='flex'; fab.classList.add('fab-chips');
  if(!THREADS.gen.msgs.length) commit('gen',{sep:'Hoy · 9:41 a.m.'});
}
/* Fase 10 · Brief 06: al salir de un hilo, lo que tenía queda como visto (punto "sin revisar" de Por hacer) */
function marcarVisto(){ if(cur==='TH' && curThread && THREADS[curThread]) THREADS[curThread].seen=THREADS[curThread].msgs.length; }
/* Fase 11 · Brief 06 (B): textos de la hoja «¿Qué es esto?» por trámite. Borrador: Sofía debe revisar los plazos antes de la entrega final */
var QUEES={
  cir:{t:'¿Qué es una autorización?', q:'El permiso de tu EPS para hacer la cirugía.', r:'{eps}. Si no responde a tiempo, es falla suya, no tuya.', c:'Tiene 5 días hábiles para responder.',
    w:[['Radicar','Entregar la solicitud a tu EPS.'],['Reconsiderar','Pedir que revisen una respuesta negativa.'],['Supersalud','La entidad que vigila a las EPS.']]},
  med:{t:'¿Cómo funciona la fórmula?', q:'La orden del médico para el medicamento, en 3 entregas.', r:'La farmacia de tu EPS. Si no hay, tiene 48 horas para llevarlo a casa.', c:'Una entrega al mes. Al terminar, hay que renovarla.',
    w:[['Entrega','Lo que da la farmacia cada mes.'],['Renovar','Pedir un control para una fórmula nueva.']]},
  cita:{t:'¿Cómo funciona una cita?', q:'La cita que pide la orden del médico.', r:'Tu EPS y su IPS dan el horario.', c:'La orden vence. Agenda antes de esa fecha.',
    w:[['Orden','El papel del médico que pide el servicio.'],['IPS','El lugar donde te atienden.']]},
  lip:{t:'¿Cómo funciona un examen?', q:'El examen que pidió el médico.', r:'El laboratorio toma la muestra y entrega el resultado.', c:'Depende del examen. Te aviso cuando llegue.',
    w:[['Toma de muestra','Cuando sacan sangre u otra muestra.'],['Resultado','El documento que llega después del examen.']]}
};
QUEES.ped=QUEES.ctl=QUEES.cita;
/* Fase 11 · Brief 06b: vacuna y terapia con texto propio (antes usaban el de cita). Sofía debe revisar los plazos */
QUEES.sig={t:'¿Cómo funciona una vacuna?', q:'La vacuna que toca según el carné.', r:'Tu EPS y su IPS dan el horario.', c:'Se aplica desde el {sigd}.', w:[['Carné','El registro de las vacunas puestas.']]};
QUEES.ter={t:'¿Cómo funciona la terapia?', q:'Las sesiones de terapia que autorizó tu EPS.', r:'Tu EPS y su IPS dan el horario.', c:'Valen hasta diciembre. Agenda antes.', w:[['Sesión','Cada visita de la terapia.']]};
function openQueEs(){
  var q=QUEES[curThread]; if(!q) return;
  /* Fase 11 · Brief 06c: cada caja con su ícono (Lucide); las palabras van juntas en una sola tarjeta, sin ícono */
  var SH='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var SHI={doc:SH+'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>',
    send:SH+'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    cal:SH+'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'};
  function caja(ic,t,x){ return '<div class="sh-caja"><span class="sh-ic">'+SHI[ic]+'</span><span class="sh-tx"><b>'+t+'</b><span>'+x+'</span></span></div>'; }
  document.getElementById('queEsTitle').textContent=fx(q.t);
  document.getElementById('queEsBody').innerHTML=fx(caja('doc','Qué es',q.q)+caja('send','Quién responde',q.r)+caja('cal','Cuánto tarda',q.c)+
    '<p class="wgt-lbl sh-rotulo">Palabras que verás</p>'+
    '<div class="sh-tarjeta">'+q.w.map(function(w){ return '<div class="sh-pal"><b>'+w[0]+'</b><span>'+w[1]+'</span></div>'; }).join('')+'</div>');
  document.getElementById('scrimQueEs').style.display='flex';
}
function openThread(key, navKey){
  var th=THREADS[key]; if(!th) return;
  clearTimers();
  marcarVisto();
  curThread=key;
  if(key==='gen') navKey='taremi'; /* Fase 10 · Brief 06 */
  TH.setAttribute('data-nav', navKey || 'inicio');
  hiloTitle.textContent=fx(th.title);
  hiloSub.innerHTML=fx(th.sub);
  updateConfirmBadge(key);
  var tav=fx(th.av), tcol = key==='gen' ? 'var(--r-seleccion-fuerte)' : (PCOL[tav]||'var(--r-borde)');
  /* Fase 10 · Rediseño · Brief 13 (corrección): las iniciales salen de INIT (y el ícono de PICON), no de la clave del slot:
     la clave del slot no siempre coincide con las iniciales. "T" del hilo general no está en INIT y queda igual */
  hiloAv.classList.remove('av-ic');
  hiloAv.textContent=INIT[tav]||tav;
  hiloAv.style.background=tcol;
  hiloAv.setAttribute('data-p', tav);
  if(PICON[tav]){ hiloAv.textContent=PICON[tav]; hiloAv.classList.add('av-ic'); hiloAv.style.setProperty('--ic-ring', PCOL[tav]||'var(--r-borde)'); }
  /* Fase 10 · Rediseño · Brief 09: iniciales oscuras sin sombra en todos los hilos (la hoja de estilos ya lo hace) */
  hiloAv.style.color = ''; hiloAv.style.textShadow = '';
  /* Fase 10 · Rediseño · Brief 10: sin franja lateral; la tarjeta toma el tinte de la persona (la general, agua) */
  var tinte = key==='gen' ? 'var(--r-acento-suave)' : (TINTVAR[tav] ? 'var(--'+TINTVAR[tav]+'-t)' : '');
  if(tinte) hiloStack.style.setProperty('--tinte', tinte); else hiloStack.style.removeProperty('--tinte');
  if(tinte) TH.style.setProperty('--tinte', tinte); else TH.style.removeProperty('--tinte'); /* Fase 10 · Rediseño · Brief 11 (corrección): el horario elegido usa el mismo tinte */
  hdrHilo.classList.toggle('gen', key==='gen'); TH.classList.remove('gen-w'); /* Fase 10 · Brief 06 */
  show('TH');
  TH.innerHTML='';
  /* Fase 10 · Brief 06: la bienvenida reemplaza el saludo de INTRO.gen */
  genHi=false; /* Fase 10 · Brief 06b */
  if(key==='gen') th.started=true;
  th.msgs.forEach(function(m){ var e=msgEl(m); e.style.animation='none'; TH.appendChild(e); });
  /* Fase 10 · Brief 06b: historial arriba, bienvenida al final; la vista baja hasta la bienvenida */
  if(key==='gen'){ genHello(); down(true); requestAnimationFrame(function(){ if(cur==='TH' && curThread==='gen') down(true); }); return; }
  restoreDraft(key);
  restoreCita(key); /* Fase 10 · Brief 01 */
  reabrirRestore(key); /* Fase 10 · Brief 20 */
  /* Fase 10 · al reabrir el hilo cae en el último mensaje; se repite en el siguiente cuadro por si el alto cambia al pintar */
  down(true); requestAnimationFrame(function(){ if(cur==='TH' && curThread===key) down(true); });
  if(!th.started){ th.started=true; play(key, (key==='ped' && esPropia()) ? proIntro() : (INTRO[key]||[])); } /* Fase 10 · Brief 16 */
}
/* H05: al reentrar, el widget vuelve con lo que ya estaba elegido */
function restoreDraft(key){
  var d=DRAFTS[key]; if(!d || !d.slot) return;
  var slots=TH.querySelectorAll('[data-slot]');
  [].forEach.call(slots, function(s){
    if(s.getAttribute('data-slot')===d.slot){
      var w=s.closest('.wgt'); if(!w || w.hasAttribute('data-lk')) return; /* Fase 10 · Brief 21: un widget ya usado no se reactiva */
      [].forEach.call(w.querySelectorAll('.slot'), function(x){ x.classList.remove('sel'); });
      s.classList.add('sel');
      var cf=w.querySelector('[data-act="ped.confirmar"]');
      if(cf && !cf.hasAttribute('data-locked')) cf.removeAttribute('disabled');
    }
  });
}
function refreshHilo(key){
  var th=THREADS[key];
  if(cur==='TH' && curThread===key){ hiloSub.innerHTML=fx(th.sub); updateConfirmBadge(key); }
}
/* Fase 6 · #17: el hilo muestra "Confirmada" apenas la cita queda agendada, y sigue visible al reabrir el hilo */
function updateConfirmBadge(key){
  var c=card(key);
  /* Fase 10 · Rediseño · Brief 13 (corrección 6): "Confirmada" habla de la cita agendada; cuando ya pasó y falta contar
     cómo te fue ("por confirmar"), las dos etiquetas juntas se contradecían, así que la de la cita sale */
  hiloConfirmBadge.style.display = (c && c.st==='encurso' && c.when && c.fase!=='porconfirmar') ? 'flex' : 'none';
}

/* ============================================================
   ACCIONES DEL HILO
   ============================================================ */
function K(){ return (cur==='TH' && curThread) ? curThread : 'ped'; }
/* ============================================================
   Fase 10 · Brief 01 · CIERRE DE CITAS (A y B) — todo vive en el hilo
   ============================================================ */
/* Fase 10 · Rediseño · Brief 11: ícono de "Mostrar" (expandir, lienzo 52) */
var SHOW_IC='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>';
var ordScanKey=null, citaGrab=null;
/* Fase 10 · Rediseño · Brief 10: ícono de adelantar antes del texto de cada chip "Simular:" */
var CLOCK_IC='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'; /* Fase 11 · Brief 03 */
var MIC_IC='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>'; /* Fase 11 · Brief 03 */
var SIM_IC='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 5v14l8-7zM12 5v14l8-7z"/></svg>';
function simChip(act, txt){ return '<div class="chipwrap"><button type="button" class="chip-o chip-sim" data-act="'+act+'">'+SIM_IC+txt+'</button></div>'; }
function citaFase(k, fase, pill, pc, accion, hsub){
  var c=card(k);
  if(freshConfirmKey===k) freshConfirmKey=null; /* Fase 11 · Brief 14: si había una tarjeta fresca pendiente, no se duplica con la de la agenda */
  if(pendingToastKey===k){ pendingToast=null; pendingToastKey=null; undoSnap=null; } /* deshacer el agendamiento ya no aplica */
  c.fase=fase; c.pill=pill; c.pc=pc; c.sub=THREADS[k].p+' · '+accion;
  THREADS[k].sub=THREADS[k].p+' · '+hsub; refreshHilo(k);
  renderInicio();
}
function citaResolver(k){
  var c=card(k);
  c.st='resuelto'; c.fase=null; c.pill='Resuelto'; c.pc='completo';
  c.sub=THREADS[k].p+' · '+(CITA[k].tipo==='B'?'Toma':'Cita')+' del '+fechaCita(c);
  THREADS[k].sub=THREADS[k].p+' · resuelto'; refreshHilo(k);
  freshConfirmKey=k; appVacia=false;
  renderInicio();
}
/* las preguntas son lo que la persona escribió o dictó en el hilo (mensajes editables) */
function citaPreguntas(k){
  return THREADS[k].msgs.filter(function(m){ return m.who==='s' && m.ed; }).map(function(m){ return m.voice ? m.voice.tx : m.text; });
}
function preguntasWgt(k, tachar){
  var qs=citaPreguntas(k);
  if(!qs.length) return tachar ? '' : '<div class="wgt-lbl">Tus preguntas</div><div class="wgt-d">¿Quieres preguntarle algo al médico? Escríbemelo y lo anoto.</div>'; /* Fase 11 · Brief 04 (C) */
  return '<div class="wgt-lbl">Tus preguntas</div><div class="exlist preguntas">'+qs.map(function(q){ /* Fase 11 · negrilla: solo el título; las preguntas en regular */
    return tachar ? '<button type="button" class="exrow" data-act="cita.tachar" aria-pressed="false"><span class="ex-v">'+q+'</span></button>'
                  : '<div class="exrow"><span class="ex-v">'+q+'</span></div>';
  }).join('')+'</div>';
}
function prepMsgs(k){
  var c=card(k), Q=QLLEVAR[k], hora=horaDe(c), rows='', n=0;
  var marca=function(t){ n++; return '<button type="button" class="exrow" data-act="cita.check" aria-pressed="false"><span class="ex-v">'+t+'</span></button>'; };
  /* Fase 10 · Rediseño · Brief 13 (corrección 10): "En tu celular" solo si el documento está en la Bóveda; si no (p. ej. el carné
     de «Sofia P.» cuando es otra persona), pasa a "Llévalo en físico" para no prometer lo que no está guardado */
  var cel=Q.cel.filter(function(it){ return docIx(it.doc)>=0; }),
      fis=Q.cel.filter(function(it){ return docIx(it.doc)<0; }).map(function(it){ return it.t; }).concat(Q.fis);
  if(cel.length){ rows+='<div class="wgt-lbl llevar-lbl">En tu celular</div><div class="exlist llevar">'+cel.map(function(it){ n++; return '<div class="exrow"><span class="ex-v">'+it.t+'</span><span class="ok-chip">'+OK_IC+'En tu celular</span></div>'; }).join('')+'</div>'; }
  if(fis.length){ rows+='<div class="wgt-lbl llevar-lbl">Llévalo en físico</div><div class="exlist llevar">'+fis.map(function(t){ return marca(t); }).join('')+'</div>'; }
  if(Q.prep.length){ rows+='<div class="wgt-lbl llevar-lbl">Preparación</div><div class="exlist llevar">'+Q.prep.map(function(it){ return marca(it.t+(it.ayuno?': no comas desde las '+horaMas(hora,-it.ayuno*60):'')); }).join('')+'</div>'; }
  /* Fase 11 · negrilla: en «Qué llevar» solo el título va en negrilla; las etiquetas de grupo y las filas (.llevar-lbl, .exlist.llevar) van en regular */
  /* Fase 10 · Brief 01 (corrección): barra de progreso en vez de .dots; el ancho del relleno es el único estilo inline */
  var pc0=Math.round(cel.length*100/n), lleno=cel.length===n;
  var barra='<div class="progress" role="progressbar" aria-label="Qué llevar" aria-valuemin="0" aria-valuenow="'+cel.length+'" aria-valuemax="'+n+'"'+(lleno?' data-full':'')+'><span class="progress-fill" style="width:'+pc0+'%"></span></div>';
  var list=[
    {who:'t', text:'Tu cita es mañana a las '+hora+', en '+c.sede+'. Te atiende '+c.doc+'.'}, /* Fase 11 · saludo de Inicio (revisión de frases): sale "Esto es lo que hay que llevar.", lo dice «Qué llevar» */
    {who:'t', wgt:'<div class="wgt-t">'+(cel.length===n?'Todo listo para mañana':'Qué llevar')+'</div>'+barra+rows},
    /* Fase 10 · Brief 03: c.llegar lo trae el mensaje pegado ("llegar 20 minutos antes"); si no, 15 */
    {who:'t', wgt:'<div class="wgt-t">Llega a las '+horaMas(hora,-(c.llegar||15))+', '+(c.llegar||15)+' minutos antes de la cita.</div><button type="button" class="btn-s" data-act="cita.alarma">Poner alarma</button>'}
  ];
  if(CITA[k].tipo==='A') list.push({who:'t', wgt:preguntasWgt(k,false)});
  list.push({who:'t', wgt:simChip('cita.hoy','Simular: llegó el día de la cita')});
  return list;
}
function consultaMsgs(k){
  var c=card(k), A=CITA[k].tipo==='A', rows='';
  /* Fase 10 · Rediseño · Brief 11: una fila por documento con el título, el dato clave y el botón oscuro "Mostrar" (lienzo 52, opción B).
     El dato clave es DOCS[ix].s sin lo que el título ya dice (la fecha, la persona); si no queda nada, no hay línea. No se inventa nada */
  QLLEVAR[k].cel.forEach(function(it){
    var ix=docIx(it.doc); if(ix<0) return;
    var tt=fx(it.t), dato=fx(DOCS[ix].s||'').split(' · ').filter(function(x){ x=x.trim(); return x && tt.indexOf(x)<0; }).join(' · ');
    rows+='<div class="show-r"><span class="show-m"><span class="show-t">'+it.t+'</span>'+(dato?'<span class="show-s">'+dato+'</span>':'')+'</span>'+
      '<button type="button" class="show-btn" data-docview="'+ix+'" aria-label="Mostrar '+tt.replace(/"/g,'&quot;')+' en grande">'+SHOW_IC+'Mostrar</button></div>';
  });
  /* Fase 11 · Brief 03: el día de la cita va en cajas con título, sin frases sueltas (lienzo fila 6, "día de la cita") */
  var list=[
    {who:'t', wgt:'<div class="cita-hoy">'+CLOCK_IC+'<h2>Hoy · '+horaDe(c)+'</h2></div><div class="wgt-d">'+c.doc+' · '+c.sede+'</div>'},
    {who:'t', wgtCls:'full show-w', wgt:'<div class="wgt-tr"><span class="wgt-lbl">Para mostrar</span><span class="ok-chip">'+OK_IC+'Sin conexión</span></div>'+rows} /* Fase 10 · Rediseño · Brief 11: herramienta, a ancho completo */
  ];
  /* en B, el modo consulta se reduce a "Para mostrar" */
  if(A){
    var q=preguntasWgt(k,true); if(q) list.push({who:'t', wgt:q});
    /* Fase 11 · Brief 03: grabar tiene su propio botón (secundario); el micrófono del campo siempre es nota de voz */
    list.push({who:'t', wgtCls:'full', wgt:'<div class="wgt-tr"><span class="wgt-lbl">Resumen de la consulta</span><span class="wgt-tr-s">Con permiso del médico</span></div>'+
      '<button type="button" class="btn-s btn-ic" data-act="cita.grabar">'+MIC_IC+'Grabar la consulta</button>'});
  }
  list.push({who:'t', wgt:simChip('cita.fin','Simular: terminó la cita')});
  return list;
}
function citaMarca(el, cls, on){ el.classList.toggle(cls,on); el.setAttribute('aria-pressed', on?'true':'false'); }
/* progreso por ítem: los del celular ya cuentan; al completarse, el título cambia y el relleno pasa a verde */
function citaDots(w){
  if(!w) return;
  var total=w.querySelectorAll('.exlist .exrow').length, done=total-w.querySelectorAll('.exlist .exrow[data-act="cita.check"]:not(.check)').length;
  var bar=w.querySelector('.progress');
  if(bar){
    bar.setAttribute('aria-valuenow', done); bar.setAttribute('aria-valuemax', total);
    bar.toggleAttribute('data-full', done===total);
    bar.querySelector('.progress-fill').style.width=Math.round(done*100/total)+'%';
  }
  var t=w.querySelector('.wgt-t'); if(t) t.textContent = done===total ? 'Todo listo para mañana' : 'Qué llevar';
}
/* Fase 10 · Brief 02b: un chip "Simular:" ya tocado se desactiva solo a sí mismo (sin lock() del widget).
   SIMUSED[hilo] guarda su posición entre los .chip-sim del hilo, que no cambia porque los mensajes solo se agregan. */
var SIMUSED={};
function simUsar(el){
  if(cur!=='TH' || !curThread) return;
  var i=[].indexOf.call(TH.querySelectorAll('.chip-sim'), el);
  (SIMUSED[curThread]=SIMUSED[curThread]||{})[i]=true;
  el.setAttribute('disabled','');
}
function simRestore(key){
  var u=SIMUSED[key]; if(!u) return;
  [].forEach.call(TH.querySelectorAll('.chip-sim'), function(el,i){ if(u[i]) el.setAttribute('disabled',''); });
}
/* Fase 10 · Brief 20: solo el último "Reabrir" del hilo sigue activo, y solo mientras el trámite esté cerrado */
function reabrirRestore(key){
  var bs=[].slice.call(TH.querySelectorAll('[data-act="ped.reabrir"]')), abierto=!tramCerrado(key);
  bs.forEach(function(b,i){ b.toggleAttribute('disabled', abierto || i<bs.length-1); });
}
/* al reabrir el hilo: marcas, preguntas tachadas y alarma vuelven como estaban (mismo patrón que restoreDraft) */
function restoreCita(key){
  if(citaGrab && citaGrab!==key) citaGrabStop();
  simRestore(key); /* Fase 10 · Brief 02b */
  var c=card(key); if(!c || !CITA[key]) return;
  [].forEach.call(TH.querySelectorAll('[data-act="cita.check"]'), function(el){ citaMarca(el,'check',!!(c.checks||{})[el.querySelector('.ex-v').textContent]); });
  [].forEach.call(TH.querySelectorAll('[data-act="cita.tachar"]'), function(el){ citaMarca(el,'done',!!(c.tachadas||{})[el.querySelector('.ex-v').textContent]); });
  [].forEach.call(TH.querySelectorAll('.progress'), function(d){ citaDots(d.closest('.wgt')); });
  if(c.alarma) [].forEach.call(TH.querySelectorAll('[data-act="cita.alarma"]'), function(el){ el.textContent='Alarma puesta'; el.setAttribute('disabled',''); });
}
/* Fase 11 · Brief 03: lo llama el botón «Grabar la consulta» (cita.grabar), solo el día de la cita (A); el micrófono del campo ya no */
function citaGrabar(){
  var k=curThread, c=card(k);
  if(cur!=='TH' || !CITA[k] || CITA[k].tipo!=='A' || !c || c.st!=='encurso' || c.fase!=='hoy') return false;
  if(citaGrab) return true;
  citaGrab=k; micUsado=true; /* Fase 10 · Brief 48 */
  commit(k,{who:'t', wgt:'<div class="wgt-t">Estoy grabando</div><div class="wgt-d">Cuando termine la consulta, toca Terminar y te resumo las indicaciones.</div>'+
    '<button type="button" class="btn-p" data-act="cita.grabFin">Terminar</button>'});
  return true;
}
function citaGrabStop(){ citaGrab=null; }
/* guardarTap() llega aquí cuando la captura se abrió desde "Escanear las órdenes" */
function citaOrdenesGuardadas(k){
  var c=card(k), t=card('sig'), hora='Hoy · '+horaMas(horaDe(c),40);
  /* Fase 10 · Brief 02: en ter, cir y ctl las órdenes que llegan de la cámara se guardan en la Bóveda y no crean trámites */
  if(k!=='ped'){
    appVacia=false; bovFresh=true; /* Fase 10 · corrección Bóveda */
    if(CITA[k].formula){
      DOCS.push({ep:'hta', t:'Fórmula médica {t3} · renovada', s:'Control del '+fechaCita(c).replace(/^\S+ /,''), p:'{whta}', ty:'orden', cat:'med', th:'med', pag:1,
        rel:'Salió del control de {p3} del '+fechaCita(c).replace(/^\S+ /,'')+'. Reemplaza la fórmula de 3 entregas.'}); /* Fase 11 · Brief 01b */
      commit(k,{who:'t', comp:{fin:1, t:'Cerré el control de {p3} y guardé la fórmula nueva de {t3n}', x:pasosCierre(k) /* Fase 11 · Brief 04 */, time:hora, ev:'Ver la fórmula', doc:String(DOCS.length-1)}});
      /* el hilo de med ya no dice que falta renovar */
      THREADS.med.sub='{qmed} · fórmula renovada'; refreshHilo('med');
      /* Fase 10 · Brief 02b: la fecha es la de la cita de ctl */
      if(THREADS.med.started) commit('med',{who:'t', text:'La fórmula de {t3n} quedó renovada el '+fechaCita(card('ctl')).replace(/^\S+ /,'')+'. La guardé en la Bóveda. Te sigo avisando las entregas.'}); /* Fase 11 · revisión de frases: más corta */
    } else {
      DOCS.push({ep:CITA[k].guarda, t:CITA[k].ords, s:'Escaneadas el '+fechaCita(c).replace(/^\S+ /,''), p:CITA[k].p, ty:'orden', cat:'ord', pag:1,
        rel:'Salieron de '+CITA[k].cierre+'. Las guardé sin crear trámites nuevos.'});
      commit(k,{who:'t', comp:{fin:1, t:'Cerré '+CITA[k].cierre+' y guardé las órdenes en la Bóveda', x:pasosCierre(k) /* Fase 11 · Brief 04 */, time:hora, ev:'Ver en la Bóveda', go:'G1'}});
    }
    bovMarcarNuevos([DOCS[DOCS.length-1]]); /* Fase 10 · Brief 19 */
    citaResolver(k);
    openThread(k, TH.getAttribute('data-nav'));
    return;
  }
  /* Fase 10 · Brief 06: ya no revela ter (existe desde el inicio); crea sig, que vence en más de 30 días y va al Calendario */
  if(t && t.st==='oculto' && personaVisible(t)) t.st='accionable';
  appVacia=false;
  commit(k,{who:'t', comp:{fin:1, t:'Cerré el control de {p1} y creé el trámite de {tsigl}', x:PASOS_A /* Fase 11 · Brief 04 */, time:'Hoy · '+horaMas(horaDe(c),40), ev:'Ver en el calendario', go:'F1'}});
  citaResolver(k);
  openThread(k, TH.getAttribute('data-nav'));
}
/* Fase 10 · Brief 03 · núcleo de "agendada" que era de ped.confirmar, compartido con Pegar texto (pegUnir).
   Deja la tarjeta en encurso/agendada y devuelve los mensajes del hilo; quien llama decide si los reproduce (play) o los publica (commit).
   extra: campos adicionales de la tarjeta, ej. {llegar:20} */
function citaAgendada(k,label,doc,sede,extra){
  DRAFTS[k]=null;
  /* Fase 10 · Brief 02: cómo estaba antes de agendar, para "No hubo cita" */
  var c=card(k); c.antes={sub:c.sub, pill:c.pill, pc:c.pc, th:THREADS[k].sub};
  var confMsgs=[{who:'t', cara:'celebra', comp:{
    /* Fase 10 · Brief 03b: toLowerCase() después de fx() — antes bajaba "{t1}" y salía "Control pediátrico" */
    t: esTuyo(k) ? 'Agendé tu '+fx(THREADS[k].title).toLowerCase() : 'Agendé la cita de '+fx(THREADS[k].title||'control').toLowerCase()+' de '+THREADS[k].p,
    s:label.replace(' · ',', ')+'<br>'+doc+' · '+sede, canal:'Por el portal de {eps}', /* Fase 11 · Brief 03: el canal. Fase 11 · comprobantes: deja de ser línea propia, va con la hora */
    x:pasosAgendar(k), /* Fase 11 · stepper en cada cambio de paso */
    time:'Hoy · 9:41 a.m.',
    ev:'Ver en el calendario', go:'F1',
    icon:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>'
  }}, /* Fase 11 · Brief 04 (C): un solo acuse; sale "Listo, … ya está en «En curso», en Inicio." */
  {who:'t', text:'Te aviso un día antes y te recuerdo qué llevar.'}];
  /* Fase 10 · Brief 01: la promesa se cumple con el chip que pasa la cita a "mañana" */
  if(CITA[k]) confMsgs.push({who:'t', wgt:simChip('cita.manana','Simular: la cita es mañana')});
  THREADS[k].sub=THREADS[k].p+' · agendada';
  setCard(k,{st:'encurso', sub:THREADS[k].p+' · '+label.replace(' · ',' a las '), pill:'Agendada', pc:'espera',
    when:label, doc:doc, sede:sede, fase:'agendada', checks:{}, tachadas:{}, alarma:false, llegar:extra.llegar}, THREADS[k].title+' ya está en «En curso»') /* Fase 10 · Rediseño · Brief 10 */;
  refreshHilo(k);
  renderInicio(); /* Fase 11 · Brief 14: sin freshConfirmKey; agendar ya no pinta «Confirmada ✓» */
  return confMsgs;
}
/* Fase 10 · Brief 20: vuelve a como estaba (c.antesCierre), entra otra vez a Inicio y a los avisos, y el hilo retoma con los botones de su intro.
   Fase 10 · Brief 21: sale de ACT['ped.reabrir'] para que "Lo necesito otra vez" haga lo mismo. desdeBov = desde la hoja del documento */
function tramReabrir(k, desdeBov){
  var c=card(k); if(!c || c.st!=='descartado') return;
  var c0=null; CARDS0.forEach(function(x){ if(x.k===k) c0=x; });
  var a=c.antesCierre || {st:'accionable', sub:c0.sub, pill:c0.pill, pc:c0.pc, th:THREADS0[k].sub};
  setCard(k,{st:a.st, sub:a.sub, pill:a.pill, pc:a.pc, antesCierre:null});
  THREADS[k].sub=a.th;
  if(desdeBov){ closeSheets(); openThread(k, 'bov'); }
  else { refreshHilo(k); reabrirRestore(k); }
  var msgs=[{who:'t', text:'Reabrí '+fx(c.frase||c.t)+'. Sigue donde lo dejaste.'}];
  var vd=diasA(fx(c.vence||''));
  if(vd!==null && vd<0){
    /* la orden ya venció (no pasa con HOY_SIM, pero la regla queda): en vez de agendar, una orden nueva */
    msgs=[{who:'t', cara:'atenta', text:'La orden venció el '+fx(c.vence)+'. Te ayudo a pedir una nueva.'},
      {who:'t', wgt:'<button type="button" class="btn-p" data-act="ped.nueva">Solicitar orden nueva</button>'}];
  } else if(a.st==='accionable' || a.st==='trabado'){
    /* los mismos botones de acción de su intro ("Agendar cita" / "Radicar autorización" / "Marcar como reclamada") */
    var intro=(k==='ped' && esPropia()) ? proIntro() : (INTRO[k]||[]), btns='';
    if(k==='cir' && cirEsCita(c)) intro=[{wgt:'<button type="button" class="btn-p" data-act="ped.agendar">Agendar la {t2x}</button>'}]; /* Fase 10 · Brief 21: la autorización aprobada ya es cita */
    intro.forEach(function(m){ ((m.wgt||'').match(/<button[\s\S]*?<\/button>/g)||[]).forEach(function(b){ btns+=b; }); });
    if(btns) msgs.push({who:'t', wgt:btns});
  }
  play(k, msgs);
  renderInicio();
}
var ACT = {
  'undo.retirar': function(el){
    lock(el);
    var k=curThread||'cir';
    commit(k,{who:'s', text:'Pide que la retiren'});
    play(k,[{who:'t', think:1, text:'Le pedí a {eps}, por su portal, que retire la solicitud.'}]); /* Fase 11 · Brief 03: sin plazo ni promesa: no hay chip que lo confirme */
  },
  'undo.prob': function(el){ /* Fase 11 · Brief 10: igual que elegirla en "Tengo un problema" */
    lock(el);
    probRun(curThread, el.getAttribute('data-o'));
  },
  'undo.corregir': function(el){
    lock(el);
    var k=curThread||'cir';
    commit(k,{who:'s', text:'Corregir un documento'});
    play(k,[{who:'t', /* Fase 10 · Brief 42: sin think */ text:'Claro. Escanea el documento corregido con el botón de abajo. O dime qué cambió y lo ajusto.'} /* Fase 11 · Brief 04 (C) */]);
  },
  'ped.agendar': function(el){
    if(el) lock(el);
    var k=K();
    commit(k,{who:'s', text:'Ayúdame a agendar la cita'});
    play(k,[{who:'t', wgt:slotsWgt()}]);
  },
  'ped.confirmar': function(el){
    var w=el.closest('.wgt'), sel=w.querySelector('.slot.sel');
    var label = sel ? sel.getAttribute('data-slot') : 'Lun 9 nov · 3:00 p.m.';
    var doc = sel ? sel.getAttribute('data-doc') : '{docm}';
    var sede = sel ? sel.getAttribute('data-sede') : '{sede1}';
    lock(el);
    var k=K();
    if(lastSlot && !sel){ label=lastSlot[0]; doc=lastSlot[1]; sede=lastSlot[2]; }
    lastSlot=[label,doc,sede];
    commit(k,{who:'s', text:'Me sirve la de '+label.replace(' · ',' a las ')});
    if(netBlocked()){ netErr(k,'ped.confirmar','{eps}'); return; }
    play(k, citaAgendada(k,label,doc,sede,{}));
  },
  /* Fase 10 · Brief 01: cierre de citas. Los chips "Simular:" no llevan lock(): se protegen con la fase */
  'cita.manana': function(el){
    var k=K(), c=card(k); if(!c || c.st!=='encurso' || c.fase!=='agendada') return;
    citaFase(k,'manana','Mañana','manana','Ver qué llevar','la cita es mañana');
    commit(k,{sep:'Un día antes de la cita'});
    play(k, prepMsgs(k));
  },
  'cita.hoy': function(el){
    var k=K(), c=card(k); if(!c || c.st!=='encurso' || c.fase!=='manana') return;
    citaFase(k,'hoy','Hoy','manana','Ver qué mostrar','la cita es hoy');
    commit(k,{sep:'Día de la cita'});
    play(k, consultaMsgs(k));
  },
  'cita.fin': function(el){
    var k=K(), c=card(k); if(!c || c.st!=='encurso' || c.fase!=='hoy') return;
    citaGrabStop();
    citaFase(k,'porconfirmar','Por confirmar','pendiente','¿Cómo te fue?','¿cómo te fue?'); /* Fase 10 · Brief 39: el hilo pregunta, no dice «por confirmar» */
    commit(k,{sep:'Después de la cita'});
    var A=CITA[k].tipo==='A';
    play(k,[{who:'t', text:'¿Cómo te fue en '+CITA[k].de+'?'},
      {who:'t', wgt:(A?'<button type="button" class="btn-s" data-act="cita.ordenes">Me dieron órdenes nuevas</button>'+
        '<button type="button" class="btn-s" data-act="cita.sinordenes">No me dieron órdenes nuevas</button>'
        :'<button type="button" class="btn-s" data-act="cita.muestras">Ya le tomaron las muestras</button>')+
        '<button type="button" class="btn-s" data-act="cita.nohubo">No hubo cita</button>'}]);
  },
  'cita.check': function(el){
    var c=card(K()); if(!c) return;
    var on=!el.classList.contains('check'), t=el.querySelector('.ex-v').textContent;
    c.checks=c.checks||{}; c.checks[t]=on;
    citaMarca(el,'check',on); citaDots(el.closest('.wgt'));
  },
  'cita.tachar': function(el){
    var c=card(K()); if(!c) return;
    var on=!el.classList.contains('done'), t=el.querySelector('.ex-v').textContent;
    c.tachadas=c.tachadas||{}; c.tachadas[t]=on;
    citaMarca(el,'done',on);
  },
  'cita.grabar': function(el){ lock(el); citaGrabar(); }, /* Fase 11 · Brief 03 */
  'cita.alarma': function(el){
    var c=card(K()); if(c) c.alarma=true;
    el.textContent='Alarma puesta'; el.setAttribute('disabled','');
  },
  'cita.grabFin': function(el){
    lock(el); var k=K();
    citaGrabStop();
    /* Fase 10 · Brief 16b (ajuste): resumen general, igual en todos los controles y en las cuatro historias (antes hablaba de vacunas) */
    /* Fase 11 · Brief 03: marcado como ejemplo; sale "escríbemelo y lo corrijo" */
    play(k,[{who:'t', think:2, wgt:'<div class="wgt-tr"><span class="wgt-t">Esto entendí de las indicaciones</span><span class="pill espera">Ejemplo</span></div>'+
      '<div class="log">'+
        '<div class="log-r"><span class="log-d"></span><p><b>Tratamiento</b>Seguir igual con lo que ya tiene formulado, sin cambios por ahora.</p></div>'+
        '<div class="log-r"><span class="log-d"></span><p><b>Cuándo volver antes</b>Si los síntomas empeoran o aparece algo nuevo, pedir cita antes o ir a urgencias.</p></div>'+
        '<div class="log-r"><span class="log-d"></span><p><b>Próximo control</b>En 3 meses.</p></div>'+
      '</div>'+
      '<div class="wgt-d">En la demo, este resumen es siempre el mismo.</div>'}]);
  },
  'cita.ordenes': function(el){
    lock(el); var k=K();
    commit(k,{who:'s', text:'Me dieron órdenes nuevas'});
    /* Fase 10 · Brief 16: en la propia historia no hay escaneo; llegan al correo */
    if(k==='ped' && esPropia()){ play(k,[{who:'t', text:'Cuando {eps} las mande a tu correo, las guardo en la Bóveda.'} /* Fase 11 · Brief 04 (C) */,
      {who:'t', wgt:simChip('cita.correo','Simular: llegaron a tu correo')}]); return; }
    /* Fase 10 · Brief 02: solo ped crea trámites con sus órdenes; ter, cir y ctl las guardan */
    play(k,[{who:'t', text: k==='ped' ? 'Tómales una foto y creo los trámites.' : CITA[k].formula ? 'Tómale una foto a la fórmula nueva y la guardo con las de {t3n}.' : 'Tómales una foto y las guardo en la Bóveda.'},
      {who:'t', wgt:'<button type="button" class="btn-p" data-act="cita.escanear">Escanear las órdenes</button>'}]);
  },
  /* Fase 10 · Brief 16: las órdenes nuevas del control en la propia historia; se guardan y cierran el control, sin crear sig */
  'cita.correo': function(el){
    var k='ped', c=card(k); if(c.st==='resuelto') return;
    var dia=fechaCita(c).replace(/^\S+ /,'');
    DOCS.push({ep:'pro', t:'Órdenes del '+dia, s:'Llegaron a tu correo', p:'{wt1}', ty:'orden', cat:'ord', pag:1,
      rel:'Salieron de '+CITA.ped.cierre+'. Las guardé sin crear trámites nuevos.'});
    bovFresh=true; /* Fase 10 · corrección Bóveda */
    bovMarcarNuevos([DOCS[DOCS.length-1]]); /* Fase 10 · Brief 19 */
    commit(k,{who:'t', comp:{fin:1, t:'Cerré '+CITA.ped.cierre+' y guardé las órdenes en la Bóveda', x:PASOS_A /* Fase 11 · Brief 04 */, time:'Hoy · '+horaMas(horaDe(c),40), ev:'Ver en la Bóveda', go:'G1'}});
    citaResolver(k); renderBoveda();
    play(k, proInvita()); /* Fase 10 · Brief 16b */
  },
  /* Fase 10 · Brief 16b: "Ver otra historia" vuelve a empezar en el paso 1 (las historias). Brief 18: sin diálogo (verHistorias) */
  'pro.otra': function(el){ verHistorias(); },
  /* Fase 10 · Brief 18: "No hubo cita" en la propia historia → "Buscar otro horario" muestra los horarios como en las otras historias */
  'pro.otrohorario': function(el){
    lock(el); var k=K();
    commit(k,{who:'s', text:'Buscar otro horario'});
    play(k,[{who:'t', wgt:slotsWgt(k)}]);
  },
  'cita.escanear': function(el){
    /* sin lock(): si sale de la cámara sin guardar, puede volver a intentarlo. guardarTap() cierra el control (citaOrdenesGuardadas) */
    ordScanKey=K(); show('CAM');
  },
  'cita.sinordenes': function(el){
    lock(el); var k=K(), c=card(k);
    commit(k,{who:'s', text:'No me dieron órdenes nuevas'});
    play(k,[{who:'t', comp:{fin:1, t:'Cerré '+CITA[k].cierre, s:c.doc+', '+fechaCita(c), /* Fase 10 · Brief 02: el nombre sale de CITA */
      x:pasosCierre(k), /* Fase 11 · Brief 04 */
      time:'Hoy · '+horaMas(horaDe(c),40), ev:'Ver en la Bóveda', go:'G1'}}].concat(k==='ped' && esPropia() ? proInvita() : [])); /* Fase 10 · Brief 16b */
    citaResolver(k);
  },
  'cita.nohubo': function(el){
    lock(el); var k=K(), c=card(k);
    commit(k,{who:'s', text:'No hubo cita'});
    /* regla fija por trámite (c.sinCupo); no se pregunta por qué no hubo cita */
    if(c.sinCupo){
      play(k,[{who:'t', text:'La orden vence el '+c.vence+' y no hay citas antes de esa fecha. Te ayudo a pedir una orden nueva.'},
        {who:'t', wgt:'<button type="button" class="btn-p" data-act="ped.nueva">Solicitar orden nueva</button>'}]);
    } else if(k==='ped' && esPropia()){
      /* Fase 10 · Brief 18: en la propia historia, "No hubo cita" también cierra la demo: otra historia o, si quiere, los horarios */
      play(k,[{who:'t', text:'Te puedo buscar otro horario, como ya viste. Si quieres ver más de lo que hago, prueba una historia con más trámites.'},
        {who:'t', wgt:'<button type="button" class="btn-p" data-act="pro.otra">Ver otra historia</button>'+
          '<button type="button" class="btn-s" data-act="pro.otrohorario">Buscar otro horario</button>'}]);
    } else {
      /* Fase 10 · Brief 02: ter, cir y ctl no tienen vence; vuelven a como estaban antes de agendar (c.antes) */
      play(k,[{who:'t', text:c.vence ? 'Te busco otra cita. La orden vence el '+c.vence+' y encontré estos horarios antes:' : 'Te busco otra cita. Encontré estos horarios:'},
        {who:'t', wgt:slotsWgt(k)}]);
    }
    citaRevertir(k); /* Fase 10 · Brief 21: la misma vuelta atrás que "No puedo ir" */
    if(c.sinCupo){ c.sub=THREADS[k].p+' · Pedir una orden nueva'; renderInicio(); }
  },
  'cita.muestras': function(el){
    lock(el); var k=K(), c=card(k);
    commit(k,{who:'s', text:'Ya le tomaron las muestras'});
    play(k,[{who:'t', text:'Te aviso cuando lleguen los resultados.'},
      {who:'t', wgt:simChip('cita.resultados','Simular: llegaron los resultados')}]);
    c.st='esperando'; c.fase=null; c.pill='Esperando resultado'; c.pc='espera';
    c.sub=THREADS[k].p+' · toma del '+fechaCita(c);
    THREADS[k].sub=THREADS[k].p+' · esperando resultado'; refreshHilo(k);
    renderInicio();
  },
  'cita.resultados': function(el){
    var k=K(), c=card(k); if(!c || c.st!=='esperando') return;
    DOCS.push({ep:'hta', t:'Resultado de {labl}', /* Fase 11 · Brief 01b */ s:'Resultado · toma del '+fechaCita(c).replace(/^\S+ /,''), p:'{wlab}', ty:'resultado', pag:1, cat:'res', lab:true, th:'lip',
      rel:'Responde a la orden de {labl} del 9 de octubre. El trámite se cerró cuando llegó este resultado.'});
    var ix=DOCS.length-1;
    bovFresh=true; /* mismo aviso de un solo uso que al guardar un escaneo · Fase 10 · corrección Bóveda */
    bovMarcarNuevos([DOCS[ix]]); /* Fase 10 · Brief 19 */
    commit(k,{sep:'3 días después'});
    play(k,[{who:'t', think:1, comp:{fin:1, t:'Llegaron los resultados · {lab} de {p3}', x:PASOS_B /* Fase 11 · Brief 04 */, time:'Hoy · 9:41 a.m.', ev:'Ver el resultado', doc:String(ix)}}]);
    citaResolver(k);
  },
  'ped.mas': function(el){
    lock(el); var k=K();
    commit(k,{who:'s', text:'Ninguno me sirve'});
    play(k,[{who:'t', wgt:calWgt()}]);
  },
  'ped.dia': function(el){
    var w=el.closest('.wgt'), sel=w.querySelector('.cal-d.sel');
    var d=sel?parseInt(sel.getAttribute('data-day'),10):29;
    lock(el); var k=K();
    commit(k,{who:'s', text:'El '+DOW[d].toLowerCase()+' '+d});
    play(k,[{who:'t', wgt:horasWgt(d)}]);
  },
  'ped.volversug': function(el){
    lock(el); var k=K();
    commit(k,{who:'s', text:'Mejor muéstrame los sugeridos'});
    play(k,[{who:'t', wgt:slotsWgt()}]);
  },
  /* Fase 10 · Brief 21: "Tengo un problema" es el chip fijo (#probBar); un botón viejo con esta acción abre su panel */
  'ped.problema': function(el){ probPanelOpen(); },
  'ped.salir': function(el){
    lock(el);
    var k=K(), c=card(k);
    commit(k,{who:'s', text:'No, sigamos'});
    /* Fase 10 · Brief 21: con la cita agendada no se vuelve a ofrecer horarios */
    if(conCita(c)) play(k,[{who:'t', text:'Listo, la cita del '+fechaCita(c)+' sigue en pie.'}]);
    else if(c && c.st==='accionable' && (CITA[k] || k==='cir')) play(k,[{who:'t', wgt:resumeWgt(k)}]);
    else play(k,[{who:'t', text:'Listo, sigue como estaba.'}]);
  },
  'ped.nueva': function(el){
    lock(el);
    var k=K(), c=card(k); if(!c || c.pill==='Solicitada') return;
    commit(k,{who:'s', text:'Solicita la orden nueva'});
    play(k,[{who:'t', think:1, wgt:'<div class="wgt-t">Solicitud enviada ✓</div>'+
      '<div class="wgt-d">Le pedí a {eps}, por su portal, una orden nueva. Te aviso apenas llegue.</div>'} /* Fase 11 · Brief 04 (C) */, /* Fase 11 · Brief 03: sin "normalmente" */
      {who:'t', wgt:simChip('ped.llegoOrden','Simular: llegó la orden nueva')}]); /* Fase 10 · Brief 21: la solicitud ya no se queda en «En curso» para siempre */
    ordenSolicitada(k); /* Fase 10 · Brief 21 */
  },
  /* Fase 10 · Brief 21: llega la orden nueva: vence 21 días después de hoy (HOY_SIM; Fase 11 · Brief 01b: vie 27 nov), ya hay cupo, entra a la Bóveda y el hilo ofrece horarios */
  'ped.llegoOrden': function(el){
    var k=K(), c=card(k); if(!c || c.st!=='encurso' || c.pill!=='Solicitada') return;
    var c0=null; CARDS0.forEach(function(x){ if(x.k===k) c0=x; });
    var mes=Object.keys(MESNUM), d=new Date(HOY_SIM.getTime()+21*864e5), vence=d.getDate()+' de '+mes[d.getMonth()],
        hoy=HOY_SIM.getDate()+' de '+mes[HOY_SIM.getMonth()], antes=c.vence, o=ordenDoc(k), tit=fx(THREADS[k].title);
    setCard(k,{st:'accionable', ordenNueva:true /* Fase 11 · Brief 03: su aviso */, vence:vence, sinCupo:false, pill:'Pendiente', pc:'pendiente', fase:null, when:null,
      sub:(c.antes && c.antes.sub) || (c0 && c0.sub) || THREADS[k].p+' · Agendar la cita'}, THREADS[k].title+' volvió a Inicio');
    THREADS[k].sub=THREADS[k].p+' · vence el '+vence; refreshHilo(k);
    /* Fase 10 · Brief 21 (corrección 2): la orden vieja queda "Vencida" en la Bóveda y sale de DOCREF, así que "Qué llevar",
       "Para mostrar" y el visor usan la nueva; el ítem de la orden en QLLEVAR toma su fecha */
    if(DOCREF[k]) DOCS.forEach(function(x){ if(DOCREF[k](x)) x.vencida=true; });
    if(QLLEVAR[k]) QLLEVAR[k].cel.forEach(function(it){ if(it.doc===k) it.t='Orden médica del '+hoy; });
    DOCS.push({ep:o ? o.ep : (CITA[k].guarda||'pro'), t:'Orden nueva de '+tit.charAt(0).toLowerCase()+tit.slice(1), s:'Llegó el '+hoy+' · vence el '+vence,
      proc:o ? (o.proc||o.t) : THREADS[k].title, fv:HOY_SIM.getDate()+' '+mes[HOY_SIM.getMonth()].slice(0,3),
      p:o ? o.p : THREADS[k].av, ty:'orden', cat:'ord', th:k, pag:1, rel:'Reemplaza la orden anterior'+(antes ? ', que vencía el '+antes : '')+'. Tiene la misma indicación.'});
    bovMarcarNuevos([DOCS[DOCS.length-1]]); bovFresh=true; appVacia=false; renderBoveda();
    commit(k,{sep:'3 días después'});
    play(k,[{who:'t', think:1, text:'Llegó la orden nueva. Vence el '+vence+'. Estos son los horarios:'}, {who:'t', wgt:slotsWgt(k)}]);
    renderInicio();
  },
  'ped.cerrar': function(el){
    var k=K(), c=card(k); if(!c || c.st==='descartado') return; /* Fase 10 · Brief 20: un "Sí, ciérrala" viejo no vuelve a cerrar */
    if(conCita(c) && !cancelYa){ citaPideConfirmar(k, function(){ cancelYa=true; ACT['ped.cerrar'](el); cancelYa=false; }); return; } /* Fase 11 · Brief 04b (B): con cita, primero se confirma; nada se bloquea si se mantiene */
    lock(el);
    commit(k,{who:'s', text:'Sí, ciérrala'});
    /* Fase 10 · Brief 20: cómo estaba antes de cerrar (c.antesCierre) y un "Reabrir" sin lock() (reabrirRestore).
       Fase 10 · Brief 21: con la cita agendada, primero la cancela (vuelve a como estaba antes de agendar) y después cierra (tramCerrar) */
    var pre = conCita(c) ? [citaCancelar(k)] : [];
    tramCerrar(k, pre, 'Dejo de recordártela. La orden sigue en la Bóveda.'); /* Fase 11 · Brief 04 (C) */ /* «Reabrir» ya está debajo */ /* Fase 10 · Brief 02: descartado, no oculto — resetDemo lo restaura */
  },
  /* Fase 10 · Brief 20: reabrir un trámite cerrado, desde el hilo ("Reabrir") o desde la hoja del documento en la Bóveda ("Reabrir el trámite", data-k).
     Brief 21: el cuerpo pasa a tramReabrir(), que también usa "Lo necesito otra vez" */
  'ped.reabrir': function(el){ tramReabrir(el.getAttribute('data-k') || K(), el.hasAttribute('data-k')); },

  'cir.radicar': function(el){
    lock(el);
    commit('cir',{who:'s', text:'Radica la autorización'});
    play('cir',[{who:'t', wgt:'<div class="wgt-t">Antes de radicar, revisa que esté bien</div>'+ /* Fase 8 · Yifrah #6: unifica "enviar"→"radicar" */
      '<div class="wgt-d"><b>Solicitud:</b> autorización de {t2x}<br><b>Paciente:</b> {f3}<br><b>Ante:</b> {epsn}<br><b>Soportes:</b> orden médica e historia clínica del 7 de octubre</div><div class="wgt-d">No radico nada hasta que confirmes.</div>'+
      '<button type="button" class="btn-p" data-act="cir.confirmar">Confirmar y radicar</button>'+
      '<button type="button" class="btn-s" data-go="DOCS">Revisar documentos</button>'+
      '<button type="button" class="btn-s" data-act="cir.cancelar">Cancelar</button>'}]);
  },
  'cir.cancelar': function(el){
    lock(el);
    commit('cir',{who:'s', text:'Todavía no'});
    play('cir',[{who:'t', wgt:'<div class="wgt-t">Sin problema, no radiqué nada</div>'+ /* Fase 8 · Yifrah #6 */
      '<div class="wgt-d">La orden sigue guardada. La radico cuando me digas.</div><div class="wgt-d">Los 5 días cuentan desde que se radique.</div>'+ /* Fase 11 · Brief 04 (C) */
      '<button type="button" class="btn-p" data-act="cir.radicar">Radicar ahora</button>'}]);
  },
  'net.later': function(el){
    lock(el); var k=K();
    commit(k,{who:'s', text:'Guárdala para después'});
    play(k,[{who:'t', wgt:'<div class="wgt-t">Queda lista</div>'+
      '<div class="wgt-d">La dejo lista. Cuando vuelva la conexión, me confirmas y la envío.</div>'}]); /* Fase 11 · Brief 03: sin "te aviso", no hay aviso de conexión */
    if(k==='cir') setCard('cir',{sub:'{p3} · lista para radicar', pill:'Sin enviar', pc:'pendiente',
      bov:['{p3} · lista para radicar, sin enviar','Sin enviar','pendiente']});
    renderInicio();
  },
  'cir.confirmar': function(el){
    lock(el);
    commit('cir',{who:'s', text:'Confirmo, radícala'});
    if(netBlocked()){ netErr('cir','cir.confirmar','{eps}'); return; }
    /* aquí SÍ hay procesamiento real: se conserva la animación */
    play('cir',[{who:'t', think:2, wgt:'<div class="wgt-t">Radicado ante {eps} ✓</div>'+
      '<div class="stepper"><div class="sd done">'+OK_IC+'</div><div class="sl done"></div><div class="sd now">2</div><div class="sl"></div><div class="sd todo">3</div><div class="sl"></div><div class="sd todo">4</div></div>'+
      '<div class="step-lbl"><span>Orden</span><span class="on">Autorización</span><span>Cita</span><span>Resuelto</span></div>'+
      '<div class="wgt-d">Radiqué la solicitud en el portal de {eps}. Envié la orden médica y la historia clínica del 7 de octubre.</div><div class="wgt-d">Responde a más tardar el <b>13 de noviembre</b>.</div>'+ /* Fase 11 · Brief 04 (C): una idea por frase */
      '<div class="log"><div class="log-r"><div class="log-d"></div><p><b>Radicado #45892</b>Hoy, 9:38 a.m.</p></div>'+
      '<div class="log-r"><div class="log-d"></div><p><b>Adjunté la orden del {doc3}</b>Hoy, 9:37 a.m.</p></div></div>'+
      '<button type="button" class="link-u" data-go="DOCS">Ver qué se envió</button>'}, /* Fase 11 · Brief 04 (C): un solo acuse; salen el comprobante "Radiqué la solicitud…" y el toast "Solicitud radicada" */
      /* Fase Móvil · Punto 1c: chips "Simular" — reemplazan los saltos directos a trab/negado del panel externo */
      {who:'t', wgt:'<div class="chipwrap">'+
        '<button type="button" class="chip-o chip-sim" data-act="cir.simEstancado">'+SIM_IC+'Simular: se estancó</button>'+
        '<button type="button" class="chip-o chip-sim" data-act="cir.simNegado">'+SIM_IC+'Simular: negaron la autorización</button>'+
        '</div>'}]);
    THREADS.cir.sub='{p3} · respuesta a más tardar el 13 de noviembre'; refreshHilo('cir'); /* Fase 11 · Brief 03: sale "día 1 de 5" */
    setCard('cir',{st:'encurso', sub:'{p3} · respuesta a más tardar el 13 de noviembre', pill:'Radicado', pc:'espera',
      bov:['{p3} · radicada, esperando respuesta de {eps}','En trámite','espera']}, '{t2} ya está en «En curso»') /* Fase 10 · Rediseño · Brief 10 */;
    renderInicio();
  },
  /* Fase Móvil · Punto 1c: mismo contenido crítico que armaba goTrabado() (ya retirado), pero
     disparado en vivo (commit+play) dentro del hilo ya abierto — no navega a A1 */
  'cir.simEstancado': function(el){
    /* Fase Móvil · sin lock(el): son atajos de demo, no una acción real — deben poder simularse
       varias veces y alternar con cir.simNegado sin tener que reiniciar el prototipo */
    commit('cir',{sep:'6 días después'});
    play('cir',[{who:'t', raw:'<div class="crit"><div class="crit-h">'+WARN+'TRÁMITE ESTANCADO</div><div class="crit-b">'+
      '<p>{eps} incumplió el plazo. Tenía 5 días hábiles para responder y venció ayer.</p>'+
      '<button type="button" class="btn-p" data-act="cir.escalar">Escalar ante Supersalud</button>'+
      '<button type="button" class="btn-danger" data-act="cir.llamar">Llamar a {eps}</button></div></div>'}]);
    THREADS.cir.sub='{p3} · <em>trabado</em>'; refreshHilo('cir');
    setCard('cir',{st:'trabado', sub:'{p3} · <em>{eps} incumplió el plazo</em>', pill:'Estancado', pc:'urgente',
      bov:['{p3} · <em>{eps} incumplió el plazo</em>','Estancado','urgente']});
    renderInicio();
  },
  /* Fase Móvil · Punto 1c: mismo contenido crítico que armaba goNegado() (ya retirado) */
  'cir.simNegado': function(el){
    /* Fase Móvil · sin lock(el): mismo criterio que cir.simEstancado */
    commit('cir',{sep:'4 días después'});
    play('cir',[{who:'t', raw:'<div class="crit"><div class="crit-h">'+WARN+'AUTORIZACIÓN NEGADA</div><div class="crit-b">'+
      '<div class="stepper"><div class="sd done">'+OK_IC+'</div><div class="sl done"></div><div class="sd fail">'+X_IC+'</div><div class="sl"></div><div class="sd todo">3</div><div class="sl"></div><div class="sd todo">4</div></div>'+
      '<div class="step-lbl"><span>Orden</span><span class="on">Autorización</span><span>Cita</span><span>Resuelto</span></div>'+
      '<p>{eps} negó la autorización. Dice que faltó la justificación médica, pero sí estaba.</p>'+'<p style="background:var(--r-exito-suave);border-radius:var(--radio-m);padding:var(--esp-m) var(--esp-m);font-size:var(--fs-secundario);"><b>No fue culpa tuya.</b></p>'+ /* Fase 11 · Brief 04 (C) · Brief 04b (corrección): la caja verde en una línea; sale "de 2 a 5 días", lo dice «Ver la negación completa» */
      '<button type="button" class="btn-p" data-act="cir.revisarApelacion">Pedir que reconsideren</button>'+
      '<button type="button" class="btn-s" data-act="cir.porque">Ver la negación completa</button></div></div>'}]);
    THREADS.cir.sub='{p3} · <em>negada</em>'; refreshHilo('cir');
    setCard('cir',{st:'trabado', sub:'{p3} · <em>{eps} negó la autorización</em>', pill:'Negada', pc:'negada',
      bov:['{p3} · <em>negada el 13 de noviembre</em>','Negada','negada']});
    renderInicio();
  },
  /* Fase 11 · Brief 03: escalar ya no radica; muestra la revisión, como la reconsideración. "No me resolvieron, escalar" llega aquí también */
  /* Fase 11 · Brief 04b (B): la queja ante Supersalud sirve a cir (autorización sin respuesta) y a med (no llegó a domicilio).
     Lo que cambia por trámite vive en QUEJA; las acciones queja.* leen el trámite del hilo abierto (K()) */
  'cir.escalar': function(el){ ACT['queja.revisar'](el); }, /* lo llaman la tarjeta de estancado y «No me resolvieron, escalar» */
  'queja.revisar': function(el){
    lock(el); var k=K();
    commit(k,{who:'s', text:'Escalar ante Supersalud'});
    play(k,[quejaRevision(k)]);
  },
  'queja.cancelar': function(el){
    lock(el); var k=K();
    commit(k,{who:'s', text:'Todavía no'});
    play(k,[{who:'t', wgt:'<div class="wgt-t">Sin problema, no envié nada</div>'+
      '<div class="wgt-d">La queja sigue sin enviarse. Avísame cuando quieras hacerlo.</div>'+
      '<button type="button" class="btn-p" data-act="queja.revisar">Escalar ante Supersalud</button>'}]);
  },
  'queja.enviar': function(el){
    lock(el); var k=K(), q=QUEJA[k]; if(!q) return;
    commit(k,{who:'s', text:'Confirmo, envía la queja'});
    if(netBlocked()){ netErr(k,'queja.enviar','Supersalud'); return; }
    /* Fase 11 · Brief 03: sale el "3 días después" automático; lo que sigue llega solo con el chip */
    play(k,[{who:'t', think:2, wgt:'<div class="wgt-t">Queja enviada a Supersalud ✓</div>'+
      '<div class="wgt-d">Envié la queja por el portal de Supersalud. '+q.adjCorto+'</div><div class="wgt-d">{eps} tiene que responder. Te aviso cuando lo haga.</div>'+ /* Fase 11 · Brief 04 (C) */
      '<div class="log"><div class="log-r"><div class="log-d"></div><p><b>Radicado '+q.radicado+'</b>Hoy, 10:12 a.m.</p></div></div>'},
      {who:'t', wgt:simChip(q.chip[0], q.chip[1])}]);
    if(q.despues) q.despues();
  },
  /* Fase 11 · Brief 03: un solo cierre de "¡Llegó la autorización!" para la queja y la reconsideración. Sin lock(): es un chip «Simular» */
  'cir.simAprobada': function(el){
    [].forEach.call(el.parentNode.querySelectorAll('.chip-sim'), simUsar); /* los dos chips de la reconsideración se excluyen */
    var c=card('cir'); if(!c || c.st!=='encurso') return;
    var queja=c.pill==='Escalado';
    play('cir',[{who:'t', cara:'celebra', wgt:'<div class="wgt-t">¡Llegó la autorización!</div>'+
      '<div class="stepper"><div class="sd done">'+OK_IC+'</div><div class="sl done"></div><div class="sd done">'+OK_IC+'</div><div class="sl done"></div><div class="sd now">3</div><div class="sl"></div><div class="sd todo">4</div></div>'+
      '<div class="step-lbl"><span>Orden</span><span>Autorización</span><span class="on">Cita</span><span>Resuelto</span></div>'+
      '<div class="wgt-d">'+(queja?'Fueron 8 días y una queja, pero quedó.':'{eps} aprobó la reconsideración.')+' Ya puedes agendar la {t2x} de {p3}.</div>'+
      '<button type="button" class="btn-p" data-act="ped.agendar">Agendar la {t2x}</button>'+
      '<button type="button" class="btn-s" data-go="G1">Ver la autorización</button>'}], function(){
      THREADS.cir.sub='{p3} · autorizada'; refreshHilo('cir');
      setCard('cir',{st:'accionable', aprobada:true, sub:'{p3} · Agendar la {t2x}', pill:'Pendiente', pc:'pendiente',
        bov:['{p3} · aprobada el 17 de noviembre','Completado','completo']}, '{t2} volvió a Inicio');
      renderInicio();
    });
  },
  /* Fase 11 · Brief 03: la reconsideración tampoco responde → mismo estado que cir.simEstancado, sin lock() */
  'cir.simSinRespuesta': function(el){
    [].forEach.call(el.parentNode.querySelectorAll('.chip-sim'), simUsar); /* los dos chips de la reconsideración se excluyen */
    var c=card('cir'); if(!c || c.st!=='encurso') return;
    commit('cir',{sep:'10 días hábiles después'});
    play('cir',[{who:'t', raw:'<div class="crit"><div class="crit-h">'+WARN+'TRÁMITE ESTANCADO</div><div class="crit-b">'+
      '<p>{eps} incumplió el plazo. Tenía 10 días hábiles para responder la reconsideración.</p>'+
      '<button type="button" class="btn-p" data-act="cir.escalar">Escalar ante Supersalud</button>'+
      '<button type="button" class="btn-danger" data-act="cir.llamar">Llamar a {eps}</button></div></div>'}]);
    THREADS.cir.sub='{p3} · <em>trabado</em>'; refreshHilo('cir');
    setCard('cir',{st:'trabado', sub:'{p3} · <em>{eps} incumplió el plazo</em>', pill:'Estancado', pc:'urgente',
      bov:['{p3} · <em>{eps} incumplió el plazo</em>','Estancado','urgente']});
    renderInicio();
  },
  'cir.revisarApelacion': function(el){
    lock(el);
    commit('cir',{who:'s', text:'Pide que reconsideren'});
    play('cir',[{who:'t', wgt:'<div class="wgt-t">Antes de radicar, revisa que esté bien</div>'+ /* Fase 8 · Yifrah #6 */
      '<div class="wgt-d"><b>Solicitud:</b> reconsideración de la autorización de {t2x}<br><b>Paciente:</b> {f3}<br><b>Ante:</b> {epsn}<br><b>Soporte:</b> justificación médica tomada de la historia clínica del 7 de octubre</div><div class="wgt-d">No radico nada hasta que confirmes.</div>'+
      '<button type="button" class="btn-p" data-act="cir.apelar">Confirmar y radicar</button>'+
      '<button type="button" class="btn-s" data-act="cir.cancelarApelacion">Cancelar</button>'}]);
  },
  'cir.cancelarApelacion': function(el){
    lock(el);
    commit('cir',{who:'s', text:'Todavía no'});
    play('cir',[{who:'t', wgt:'<div class="wgt-t">Sin problema, no radiqué nada</div>'+ /* Fase 8 · Yifrah #6 */
      '<div class="wgt-d">La reconsideración sigue sin pedirse. Avísame cuando quieras hacerlo.</div>'+
      '<button type="button" class="btn-p" data-act="cir.revisarApelacion">Pedir que reconsideren</button>'}]);
  },
  'cir.apelar': function(el){
    lock(el);
    commit('cir',{who:'s', text:'Confirmo, pide que reconsideren'});
    if(netBlocked()){ netErr('cir','cir.apelar','{eps}'); return; }
    play('cir',[{who:'t', think:2, wgt:'<div class="wgt-t">Solicitud de reconsideración radicada ✓</div>'+
      '<div class="wgt-d">Pedí la reconsideración en el portal de {eps}. Envié la justificación médica de la historia clínica.</div><div class="wgt-d">Tiene 10 días hábiles para responder.</div>'+ /* Fase 11 · Brief 03: canal y qué envié. Fase 11 · Brief 04 (C): sale "Si no lo hacen…", lo dice el chip */
      '<div class="log"><div class="log-r"><div class="log-d"></div><p><b>Radicado RC-2026-3391</b>Hoy, 11:04 a.m.</p></div></div>'},
      /* Fase 11 · Brief 03: el tiempo solo pasa con un chip */
      {who:'t', wgt:'<div class="chipwrap">'+
        '<button type="button" class="chip-o chip-sim" data-act="cir.simAprobada">'+SIM_IC+'Simular: aprobaron</button>'+
        '<button type="button" class="chip-o chip-sim" data-act="cir.simSinRespuesta">'+SIM_IC+'Simular: no respondieron</button>'+
        '</div>'}]);
    setCard('cir',{st:'encurso', sub:'{p3} · reconsideración en curso', pill:'Apelada', pc:'espera',
      bov:['{p3} · reconsideración radicada','En trámite','espera']}, '{t2} ya está en «En curso»') /* Fase 10 · Rediseño · Brief 10 */;
    THREADS.cir.sub='{p3} · reconsideración en curso'; refreshHilo('cir');
    renderInicio();
  },
  'cir.porque': function(el){
    lock(el);
    commit('cir',{who:'s', text:'Muéstrame la negación completa'});
    play('cir',[{who:'t', wgt:'<div class="wgt-t">Esto fue lo que respondieron</div>'+
      '<div class="wgt-d"><b>Radicado:</b> AUT-2026-11938<br><b>Fecha de notificación:</b> 13 de noviembre<br><b>Causal citada:</b> falta de justificación médica para atención fuera de red.</div><div class="wgt-d">Tienes de 2 a 5 días hábiles para pedir que reconsideren. Guardé la negación en la Bóveda.</div>'+ /* Fase 11 · Brief 04 (C) */
      '<button type="button" class="btn-s" data-go="G1" data-bovcat="all">Ver en la Bóveda</button>'}]);
  },
  /* Fase 10 · Brief 15: con otra EPS (o en la propia historia) no hay teléfono: nunca se inventa uno. telLinea() da la línea sin número */
  'cir.llamar': function(el){ lock(el);
    commit('cir',{who:'s', text:'Voy a llamar a {eps}'});
    play('cir',[{who:'t', wgt:'<div class="wgt-t">Te dejo lo que te van a pedir</div>'+
      '<div class="wgt-d">'+telLinea('<b>Línea:</b> {tel} opción 2')+'<br><b>Radicado:</b> AUT-2026-11938<br><b>Paciente:</b> {f3} · CC 41.678.902</div><div class="wgt-d">Si no te resuelven, vuelve y lo escalo.</div>'+
      '<button type="button" class="btn-s" data-act="cir.escalar">No me resolvieron, escalar</button>'}]);
  },

  'nm.agendar': function(el){
    lock(el); var k=K();
    commit(k,{who:'s', text:'Agendar una cita'});
    play(k,[{who:'t', wgt:'<div class="wgt-t">'+cap1(CITA.ped.cierre)+' es el que está más próximo a vencerse</div>'+ /* Fase 10 · Brief 16: igual en las historias; "tu …" en la propia */
      '<div class="wgt-d">La orden vence el '+card('ped').vence+'. Si querías agendar otra cosa, dime cuál.</div>'+
      '<button type="button" class="btn-p" data-thread="ped">Abrir ese trámite</button>'}]);
  },
  'nm.docs': function(el){
    lock(el); var k=K();
    commit(k,{who:'s', text:'Ver mis documentos'});
    /* Fase 10 · Brief 16b: con la Bóveda vacía (cualquier historia) no digo que "están todos"; sin correo, ofrezco buscar */
    if(appVacia || !DOCS.length){ play(k,[{who:'t', text:'Todavía no tengo documentos guardados. Cuando llegue alguno, lo organizo en la Bóveda por persona.'}]
      .concat(mailConnected ? [] : [{who:'t', wgt:'<button type="button" class="btn-p" data-tap="fabmail">Buscar en mi correo</button>'}])); return; }
    play(k,[{who:'t', wgt:'<div class="wgt-t">Están todos en la Bóveda</div>'+
      '<div class="wgt-d">Están ordenados por tipo, y puedes filtrarlos por persona.</div>'+
      '<button type="button" class="btn-p" data-go="G1">Abrir la Bóveda</button>'}]);
  },
  'nm.humano': function(el){
    lock(el); var k=K();
    commit(k,{who:'s', text:'Hablar con una persona'});
    var dat=tramDatos(k); /* Fase 10 · Brief 21: desde un hilo de trámite, sus datos para tener a mano */
    play(k,[{who:'t', wgt:'<div class="wgt-t">Yo no puedo llamar por ti, pero te dejo por dónde</div>'+
      '<div class="wgt-d">'+telLinea('<b>{eps}:</b> {tel}, opción 2 para autorizaciones.')+'<br><b>Supersalud:</b> 01 8000 513 700, para quejas contra la EPS.'+
      (dat ? '</div><div class="wgt-d">Si llamas, ten esto a mano:<br>'+dat : CARDS.some(genVisible) ? '</div><div class="wgt-d">Si llamas, ten a mano el radicado. Te lo tengo en cada trámite.' : '')+'</div>'}]); /* Fase 10 · Brief 16b: el radicado solo si hay algún trámite */
  },
  'med.reclamar': function(el){
    lock(el);
    commit('med',{who:'s', text:'Ya la reclamé'});
    medReclamada(); /* Fase 10 · Brief 21: compartido con "Simular: llegó a domicilio" */
  },
  /* Fase 10 · Brief 21: después de "No hay en la farmacia", la entrega llega a casa y queda como reclamada (mismo resultado que med.reclamar) */
  /* Fase 11 · Brief 04b (B): pasaron las 48 horas sin entrega: la revisión de la queja, la misma de cir */
  'med.noLlego': function(el){
    [].forEach.call(el.parentNode.querySelectorAll('.chip-sim'), simUsar); /* «llegó» y «no llegó» se excluyen */
    var c=card('med'); if(!c || c.st==='descartado') return;
    commit('med',{sep:'2 días después'});
    play('med',[{who:'t', cara:'atenta', text:'Pasaron las 48 horas y no llegó. Puedo poner una queja ante Supersalud.'}, quejaRevision('med')]);
  },
  'med.domicilio': function(el){
    if(el.parentNode.querySelectorAll('.chip-sim').length>1) [].forEach.call(el.parentNode.querySelectorAll('.chip-sim'), simUsar); /* Fase 11 · Brief 04b */
    var c=card('med'); if(!c || c.st==='descartado') return;
    if(c.st!=='encurso'){ medReclamada(); return; } /* Fase 11 · Brief 04 (C) */ /* la tarjeta del aviso pasa a "recibida" (Fase 11 · aviso de entrega) */
    if(!c.entrega) return;
    /* ya iba en la entrega 2: esta es la 3, la última de la fórmula */
    medAvisoRecibida(3); /* Fase 11 · aviso de entrega: sin mensaje nuevo; la tarjeta pasa a "Tercera entrega recibida" y dice lo de renovar */
    THREADS.med.sub='{qmed} · entrega 3 de 3'; refreshHilo('med');
    setCard('med',{sub:'{qmed} · entrega 3 de 3 reclamada', pill:'Reclamada', pc:'espera', entrega:null});
    renderInicio();
  },
  /* Fase 11 · simular la tercera entrega: el 4 de diciembre sale un aviso nuevo (la misma tarjeta de puntos) y la tarjeta de Inicio vuelve a «Reclamar».
     lim:null: la fecha límite de la entrega 2 ya no aplica y la de la 3 no está en los datos (no se inventa) */
  'med.tercera': function(el){
    var c=card('med'); if(!c || c.st!=='encurso' || !c.entrega) return;
    var hoy=new Date(HOY_SIM.getFullYear(), MESNUM[c.entrega.mesTexto], c.entrega.dia);
    commit('med',{sep:c.entrega.dia+' de '+c.entrega.mesTexto});
    var aviso={who:'t', medAviso:1, wgt:medAvisoHTML(3, false, hoy)};
    setCard('med',{st:'accionable', sub:'{qmed} · Reclamar entrega 3 de 3', pill:'Pendiente', pc:'pendiente', entrega:null, lim:null});
    THREADS.med.sub='{qmed} · entrega 3 de 3'; refreshHilo('med');
    play('med',[aviso]);
    renderInicio();
  },
  'med.pedirctl': function(el){ lock(el); medControl('Pedir un control'); }, /* Fase 10 · Brief 21 */
  /* Fase 10 · Brief 21: "Ya no la tomo" → "Ya lo hablé con el médico" cierra el medicamento con "Reabrir" (Brief 20) */
  'med.hablado': function(el){
    lock(el); var c=card('med'); if(!c || c.st==='descartado') return;
    commit('med',{who:'s', text:'Ya lo hablé con el médico'});
    tramCerrar('med', [], 'Dejo de recordarte las entregas.'); /* Fase 11 · Brief 04 (C) */ /* «Reabrir» ya está debajo */
  },
  'med.control': function(el){ lock(el); medControl('Sí, pídela desde ya'); }
};
/* Fase 10 · Brief 21: la entrega 2 queda reclamada; pre = texto de Taremi antes (a domicilio) en vez del "Ya la reclamé" de la persona */
function medReclamada(){ /* Fase 11 · aviso de entrega: sale pre ("Llegó a domicilio."): la tarjeta lo dice */
  bloquearActs('med',['med.reclamar']);
  var n=medEntregaN(); /* la que se acaba de recibir */
  if(n>=3){ /* Fase 11 · simular la tercera entrega: la última. La pregunta del control ya salió con la segunda; la tarjeta dice lo de renovar */
    THREADS.med.sub='{qmed} · entrega 3 de 3'; refreshHilo('med');
    setCard('med',{st:'encurso', sub:'{qmed} · entrega 3 de 3 reclamada', pill:'Reclamada', pc:'espera', entrega:null}, '{t3} ya está en «En curso»');
    medAvisoRecibida(3);
    renderInicio();
    return;
  }
  /* Fase 11 · aviso de entrega: salen «Anotado» y su stepper, y el texto "Llegó a domicilio.": la tarjeta del aviso se actualiza (más abajo, con la fecha nueva) */
  play('med',[
    {who:'t', wgt:'<div class="wgt-t">Una cosa más</div>'+
      '<div class="wgt-d">Con la entrega 3 se acaba esta fórmula. Para renovarla, {p3} necesita un control.</div><div class="wgt-d">¿Te lo pido desde ya?</div>'+ /* Fase 11 · Brief 04 (C) */
      '<button type="button" class="btn-p" data-act="med.control">Sí, pedir cita de control</button>'}, /* Fase 11 · Brief 03: sale "Recordármelo después" */
    {who:'t', wgt:simChip('med.tercera','Simular: llegó el 4 de diciembre')} /* Fase 11 · simular la tercera entrega: el reloj del trámite llega a la fecha de la 3 */
  ]);
  THREADS.med.sub='{qmed} · entrega 2 de 3'; refreshHilo('med');
  setCard('med',{st:'encurso', sub:'{qmed} · próxima entrega desde el 4 dic', /* Fase 11 · Brief 01b */ pill:'Reclamada', pc:'espera', /* Fase 8 · Yifrah #2: "Latente" era vocabulario poco común */
    entrega:{dia:4, mesTexto:'diciembre'}, ultEntrega:hoyTexto() /* Fase 11 · Brief 03 */}, '{t3} ya está en «En curso»') /* Fase 10 · Rediseño · Brief 10 */;
  medAvisoRecibida(n); /* Fase 11 · aviso de entrega: después de setCard, para que salga "desde el 4 de diciembre" */
  renderInicio();
}
/* Fase 10 · Brief 02: crea la tarjeta A "Control para renovar {t3n}"; med sigue en su ciclo (nunca se resuelve).
   Fase 10 · Brief 21: txt = lo que dice la persona ("Sí, pídela desde ya" o "Pedir un control"); si el control ya existe, no se crea otra vez */
function medControl(txt){
  commit('med',{who:'s', text:txt});
  var t=card('ctl');
  if(t && t.st!=='oculto' && t.st!=='descartado'){
    play('med',[{who:'t', text:'El control para renovar {t3n} ya está creado. Ahí te ayudo con la cita.'},
      {who:'t', wgt:'<button type="button" class="btn-s" data-thread="ctl">Abrir el control</button>'}]);
    return;
  }
  play('med',[{who:'t', /* Fase 10 · Brief 42: sin think */ wgt:'<div class="wgt-t">Creé el trámite del control ✓</div>'+
    '<div class="wgt-d">Lo dejé en Inicio: <b>Control para renovar {t3n}</b>. Las entregas siguen igual.</div>'+ /* Fase 11 · Brief 04 (C) */
    '<button type="button" class="btn-s" data-thread="ctl">Abrir el control</button>'}]);
  setCard('ctl',{st:'accionable'}, 'Control para renovar {t3n} llegó a Inicio');
  renderInicio();
}
function lock(el){ var w=el.closest('.wgt'); if(!w) return;
  w.querySelectorAll('button').forEach(function(b){ b.setAttribute('disabled',''); });
  /* Fase 10 · Brief 21: el bloqueo queda en el mensaje (patrón m.lk del Brief 03b, copia y no mutación: los mensajes pueden ser los de INTRO);
     msgEl() lo vuelve a aplicar al pintar el hilo y restoreDraft() no reactiva "Confirmar cita" en un widget bloqueado (data-lk) */
  w.setAttribute('data-lk','');
  var r=w; while(r && !r.__m) r=r.parentNode;
  if(r && !r.__m.lk && cur==='TH' && curThread && THREADS[curThread]){
    var ms=THREADS[curThread].msgs, i=ms.indexOf(r.__m);
    if(i>=0){ ms[i]=Object.assign({},r.__m,{lk:true}); r.__m=ms[i]; }
  }
}

/* ============================================================
   VOZ Y TEXTO LIBRE
   ============================================================ */
/* Fase 10 · Brief 15: k = trámite que nombra la nota; en la propia historia solo salen las de trámites que existen (genVisible) */
var VOICES = {
  gen:[
    {k:'cir', t:'0:07', tx:'Oye Taremi, ¿la {t2x} de {p3} tiene que ser en ayunas? Se me olvidó preguntarle al doctor.',
     r:'Todavía no hay fecha: falta que {eps} autorice. Cuando la haya, anótalo como pregunta para la cita.'} /* Fase 11 · Brief 04 (C) */ /* no se anotaba: sale la promesa */,
    {k:'cir', t:'0:05', tx:'Recuérdame llamar mañana temprano por lo de la autorización de {p3}.',
     r:'No puedo ponerte recordatorios. Si {eps} no responde a tiempo, te aviso y te propongo escalar.'}, /* Fase 11 · Brief 03 */
    {k:'med', t:'0:04', tx:'¿Cuántas pastillas de {t3n} le quedan a {p3}?', /* Fase 11 · Brief 01b */
     r:'Le quedan {dmed} días. Ya puedes reclamar la entrega 2 de 3 en {far1} o en {far2}.', go:'med'}, /* Fase 11 · Brief 03: días calculados */
    {k:'ped', p:'SF', t:'0:08', tx:'Anota que {p1} estuvo con fiebre anoche, para contarlo en el control.',
     r:'Lo anoté para el control de {p1}. Si la fiebre vuelve o te preocupa, consulta sin esperar.', q:'{p1} estuvo con fiebre anoche.'} /* Fase 11 · Brief 03: q = lo que llega a «Tus preguntas» del control */
  ],
  ped:[
    {k:'ped', t:'0:05', tx:'¿Qué tengo que llevar al control de {p1}?',
     r:'La orden médica del 8 de octubre, el carné de vacunación y el documento de identidad. Los tres están en la Bóveda, te los muestro ese día.'},
    {k:'ped', t:'0:06', tx:'¿La orden todavía sirve o ya se venció?',
     r:'Sirve hasta el 10 de noviembre. Quedan 4 días, por eso te la puse de primera en Inicio.'}
  ],
  cir:[
    {k:'cir', t:'0:06', tx:'¿Cuánto llevamos esperando esta autorización?',
     r:'{eps} recibió la solicitud hace 6 días hábiles. El plazo era de 5, así que ya lo incumplió.'},
    {k:'cir', t:'0:05', tx:'¿Y si mejor pago la {t2x} por particular?',
     r:'Puedes, pero pagarías algo que le toca a {eps}. Escalar no te cierra esa opción.'} /* Fase 11 · Brief 04 (C) */
  ],
  med:[
    {k:'med', t:'0:05', tx:'¿Puedo reclamar la fórmula de mi mamá si ella no puede ir?', /* Fase 11 · Brief 01b: la fórmula es de {p3} */
     r:'Sí. Lleva su documento o una copia, y el tuyo. Algunas farmacias piden también una carta firmada por ella.'},
    {k:'med', t:'0:04', tx:'¿En cuál farmacia hay menos fila?',
     r:'Eso no lo sé, no tengo ese dato. Lo que sí sé es que las dos tienen existencias hoy: {far1} y {far2}.'}
  ]
};
var vi=0, EDN=0, editing=null;
var offline=false, failOnce=false, loadFail=false, lastSlot=null;
function setOffline(v){ offline=v; document.getElementById('offbar').style.display = v?'flex':'none'; }
function netBlocked(){ if(failOnce){ failOnce=false; return true; } return offline; }
/* 1 · error de acción en el chat: se queda en el mismo hilo, con salida clara */
function netErr(k, retryAct, quien){
  play(k,[{who:'t', think:1, wgtCls:'err', wgt:'<div class="wgt-t"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>No pude conectar con '+quien+'</div>'+
    '<div class="wgt-d">No se perdió nada: la solicitud quedó armada. Puedes intentarlo otra vez o dejarla para después.</div>'+ /* Fase 11 · Brief 04 (C) */
    '<button type="button" class="btn-p" data-act="'+retryAct+'">Reintentar</button>'+
    '<button type="button" class="btn-s" data-act="net.later">Guardar para después</button>'}]);
}
function voiceNote(){
  var key = curThread && cur==='TH' ? curThread : 'gen';
  if(cur!=='TH'){ openThread('gen','taremi'); key='gen'; }
  if(key==='gen' && genHi){ genConv(); } /* Fase 10 · Brief 06b */
  var list = VOICES[key] || VOICES.gen;
  /* Fase 10 · Brief 15 · Brief 16: la nota de {p1} no sale si el control es tuyo. Brief 18: si es de otra persona, la nombra a ella */
  if(esPropia()) list=list.filter(function(x){ return genVisible(card(x.k)) && (!x.p || V.wt1!=='SO'); }).map(function(x){
    return x.p ? {k:x.k, p:V.wt1, t:x.t, tx:x.tx.replace(/\{p1\}/g, proP()), r:x.r.replace(/\{p1\}/g, proP()), q:x.q && x.q.replace(/\{p1\}/g, proP())} : x; });
  /* Fase 10 · Brief 16: en el hilo del control de la propia historia, las notas nombran lo que de verdad hay */
  if(esPropia() && key==='ped') list=[
    {k:'ped', t:'0:05', tx:'¿Qué tengo que llevar a '+CITA.ped.cierre.replace(/^el /,'al ').replace(/^tu /,'mi ')+'?', /* quien habla dice "mi control" */
     r:cap1(llevarFrase())+'. La orden está en la Bóveda: te la muestro ese día. Lo demás llévalo en físico.'}, /* Fase 11 · Brief 04 (C) */
    {k:'ped', t:'0:06', tx:'¿La orden todavía sirve o ya se venció?', r:'Sirve hasta el 28 de noviembre. Quedan 22 días.'}];
  var v = list.length ? list[vi % list.length] : null; vi++;
  micBtn.classList.add('rec'); micUsado=true; /* Fase 10 · Brief 48: el permiso de micrófono en Configuración */
  chatInput.placeholder='Escuchando…';
  T(function(){
    micBtn.classList.remove('rec');
    chatInput.placeholder='Pregúntale a Taremi…';
    /* Fase 10 · Brief 15: sin ninguna nota aplicable, la nota va sin transcripción y respondo con "no te entendí" */
    if(!v){ commit(key,{who:'s', voice:{t:'0:04', tx:''}}); play(key,[{who:'t', think:1, wgt:noMatchWgt(key)}]); return; }
    commit(key,{who:'s', voice:{t:v.t, tx:v.tx}, ed:'e'+(++EDN)});
    /* Fase 11 · Brief 03: la nota llega de verdad al hilo del control, como pregunta de la persona (citaPreguntas la lee) */
    if(v.q && key!=='ped'){
      if(!THREADS.ped.started) seed('ped', esPropia() ? proIntro() : (INTRO.ped||[]));
      commit('ped',{who:'s', text:v.q, ed:'e'+(++EDN)});
    }
    var reply={who:'t', think:1, text:v.r};
    if(v.go){ reply={who:'t', think:1, wgt:'<div class="wgt-t">'+v.r+'</div><button type="button" class="btn-p" data-thread="'+v.go+'">Abrir el trámite</button>'}; }
    play(key,[reply]);
  }, 1700);
}
function noMatchWgt(k){
  var extra='';
  if(k==='ped') extra='<button type="button" class="chip-o" data-act="ped.agendar">Agendar '+CITA.ped.cierre+'</button>'; /* Fase 10 · Brief 16 */
  if(k==='cir') extra='<button type="button" class="chip-o" data-act="cir.radicar">Radicar la autorización</button>';
  if(k==='med') extra='<button type="button" class="chip-o" data-act="med.reclamar">Marcar la entrega</button>';
  return '<div class="wgt-t">Creo que no te entendí bien</div>'+
    '<div class="wgt-d">Prefiero decírtelo a inventarme una respuesta. ¿Qué necesitas?</div>'+
    '<div class="chipwrap">'+extra+
    (esPropia() && !genVisible(card('ped')) ? '' : '<button type="button" class="chip-o" data-act="nm.agendar">Agendar una cita</button>')+ /* Fase 10 · Brief 15: nombra el control de {p1} */
    '<button type="button" class="chip-o" data-act="nm.docs">Ver mis documentos</button>'+
    '<button type="button" class="chip-o" data-act="nm.humano">Hablar con una persona</button>'+
    '</div><div class="wgt-d" style="font-size:var(--fs-secundario);">O escríbemelo de otra forma. Entre más concreto, mejor te ayudo.</div>';
}
/* Fase 10 · Brief 06b: nombre del trámite en el botón "Abrir …" */
var GO_NOM={ped:'{t1l}', cir:'{t2x}', med:'{t3n}'};
/* Fase 10 · Brief 14 (corrección 4): un trámite existe para el chat general si no está oculto ni descartado y su persona está en la familia */
function genVisible(c){ return !!c && c.st!=='oculto' && c.st!=='descartado' && personaVisible(c); }
/* Fase 11 · Brief 03: frases de agotamiento (Brief 06 (C): suma miedo y desorientación); van antes de cualquier palabra clave de trámite */
var ANGUSTIA_RE=/no puedo m[aá]s|no doy m[aá]s|estoy cansad|agotad|me toca todo|sola con todo|solo con todo|tengo miedo|me da miedo|no s[eé] qu[eé] hacer|no aguanto|desbordad/, agendaPrimera=null;
function textReply(txt){
  if(ANGUSTIA_RE.test(txt.toLowerCase())){
    var ka = curThread && cur==='TH' ? curThread : 'gen';
    if(cur!=='TH'){ openThread('gen','taremi'); ka='gen'; }
    if(ka==='gen' && genHi){ genConv(); }
    commit(ka,{who:'s', text:txt, ed:'e'+(++EDN)});
    play(ka,[{who:'t', think:1, text:'Suena a que estás cargando mucho. No tienes que resolverlo todo hoy.'},
      agendaPrimera ? {who:'t', wgt:'<div class="wgt-d">Si quieres, te digo solo lo más urgente.</div><button type="button" class="btn-p" data-thread="'+agendaPrimera+'">Lo más urgente</button>'}
                    : {who:'t', text:'Hoy no tienes nada urgente.'}]);
    return;
  }
  /* Fase 10 · Brief 01: el día antes de una cita A, lo que se escribe en el hilo se anota como pregunta para el médico */
  var ck=curThread, cc=card(ck);
  /* Fase 10 · Brief 21: en un hilo de trámite, lo escrito que equivale a una opción del chip de ese estado ejecuta esa opción
     (va antes de las preguntas para el médico: "no puedo ir" el día antes cancela, no se anota) */
  if(cur==='TH' && ck && ck!=='gen' && cc){
    var lo=txt.toLowerCase(), op=probOpts(ck).filter(function(o){ return PROB_RE[o] && PROB_RE[o].test(lo); })[0];
    if(op){ probPanelClose(); probRun(ck, op, txt); return; }
  }
  if(cur==='TH' && CITA[ck] && CITA[ck].tipo==='A' && cc && cc.st==='encurso' && cc.fase==='manana'){
    commit(ck,{who:'s', text:txt, ed:'e'+(++EDN)});
    play(ck,[{who:'t', /* Fase 10 · Brief 42: sin think */ text:'La anoté en tus preguntas para la cita.'}]);
    return;
  }
  /* Fase 10 · Ajuste: con horarios abiertos en el hilo, "mejor otro día" hace lo mismo que "No me sirve ninguno" */
  var masBtn = cur==='TH' ? [].slice.call(TH.querySelectorAll('[data-act="ped.mas"]:not([disabled])')).pop() : null;
  if(masBtn && /otro d[ií]a|otra fecha|otra hora|otro horario|ninguno|no me sirve|no puedo|no alcanzo/.test(txt.toLowerCase())){
    lock(masBtn);
    commit(ck,{who:'s', text:txt, ed:'e'+(++EDN)});
    play(ck,[{who:'t', wgt:calWgt(ck)}]);
    return;
  }
  var l=txt.toLowerCase(), r='', go=null, unknown=false;
  /* Fase 10 · Brief 14 (corrección 4): cada respuesta mira el estado real del trámite o de la persona que nombra (genVisible).
     Oculto, descartado o con la persona fuera → la versión "aún no tengo". Solo se nombran datos que existen en el estado. */
  if(/vacun|qu[eé] le toca/.test(l)){ /* Fase 11 · Brief 03: sale /toca/ ("me toca todo" no es el carné). Fase 11 · chip sin respuesta: vuelve solo "qué le toca", la frase del chip «¿Qué le toca a {p1}?» */
    var vk=detSlot('SF'), vFuera=personaFuera(vk);
    var carne=!appVacia && !vFuera && DOCS.some(function(d){ return /^Carné de vacunación/.test(fx(d.t)) && fx(d.p)===vk; });
    r = carne ? 'A {p1} le toca la de los 12 meses desde el {sigd}. El resto del primer año está al día. Lo vi en el carné de la Bóveda.' /* Fase 11 · Brief 04 (C) */
      : vFuera ? 'Todavía no tengo ningún carné de vacunas. Si lo escaneas, te digo qué le toca.'
      : 'Todavía no tengo el carné de vacunas de {p1}. Si lo escaneas, te digo qué le toca.';
  }
  else if(/autoriza|compensar|cirug/.test(l)){
    var ac=card('cir');
    if(!genVisible(ac)) r='No tengo autorizaciones pendientes. Si te dan una orden que la pida, escanéala.'; /* Fase 11 · revisión de frases */
    else {
      go='cir';
      if(ac.st==='trabado' && ac.pill==='Negada') r='{eps} negó la autorización de la {t2x} de {p3}. Puedes pedir que la reconsideren y te acompaño paso a paso.';
      else if(ac.st==='trabado') r='{eps} se pasó del plazo para responder la autorización de {p3}. Te explico cómo escalar.'; /* Fase 11 · Brief 04 (C) */
      else if(ac.st==='resuelto' || /autorizada/.test(THREADS.cir.sub||'')) r='{eps} aprobó la autorización de la {t2x} de {p3}.';
      else if(ac.st==='encurso' && ac.pill==='Escalado') r='La queja de la {t2x} de {p3} ya está ante Supersalud. Te aviso cuando {eps} responda.'; /* Fase 11 · revisión de frases */
      else if(ac.st==='encurso' && ac.pill==='Apelada') r='La reconsideración de la {t2x} de {p3} está radicada ante {eps}. Tiene 10 días hábiles para responder. Si se pasa, te aviso.'; /* Fase 11 · revisión de frases */ /* Fase 10 · Brief 14 (cierre): texto de Lida */
      else if(ac.st==='encurso') r='La autorización de la {t2x} de {p3} está radicada ante {eps}. Responde a más tardar el 13 de noviembre. Si se pasa, te aviso.'; /* Fase 11 · revisión de frases */ /* Fase 11 · Brief 03: la fecha */
      else r='La autorización de la {t2x} de {p3} todavía no está radicada ante {eps}. Si quieres, la radico ahora.';
    }
  }
  else if(/losart|pastilla|medicament|reclam/.test(l)){
    var mc=card('med');
    if(!genVisible(mc)) r='Aún no tengo ninguna fórmula. Si me la mandas, te aviso cuándo reclamar cada entrega.';
    else if(mc.st==='encurso'){ r = mc.entrega ? 'La próxima entrega de {p3} es desde el '+mc.entrega.dia+' de '+mc.entrega.mesTexto+'. Está en el Calendario.' : 'La próxima entrega de {p3} está en el Calendario.'; /* Fase 11 · Brief 01b */ go='med'; }
    else { r='A {p3} le quedan {dmed} días de {t3n}. Puedes reclamar la entrega 2 de 3 desde hoy.'; go='med'; }
  }
  else if(/llev/.test(l)) r = genVisible(card('ped')) ? (esPropia() ? 'Para '+CITA.ped.cierre+': '+llevarFrase()+'.' : 'Para el control de {p1}: la orden médica, el carné de vacunación y el documento de identidad.') : 'Cuando tengas una cita, te digo qué llevar.'; /* Fase 10 · Brief 16 */
  /* Fase 10 · Brief 02b: la respuesta mira el estado de ped; si se descartó, no lo menciona · Brief 14 (corrección 4): oculto o con la persona fuera, tampoco */
  else if(/cita|agend|control/.test(l) && !genVisible(card('ped'))) r='Por ahora no tengo ninguna cita pendiente. Si te dan una orden, escanéala y te ayudo a agendarla.';
  else if(/cita|agend|control/.test(l)){
    var pc=card('ped');
    /* Fase 10 · Brief 16: el nombre y la fecha salen de CITA.ped y de la tarjeta (en las historias dicen lo mismo que antes) */
    if(pc.st==='resuelto') r=cap1(CITA.ped.cierre)+' ya quedó resuelto.';
    else if(pc.st==='encurso' && pc.when){ r=cap1(CITA.ped.cierre)+' es el '+fechaCita(pc)+' a las '+horaDe(pc).replace(/\.$/,'')+'.'; go='ped'; /* Fase 11 · Brief 10: sin punto doble */ }
    else { r=cap1(CITA.ped.cierre)+' sigue sin agendar. La orden vence el '+pc.vence+'. ¿Lo miramos?'; go='ped'; } /* Fase 11 · revisión de frases: una idea por frase */
  }
  else if(/dónde|donde|busca|orden|documento|carné|carnet/.test(l)) r='Todo lo que hemos guardado está en la Bóveda, clasificado por persona. Si me dices el nombre del documento te lo abro directo.';
  else if(/gracias|listo|ok/.test(l)) r='Con gusto. Aquí estoy.';
  else unknown=true;
  var key = curThread && cur==='TH' ? curThread : 'gen';
  if(cur!=='TH'){ openThread('gen','taremi'); key='gen'; }
  if(key==='gen' && genHi){ genConv(); } /* Fase 10 · Brief 06b */
  commit(key,{who:'s', text:txt, ed:'e'+(++EDN)});
  if(unknown){ play(key,[{who:'t', think:1, wgt:noMatchWgt(key)}]); return; }
  /* Fase 10 · Brief 06b: desde el chat general, respuesta corta que lleva al hilo del trámite y deja nota allí (enciende "sin revisar")
     Fase 10 · Brief 14 (corrección 4): el texto va como burbuja normal y el botón aparte, como acción de Taremi (row act, ver msgEl) */
  var reply = [{who:'t', think:1, text:r}];
  if(go) reply.push({who:'t', wgt:'<button type="button" class="btn-p" data-thread="'+go+'">Abrir '+(GO_NOM[go]||'el trámite')+'</button>'});
  if(go && key==='gen' && go!=='gen') THREADS[go].msgs.push({who:'t', text:'Me preguntaste en el chat: «'+txt.replace(/</g,'&lt;')+'». Seguimos aquí.'});
  play(key,reply);
}
chatInput.addEventListener('keydown', function(e){
  if(e.key==='Enter'){ var v=chatInput.value.trim(); if(!v) return; chatInput.value=''; cancelEdit(); textReply(v); }
});
chatInput.addEventListener('input', micMode); /* Fase 10 · Ajuste */
/* Fase 10 · Brief 21: el chip "Tengo un problema" y su panel. Se ve en los hilos de trámite (probSync, desde show());
   el panel se arma al abrirlo con las opciones del estado y se cierra con Escape, al tocar fuera o al volver a tocar el chip */
var probBar=document.getElementById('probBar'), probBtn=document.getElementById('probBtn'),
    probPanel=document.getElementById('probPanel'), probList=document.getElementById('probList');
function probSync(id){
  if(!probBar) return;
  var on = id==='TH' && !!curThread && curThread!=='gen' && !!card(curThread);
  probPanelClose(); probBar.hidden=!on;
}
function probPanelOpen(){
  var k=curThread; if(probBar.hidden || !k) return;
  probList.innerHTML=probOpts(k).map(function(o){ return '<button type="button" class="btn-s" data-prob="'+o+'">'+PROB_L[o]+'</button>'; }).join('');
  probPanel.hidden=false; probBtn.setAttribute('aria-expanded','true');
  var f=probList.querySelector('button'); if(f) f.focus();
}
function probPanelClose(foco){
  if(!probPanel || probPanel.hidden) return;
  probPanel.hidden=true; probBtn.setAttribute('aria-expanded','false');
  if(foco) probBtn.focus();
}
probBtn.addEventListener('click', function(){ if(probPanel.hidden) probPanelOpen(); else probPanelClose(); });
probList.addEventListener('click', function(e){
  var b=e.target.closest('[data-prob]'); if(!b) return;
  var k=curThread; probPanelClose();
  if(k) probRun(k, b.getAttribute('data-prob'));
});
document.addEventListener('click', function(e){ if(!probPanel.hidden && !probBar.contains(e.target)) probPanelClose(); }, true);
document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !probPanel.hidden){ e.preventDefault(); e.stopPropagation(); probPanelClose(true); } }, true);
/* Fase 10 · Ajuste: el alto real de la barra flotante (chips + compositor) se reserva al final de .content */
(function(){
  var dk=document.getElementById('dockIn'), appEl=document.getElementById('app');
  function dockH(){ appEl.style.setProperty('--dock-h', dk.offsetHeight+'px'); }
  if(dk && appEl){ dockH(); if(window.ResizeObserver) new ResizeObserver(dockH).observe(dk); }
})();
/* Fase 10 · Brief 46b: igual para el pie del onboarding. --ob-pie = alto real de .ob-bottom ("Saltar" no sale en todos los pasos); con el onboarding oculto (0) se queda el último valor */
function obPieH(){ var ob=document.getElementById('ob'), pie=ob && ob.querySelector('.ob-bottom'); if(pie && pie.offsetHeight) ob.style.setProperty('--ob-pie', pie.offsetHeight+'px'); }
(function(){ var pie=document.querySelector('#ob .ob-bottom'); if(pie){ obPieH(); if(window.ResizeObserver) new ResizeObserver(obPieH).observe(pie); } })();
document.getElementById('editCancel').addEventListener('click', cancelEdit);
micBtn.addEventListener('click', function(){
  var v=chatInput.value.trim();
  if(v){ chatInput.value=''; micMode(); textReply(v); return; }
  voiceNote();
});
/* Fase 10 · Rediseño · Brief 13: en función, para que un nombre editado o el cambio de historia lleguen a los chips (antes se armaban una sola vez con {p1} de Sonia) */
function paintChips(){
  chips.innerHTML = chipsFam(['¿Qué le toca a {p1}?','¿Cómo va la autorización?','¿Cuántas pastillas le quedan a {p3}?','¿Qué llevo a la cita?']) /* Fase 10 · Rediseño · Brief 13c (corrección) */
    .map(function(c){ var t=fx(c); return '<button type="button" class="chip-s" data-chip="'+t+'">'+t+'</button>'; }).join('');
}
paintChips();

/* ============================================================
   ESCANEO
   ============================================================ */
var shots=0, keepShots=false, tipSeen=false, bovFresh=false;
/* Fase 10 · Brief 08: guion de las hojas. Cada foto se revisa al tomarla; scanShots[i] = {blur:true} mientras la hoja siga borrosa */
/* Fase 10 · Brief 08d: la orden de {labl} va primero (con una sola foto ya se crea el trámite); 1 orden {labl} · 2-3 historia clínica · 4 orden de {t2x} · 5 fórmula */
var SCAN=[
  /* Fase 10 · Brief 14 (captura): c = nombre corto bajo la miniatura */
  {w:'ok',   c:'Orden de {labl}', m:'Orden de {labl} de {p3}. Se lee todo. Con esta creo el trámite.'},
  {w:'warn', c:'Historia clínica 1', m:'Historia clínica de {p3}, hoja 1. Dice «página 1 de 2»: te falta la hoja 2.'},
  {w:'ok',   c:'Historia clínica 2', m:'Hoja 2. Con esta, la historia clínica queda completa.'},
  {w:'warn', c:'Orden de {t2x}', blur:true, m:'Salió borrosa: no alcanzo a leer el nombre del procedimiento. Repítela con más luz.'},
  {w:'ok',   c:'Fórmula médica', m:'Fórmula médica de {p3}. Se lee todo.' /* Fase 11 · Brief 01b */}
];
var SCAN_DEF='La leo bien. La reviso con las demás al final.';
var SCAN_IDLE='Enfoca la hoja completa. Te digo al instante si la leo bien.';
var scanShots=[];
function scanSay(w, txt){
  var h=document.getElementById('scanHint'); if(!h) return;
  h.innerHTML = txt; /* Fase 10 · Brief 14 (captura): sin el ícono; el gesto de la mascota dice cómo salió */
  /* piensa antes de la foto · calma si se leyó bien · atenta si salió borrosa o falta una hoja. Solo se repinta si cambia */
  var g = w==='ok' ? 'calma' : w==='warn' ? 'atenta' : 'piensa', av=document.getElementById('scanAv');
  if(av && av.getAttribute('data-g')!==g){ av.setAttribute('data-g',g); av.innerHTML=mascotaSVG(g,36); }
}
/* lo que queda pendiente, nombrado (no se cuenta) */
function scanPendientes(){
  var p=[];
  if(scanShots[3] && scanShots[3].blur) p.push(fx('repetir la orden de {t2x}'));
  if(scanShots[1] && !scanShots[2]) p.push('la hoja 2 de la historia clínica');
  return p;
}
function scanThumb(i){
  var s=scanShots[i], warn=(i===1 && scanShots.length<3) || s.blur, borrosa=!!s.blur, el=document.createElement(borrosa?'button':'span');
  el.className='thumb'+(borrosa?' borrosa':'');
  if(borrosa){ el.type='button'; el.setAttribute('data-tap','thumb'); el.setAttribute('aria-label','Foto '+(i+1)+', salió borrosa. Toca para repetirla'); }
  else{ el.setAttribute('role','img'); el.setAttribute('aria-label','Foto '+(i+1)+(warn?', falta una hoja':', se lee bien')); }
  /* Fase 10 · Brief 14 (captura): papel blanco de 58×76 con la marca en círculo y el nombre corto debajo (lienzo 59) */
  if(warn) el.classList.add('warn');
  el.innerHTML='<span class="t-hoja" aria-hidden="true"><i></i><i></i><i></i><i></i><span class="t-mk '+(warn?'warn':'ok')+'">'+(warn?ALERT_IC:OK_IC)+'</span></span>'+
    '<span class="t-nm" aria-hidden="true">'+fx(s.c||('Hoja '+(i+1)))+'</span>';
  return el;
}
function scanRefresh(){
  var box=document.getElementById('thumbs'), pend=scanPendientes(), pl=document.getElementById('scanPend'), cd=document.getElementById('camDone');
  [].forEach.call(box.querySelectorAll('.thumb'), function(x,i){
    var n=scanThumb(i);
    if(x.classList.contains('nueva')) n.classList.add('nueva');
    if(x.classList.contains('sel') && n.tagName==='BUTTON') n.classList.add('sel');
    if(x.outerHTML!==n.outerHTML) box.replaceChild(n,x);
  });
  var rb=document.getElementById('retakeBtn'); if(rb && !box.querySelector('.thumb.sel')) rb.hidden=true;
  pl.hidden=!pend.length; pl.textContent = pend.length ? 'Aún falta: '+pend.join(' · ') : '';
  cd.textContent = pend.length ? 'Continuar así' : 'Listo, son todas';
  cd.className = pend.length ? 'btn-s' : 'btn-p';
}
function resetCam(){ camAltCerrar(); /* Fase 11 · Brief 05 (B) */ shots=0; scanShots=[]; hoja2Mode=false; /* Fase 10 · Brief 08f */ document.getElementById('thumbs').innerHTML=''; document.getElementById('shotC').textContent='0 fotos';
  scanSay('', SCAN_IDLE);
  document.getElementById('retakeBtn').hidden=true; scanRefresh(); /* Fase 10 · Brief 08 */
  document.getElementById('camDone').setAttribute('disabled',''); }
/* Fase 11 · Brief 05 (B): «Simular: la cámara no alcanza a leer». Las fotos tomadas se guardan sin leer (ty 'imagen', sin persona ni trámite,
   en «Sin consulta asociada») y el panel ofrece las entradas que ya existen: en el onboarding, las tarjetas del paso 4 (correo y PDF;
   ahí no hay pegar texto); en la app, el correo (Revisar ahora si está conectado; si no, Conectar tu correo del FAB), GAL y PEG */
function camEnOb(){ return !obHecho && obScanActive; }
function camNoLee(){
  var n=shots, ob=camEnOb();
  for(var i=0;i<n;i++) DOCS.push({ep:'na', t:'Foto '+(i+1)+', '+hoyTexto(), s:hoyTexto()+' · sin leer', p:null, ty:'imagen', pag:1});
  resetCam(); /* ya están en la Bóveda: salir no pierde nada */
  var alt=document.getElementById('scrimCamAlt'), en=function(w, si){ alt.querySelector('[data-camalt="'+w+'"]').hidden=!si; };
  en('mail', !ob || !document.getElementById('obMail').getAttribute('data-done'));
  en('pdf', !ob || !document.getElementById('obUploadCard').getAttribute('data-done'));
  en('peg', !ob);
  var nt=document.getElementById('camAltN');
  nt.hidden=!n; nt.textContent = n===1 ? 'La foto queda en la Bóveda como imagen, para mostrarla en la cita.' : 'Las '+n+' fotos quedan en la Bóveda como imagen, para mostrarlas en la cita.';
  document.getElementById('camAltAv').innerHTML=mascotaSVG('atenta', 42);
  /* Fase 11 · Brief 05 (corrección): una hoja con velo sobre la cámara. Ya no se esconden el chip, el disparador ni «Listo»: el velo los tapa */
  alt.style.display='flex';
  document.getElementById('CAM').classList.add('cam-alt-on'); /* Fase 11 · Brief 05 (ajuste): sin la burbuja del visor */
}
/* Fase 11 · Brief 05 (corrección): cerrar la hoja (velo, «Seguir intentando» o closeSheets) vuelve a la cámara con su burbuja */
function camAltCerrar(){
  var alt=document.getElementById('scrimCamAlt'); if(alt) alt.style.display='none';
  document.getElementById('CAM').classList.remove('cam-alt-on');
}
function camAltIr(w){
  closeSheets(); /* Fase 11 · Brief 05 (corrección): primero se cierra la hoja */
  if(camEnOb()){ goBackMain(); var c=document.getElementById(w==='mail' ? 'obMail' : 'obUploadCard'); if(c) c.click(); return; } /* vuelve al paso 4 y abre su tarjeta */
  if(w==='mail'){
    if(mailConnected){ mailRevisado=Date.now(); cfgToast='Revisé tu correo. No hay nada nuevo.'; show('CONFIG'); } /* lo mismo que «Revisar ahora» */
    else { fabMailActive=true; show('PROC'); } /* lo mismo que «Conectar tu correo» del FAB */
    return;
  }
  show(w==='pdf' ? 'GAL' : 'PEG');
}
function shutterTap(){
  if(shots>=8 || (hoja2Mode && shots>=1)) return; /* Fase 10 · Brief 08f: desde #FIN solo falta una hoja */
  camUsada=true; /* Fase 10 · Brief 48: el permiso de cámara en Configuración */
  var d=hoja2Mode ? SCAN[2] : SCAN[shots]; /* Fase 10 · Brief 08 */
  scanShots.push({blur:!!(d&&d.blur), c:d&&d.c}); /* Fase 10 · Brief 14 (captura): c = nombre corto de la miniatura */
  shots++;
  var box=document.getElementById('thumbs');
  [].forEach.call(box.querySelectorAll('.thumb'), function(x){ x.classList.remove('nueva'); });
  var t=scanThumb(shots-1); t.classList.add('nueva');
  box.appendChild(t);
  document.getElementById('shotC').textContent = shots+' foto'+(shots>1?'s':'');
  document.getElementById('camDone').removeAttribute('disabled');
  scanRefresh(); scanSay(d?d.w:'ok', fx(d?d.m:SCAN_DEF));
}
/* Fase 10 · Brief 08: tocar la miniatura borrosa ofrece repetirla; repetirla la deja leíble */
function thumbTap(){
  var t=document.querySelector('#thumbs .thumb.borrosa'); if(!t) return;
  t.classList.add('sel'); document.getElementById('retakeBtn').hidden=false;
}
function retakeTap(){
  if(!scanShots[3]) return;
  scanShots[3].blur=false;
  var pi=document.getElementById('procInput'); if(pi){ pi.value=fx('{t2x}'); detCheckReady(); } /* Fase 10 · Brief 08f (ajuste): lo leído reemplaza lo escrito */
  document.getElementById('retakeBtn').hidden=true;
  scanRefresh();
  scanSay('ok','Ahora sí: leí el nombre del procedimiento.');
}
function camDoneTap(){ if(!shots) return; if(hoja2Mode){ hoja2Done(); return; } /* Fase 10 · Brief 08f */ procFrom='CAM'; show('PROC'); }
/* H09: volver a la cámara SIN borrar lo ya fotografiado */
function masFotosTap(){
  keepShots=true;
  show('CAM');
  var pend=scanPendientes(); /* Fase 10 · Brief 08: fotos, estados y pendientes se conservan */
  scanSay(pend.length?'warn':'', 'Toma la foto de lo que falta. Las demás siguen aquí.');
}
function guardarTap(){
  if(obHecho){ obScanActive=false; obMailActive=false; } /* Fase 10 · Brief 45b: con el onboarding terminado, el guardado siempre es el de la app */
  /* Fase 10 · Brief 01: la captura se abrió desde "Escanear las órdenes" de ¿Cómo te fue? — cierra el control y crea el trámite */
  if(ordScanKey){ var ok=ordScanKey; ordScanKey=null; citaOrdenesGuardadas(ok); return; }
  /* Fase 10 · Brief 08c: la historia clínica queda con 1 de 2 hojas y su pendiente si falta la hoja 2 */
  var hcInc = detView.has[0] && !detView.hoja2;
  var hcDoc = scanDoc(function(d){ return d.ep==='ort' && d.ty==='soporte' && /^Historia clínica/.test(d.t); }); /* Fase 10 · Brief 47: también si su persona no está en la familia */
  if(hcDoc && detView.has[0] && !obMailActive && !fabMailActive){
    hcDoc.s = hcInc ? '7 de octubre · 1 de 2 hojas' : '7 de octubre · 2 hojas'; /* Fase 11 · Brief 01b */
    if(hcInc) hcDoc.pill=['Falta una hoja','pendiente']; else delete hcDoc.pill;
    renderBoveda();
  }
  /* Fase 10 · Brief 08f: la orden sin procedimiento y la fórmula sin médico se guardan igual, marcadas (mismo patrón que la hoja 2) */
  var mi=document.getElementById('medInput'), pin=document.getElementById('procInput');
  var medMissing = detView.has[2] && !!(mi && !mi.value.trim());
  var ordMissing = detView.has[1] && detView.borrosa && !(pin && pin.value.trim());
  var ordDoc=null, fDoc=null;
  if(!obMailActive && !fabMailActive){
    ordDoc = scanDoc(function(d){ return d.ep==='ort' && d.ty==='orden' && d.th==='cir'; }); /* Fase 10 · Brief 47 */
    /* Fase 10 · Brief 08f (ajuste): con la foto nítida, el procedimiento es lo que se leyó ({t2x}) y reemplaza lo escrito a mano */
    if(ordDoc && detView.has[1]){
      if(ordMissing){ ordDoc.pill=FALTA_PROC.slice(); delete ordDoc.proc; }
      else { ordDoc.proc = detView.borrosa ? pin.value.trim() : '{t2x}'; if(ordDoc.pill && ordDoc.pill[0]===FALTA_PROC[0]) delete ordDoc.pill; }
    }
    if(detView.has[2]){
      fDoc = scanDoc(function(d){ return d.fscan; }); /* Fase 10 · Brief 47 */
      if(!fDoc){ fDoc={ep:'ort', t:'Fórmula médica, 7 de octubre', s:'7 de octubre', p:'{wort}', ty:'orden', cat:'med', pag:1, fscan:true}; DOCS.push(fDoc); }
      if(medMissing){ fDoc.pill=FALTA_MED.slice(); delete fDoc.med; } else { delete fDoc.pill; fDoc.med=mi ? mi.value.trim() : ''; }
    }
    renderBoveda();
  }
  /* Fase 11 · Brief 14b: {lab} se revela solo al escanear su orden (ya no por el correo) */
  var lipDoc = scanDoc(function(d){ return d.ep==='hta' && d.ty==='orden' && d.th==='lip'; }); /* Fase 11 · Brief 01b */
  if(!lipDoc && detView.has[3] && !obMailActive && !fabMailActive){ lipDoc={ep:'hta', t:'Orden de {labl}', s:'Medicina general · 9 de octubre', p:'{wlab}', ty:'orden', pag:1, cat:'ord', th:'lip'}; DOCS.push(lipDoc); } /* Fase 11 · Brief 14b: se crea al escanear, como la fórmula */
  /* Fase 10 · Brief 47: lo escaneado de quien no está en la familia queda en DOCS_PEND (no se pierde); SCAN_IDS = quién aparece en lo escaneado */
  if(!obMailActive && !fabMailActive){
    var escan=[detView.has[0] && hcDoc, detView.has[1] && ordDoc, detView.has[2] && fDoc, detView.has[3] && lipDoc].filter(Boolean);
    var slots=function(ds){ var r=[]; ds.forEach(function(d){ var k=detSlot(fx(d.p)); if(r.indexOf(k)<0) r.push(k); }); return r; };
    if(obScanActive){
      SCAN_IDS = document.getElementById('obMail').getAttribute('data-done') ? null : slots(escan).concat((SCAN_IDS||[]).filter(function(k){ return slots(escan).indexOf(k)<0; }));
    } else if(!esPropia()){
      var aPend=escan.filter(function(d){ var k=fx(d.p); return personaNoAgregada(k) && !(detDe(k)||{}).fuera; });
      escan.forEach(function(d){
        if(aPend.indexOf(d)<0 && personaFuera(fx(d.p))) return; /* "No es de mi familia": como hoy */
        DOCS_BANDEJA=DOCS_BANDEJA.filter(function(x){ return x!==d; });
        if(aPend.indexOf(d)>=0){ DOCS=DOCS.filter(function(x){ return x!==d; }); if(DOCS_PEND.indexOf(d)<0) DOCS_PEND.push(d); }
        else { DOCS_PEND=DOCS_PEND.filter(function(x){ return x!==d; }); if(DOCS.indexOf(d)<0) DOCS.push(d); }
      });
      if(aPend.length){ scanPend=true; SCAN_IDS=slots(DOCS_PEND); } /* Fase 10 · Brief 47: todo lo pendiente cuenta para la detección del escaneo */
    }
    FIN_ULT={hcInc:hcInc, ordMissing:ordMissing, medMissing:medMissing, ordDoc:ordDoc, fDoc:fDoc};
  }
  if(!obMailActive && !fabMailActive){
    var lipC0=card('lip');
    if(detView.has[3] && lipC0 && (obScanActive || personaVisible(lipC0))) setCard('lip',{st:'accionable'}); /* Fase 10 · Brief 08c: solo si se tomó la foto de la orden de {labl}. Brief 47: y en la app, solo si su persona es visible */
    bovFresh=true; /* Fase 10 · corrección Bóveda */
    /* Fase 10 · Brief 19: lo que se fotografió queda marcado como nuevo (has = [historia, orden {t2x}, fórmula, orden {labl}]) */
    bovMarcarNuevos([detView.has[0] && hcDoc, detView.has[1] && ordDoc, detView.has[2] && fDoc, detView.has[3] && lipDoc]
      .filter(function(d){ return d && DOCS.indexOf(d)>=0; })); /* Fase 10 · Brief 47: lo que quedó en DOCS_PEND no está en la Bóveda */
    appVacia=false; /* Fase 8 · Coherencia: escanear/subir apaga el estado vacío, con o sin onboarding activo */
    renderInicio();
    if(scanPend){ renderBoveda(); show('A1'); docPendAbrir(); return; } /* Fase 10 · Brief 47: "¿de quién es?" antes de FIN */
  }
  /* Fase 8 · Brief 6.1: correo desde el FAB, fuera del onboarding — vuelve a Inicio con un toast sin "Deshacer" */
  if(fabMailActive){
    fabMailActive=false;
    mailConnected=true; mailRevisado=Date.now(); /* Fase 10 · Brief 45: el correo queda conectado solo al guardar */ /* Fase 10 · Brief 48: mailRevisado */
    if(esPropia()){ proGuardar(); pendingNote='Guardé todo lo que encontré en tu correo ✓'; renderInicio(); show('A1'); return; } /* Fase 10 · Brief 16: la orden de ejemplo y el control */
    /* Fase 10 · Brief 45: lo de la familia confirmada entra a la Bóveda; lo de quien no se ha confirmado pasa a DOCS_PEND */
    var traidos=[];
    DOCS_BANDEJA.forEach(function(d){
      var k=fx(d.p);
      if(detCarneFuera(d) || (detDe(k)||{}).fuera) return;
      if(personaFuera(k)) DOCS_PEND.push(d);
      else if(!DOCS.some(function(x){ return docMismo(x,d); })) traidos.push(d);
    });
    DOCS_BANDEJA=[]; DOCS=DOCS.concat(traidos);
    SCAN_IDS=null; /* Fase 10 · Brief 47: lo pendiente ya no viene solo de un escaneo */
    // revela ped/cir/med solo si siguen ocultas — no pisar un estado más avanzado
    // si el panel ya las movió a trabado/encurso en algún momento de la demo
    /* Fase 10 · Brief 45: y solo si su persona es visible, como revela() en obFinish() */
    ['ped','cir','med','ter'].forEach(function(k){ var c=card(k); if(c && c.st==='oculto' && personaVisible(c)) c.st='accionable'; }); /* Fase 11 · Brief 14b: sale lip (solo nace al escanear) */
    appVacia=false;
    bovMarcarNuevos(DOCS.slice()); /* Fase 10 · Brief 19: lo que trajo el correo queda como nuevo */
    renderInicio();
    if(DOCS_PEND.length){ fabPend=true; show('A1'); docPendAbrir(); return; } /* Fase 10 · Brief 45: directo al paso 5 reabierto (obReabre='A1') */
    pendingNote='Guardé todo lo que encontré en tu correo ✓';
    renderInicio();
    show('A1');
    return;
  }
  /* Fase 6 · guardado disparado desde el onboarding: no hay trámite de la app en curso que cerrar con FIN */
  /* Fase Móvil · bug: mandaba a obShow(2) (el antiguo paso de elegir familia) en vez de
     volver al paso del que salió — el paso 2 quedó fijo desde antes del Punto 1a (cuando ese paso nuevo
     de elegir familia no existía y el 2 era "Déjame el trabajo pesado"). Con el paso de familia insertado
     en medio, "Déjame el trabajo pesado" pasó a ser el 3 (ver applyProfile()/data-obfam más abajo, que sí
     ya usa obShow(3)) y esto quedó desactualizado, armando un bucle: familia → importar → guardar →
     familia de nuevo, sin poder salir. Fase 10 · Rediseño · Brief 13: "traer documentos" es el paso 4 */
  if(obScanActive || obMailActive){
    if(obMailActive){ proGuardar(); mailConnected=true; mailRevisado=Date.now(); /* Fase 10 · Brief 48 */ SCAN_IDS=null; } /* Fase 10 · Brief 47: SCAN_IDS */ /* Fase 10 · Brief 16 · Brief 45: el correo queda conectado solo al guardar */
    if(obMailActive && !esPropia()) bovMarcarNuevos(DOCS.slice()); /* Fase 10 · Brief 19: lo que trajo el correo queda como nuevo */
    markObDone();
    obScanActive=false;
    obMailActive=false;
    obScanDone=true;
    ob.classList.remove('hidden');
    obShow(4);
    return;
  }
  finArmar();
}
/* Fase 10 · Brief 47: el armado de FIN sale de guardarTap() para mostrarlo también después de "¿de quién es?" (docPendFin) */
var FIN_ULT={};
function finArmar(){
  var hcInc=FIN_ULT.hcInc, ordMissing=FIN_ULT.ordMissing, medMissing=FIN_ULT.medMissing, ordDoc=FIN_ULT.ordDoc, fDoc=FIN_ULT.fDoc;
  /* Fase 10 · Brief 08c: FIN se arma según lo que se escaneó y lo que quedó guardado (sin conteos) */
  var guard=[];
  if(detView.has[0]) guard.push('Historia clínica');
  if(detView.has[1] && !ordMissing) guard.push(fx('Orden de {t2x}'));
  if(detView.has[2] && !medMissing) guard.push('Fórmula médica');
  var gTxt = guard.length>1 ? guard.slice(0,-1).join(', ')+' y '+guard[guard.length-1].replace(/^[A-ZÁÉÍÓÚ]/,function(c){return c.toLowerCase();}) : (guard[0]||'');
  var pend = medMissing || ordMissing || hcInc;
  var finEl=document.getElementById('FIN');
  if(finEl) finEl.setAttribute('data-title', pend ? 'Lo guardé, falta completar' : 'Listo, lo guardé'); /* Fase 10 · Brief 08f */
  var gTitle=document.getElementById('finGroupTitle');
  if(gTitle) gTitle.textContent = gTxt;
  var vis=function(id,on){ var e=document.getElementById(id); if(e) e.style.display = on ? 'flex' : 'none'; };
  vis('finGroupRow', guard.length>0); vis('finLabRow', detView.has[3]);
  /* Fase 10 · Brief 08d: la fila de {lab} dice dónde quedó, con la fecha de lip.vence y la regla de los 30 días */
  var lipC=card('lip'), lipEn=!!lipC && en30(lipC);
  /* Fase 10 · Brief 14 (cierre del escaneo): la tarjeta nombra el trámite con su pill, a quién es y cuándo vence, y dónde quedó */
  var lp=document.getElementById('finLabPill'), l1=document.getElementById('finLabL1'), l2=document.getElementById('finLabL2');
  if(lp && lipC){
    lp.className='pill '+(lipEn ? lipC.pc : 'pendiente'); lp.textContent = lipEn ? lipC.pill : 'Sin agendar'; /* Fase 11 · Brief 05 (A) */
    l1.textContent = fx((PNAME[lipC.av]||'{p3}')+' · vence el '+lipC.vence);
    l2.textContent = lipEn ? 'Ya está en Inicio.' : 'Está en el Calendario. Aparece en Inicio un mes antes.';
  }
  var fcb=document.getElementById('finCalBtn'); if(fcb) fcb.style.display = (detView.has[3] && !lipEn) ? '' : 'none';
  vis('finHcRow', hcInc); vis('finOrdRow', ordMissing); vis('finMedWarnRow', medMissing);
  var ot=document.getElementById('finOrdTitle'); if(ot) ot.textContent=fx('Orden de {t2x}');
  /* Fase 10 · Brief 08f: "Completar" abre ese documento en la Bóveda */
  var fob=document.getElementById('finOrdBtn'); if(fob && ordDoc) fob.setAttribute('data-ix', DOCS.indexOf(ordDoc));
  var mb=document.getElementById('finMedBtn'); if(mb && fDoc) mb.setAttribute('data-ix', DOCS.indexOf(fDoc));

  /* La confirmación deja de ser un toast que se esfuma: es una pantalla que pide un toque */
  show('FIN');
  var t=document.getElementById('finTip');
  if(t) t.style.display = tipSeen ? 'none' : 'flex';
}
function finTap(){ tipSeen=true; show('A1'); }
/* Fase 10 · Brief 08d: "Ver en el Calendario" abre #F1, donde {lab} está en «Sin agendar» (Fase 11 · Brief 05) */
function finCalTap(){ tipSeen=true; show('F1'); }
/* Fase 10 · Brief 08f: "Completar" abre el documento marcado en la Bóveda; "Escanear la hoja 2" abre la cámara solo para esa hoja */
function finCompTap(b){ var ix=b.getAttribute('data-ix'); if(ix===null) return; tipSeen=true; show('G1'); openViewer(ix); }
var hoja2Mode=false;
function hoja2Tap(){ tipSeen=true; show('CAM'); hoja2Mode=true; scanSay('', 'Toma la foto de la hoja 2 de la historia clínica. La uno a la hoja 1.'); }
function hoja2Done(){
  hoja2Mode=false;
  var hc=DOCS.filter(function(d){ return d.ep==='ort' && d.ty==='soporte' && /^Historia clínica/.test(d.t); })[0];
  if(!hc){ show('G1'); return; }
  hc.s='7 de octubre · 2 hojas'; delete hc.pill;
  show('G1'); openViewer(DOCS.indexOf(hc)); vFixToast();
}
var PEOPLE={};
var ptagPend=null;
/* Fase 6 · Brief 3 (#20, #21): el lote entero es de una persona (Fase 11 · Brief 01b: {p3}, código 'MA') y el médico ya aparece en la Orden de {t2x} del mismo lote (V.doc3) —
   se auto-asignan ambos, corregibles a mano si algo quedó mal */
/* Fase 10 · Brief 08: #DET muestra lo que pasó en la cámara. Sin fotos de la cámara (galería, PDF) queda como antes */
var detView={has:[1,1,1,1], hoja2:true, borrosa:false};
function detDesdeCam(){
  var n=(procFrom==='CAM') ? scanShots.length : 0;
  detView = n ? {has:[n>=2,n>=4,n>=5,n>=1], hoja2:n>=3, borrosa:n>=4 && !!scanShots[3].blur} /* Fase 10 · Brief 08d: has = [historia, orden {t2x}, fórmula, orden {labl}] */ : {has:[1,1,1,1], hoja2:true, borrosa:false};
  for(var i=0;i<4;i++){ var c=document.getElementById('detCard'+i); if(c) c.style.display = detView.has[i] ? '' : 'none'; }
  var sub=document.getElementById('detSub0'); if(sub) sub.textContent = fx('{p3} · ')+(detView.hoja2?'2 hojas':'1 de 2 hojas'); /* Fase 11 · Brief 01b */
  var pr=document.getElementById('procRow'), pi=document.getElementById('procInput'); if(pi) pi.value = detView.borrosa ? '' : fx('{t2x}'); /* Fase 10 · Brief 08f (ajuste): nítida = lo leído */
  if(pr) pr.hidden=!detView.borrosa;
  var b1=document.querySelector('[data-revb="1"]'); if(b1) b1.style.display = detView.borrosa ? '' : 'none'; /* Fase 10 · Brief 29 */
  detCheckReady();
}
function detChipSet(id, ok, txt){
  var c=document.getElementById(id); if(!c) return;
  c.className = ok ? 'ok-chip' : 'warn-chip';
  c.innerHTML = ok ? OK_IC+'Listo' : WARN_IC+txt;
}
function resetDet(){
  setPtag(3, 'MT');
  var mi=document.getElementById('medInput'); if(mi) mi.value=fx('{doc3}');
  detDesdeCam();
}
function setPtag(i, code){
  var t=document.querySelector('[data-ptag="'+i+'"]'); if(!t) return;
  var pr=PEOPLE[code];
  t.className='ptag';
  t.innerHTML='<span class="av" data-p="'+code+'" style="background:'+pr[1]+'">'+code+'</span>'+pr[0];
  if(i===3){
    var row=document.getElementById('pacRow'); if(row) row.classList.remove('warn');
    var ic=document.getElementById('pacIcon'); if(ic){ ic.innerHTML=OK_IC; ic.className='ex-mk'; } /* Fase 10 · Brief 28: check SVG por clase, sin estilo en línea */
    var sub=document.getElementById('card2Sub'); if(sub) sub.textContent=pr[0]+' · medicamentos';
    detCheckReady();
  }
}
function detCheckReady(){
  var pacDone = document.querySelector('[data-ptag="3"]').className.indexOf('warn')===-1;
  var mi=document.getElementById('medInput');
  var medDone = !!(mi && mi.value.trim());
  var mr=document.getElementById('medRow'), mic=document.getElementById('medIcon'), mw=document.getElementById('medWarnMsg');
  if(mr) mr.classList.toggle('warn', !medDone);
  if(mic){ mic.innerHTML = medDone ? OK_IC : ALERT_IC; /* Fase 10 · Brief 28 */ mic.className = 'ex-mk'+(medDone?'':' warn'); } /* Fase 10 · Brief 25: marca de alerta por clase */
  if(mw) mw.style.display = medDone ? 'flex' : 'none';
  var chip=document.getElementById('card2Chip');
  if(chip){
    if(pacDone && medDone){ chip.className='ok-chip'; chip.innerHTML='<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Listo'; }
    else{ chip.className='warn-chip'; chip.innerHTML='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>Revisar'; }
  }
  /* Fase 10 · Brief 08: historia clínica y orden según lo que pasó en la cámara */
  var pi2=document.getElementById('procInput'), procDone = !detView.borrosa || !!(pi2 && pi2.value.trim());
  detChipSet('detChip0', detView.hoja2, 'Falta una hoja');
  detChipSet('detChip1', procDone, 'Revisa');
  var prw=document.getElementById('procRow'), pic=document.getElementById('procIcon');
  if(prw) prw.classList.toggle('warn', !procDone);
  if(pic){ pic.innerHTML = procDone ? OK_IC : ALERT_IC; /* Fase 10 · Brief 28 */ pic.className = 'ex-mk'+(procDone?'':' warn'); }
  /* Fase 6 · #22: ya no se deshabilita — si algo queda dudoso, igual se pueden guardar los documentos ya confirmados aparte */
  var btn=document.getElementById('btnGuardar');
  if(btn){
    /* Fase 10 · Brief 08: el texto sigue lo que hay en pantalla; si no están las 4 tarjetas, no se cuenta */
    var rd=[detView.hoja2, procDone, pacDone && medDone, true], all=true;
    for(var k=0;k<4;k++){ if(!detView.has[k]) continue; if(!rd[k]) all=false; }
    btn.textContent = all ? 'Guardar en la Bóveda' : 'Guardar lo confirmado'; /* Fase 10 · Brief 08c: sin conteo */
  }
}
/* delegado porque applyProfile() reconstruye el innerHTML de DET al cambiar de perfil */
document.addEventListener('input', function(e){ if(e.target && (e.target.id==='medInput' || e.target.id==='procInput')) detCheckReady(); });

/* ============================================================
   NAVEGACIÓN
   ============================================================ */
/* Fase 11 · Brief 14b: degradados de desplazamiento; .fade-t / .fade-b en .content según haya más contenido arriba o abajo */
function fadeContent(){
  var arriba = content.scrollTop > 2, abajo = content.scrollHeight - content.clientHeight - content.scrollTop > 2;
  content.classList.toggle('fade-t', arriba);
  content.classList.toggle('fade-b', abajo);
}
(function(){
  var raf=0, tick=function(){ if(raf) return; raf=requestAnimationFrame(function(){ raf=0; fadeContent(); }); };
  content.addEventListener('scroll', tick, {passive:true});
  window.addEventListener('resize', tick);
  if(window.ResizeObserver) new ResizeObserver(tick).observe(content);
  if(window.MutationObserver) new MutationObserver(tick).observe(content, {childList:true, subtree:true}); /* tras pintar Inicio o un hilo */
})();
function show(id){
  /* Fase 10 · Brief 01: si sale de la captura sin guardar, las órdenes de la cita no quedan pendientes */
  if(ordScanKey && ['CAM','GAL','PROC','DET','CONF','FIN','NOTIF'].indexOf(id)<0) ordScanKey=null; /* Fase 10 · Rediseño · Brief 12 (corrección): mirar los avisos no suelta la cita */
  /* Fase 6 · si cancelan un escaneo o una lectura de correo abiertos desde el onboarding, no los deja caer en la app ya poblada */
  /* Fase Móvil · mismo bug que guardarTap(): volvía a obShow(2) (elegir familia) en vez de obShow(3) ("Déjame el trabajo pesado", el paso del que salió el escaneo/correo) */
  /* Fase 10 · Brief 45b: cualquier pantalla principal, no solo A1 (goBackMain() va a lastMain, que tras "Cambiar de historia" podía ser G1/F1),
     y solo si el onboarding no ha terminado; si ya terminó, la bandera se apaga y sigue el camino de la app */
  if((obScanActive || obMailActive) && ['A1','H2','F1','G1'].indexOf(id)>=0){
    obScanActive=false; obMailActive=false;
    if(!obHecho){ ob.classList.remove('hidden'); obShow(4); return; } /* Fase 10 · Rediseño · Brief 13: paso 4 */
  }
  var s=byId[id]; if(!s) return;
  clearTimers();
  marcarVisto(); /* Fase 10 · Brief 06 */
  [].forEach.call(document.querySelectorAll('.typing'), function(t){ t.remove(); });
  screens.forEach(function(x){ x.classList.remove('on'); });
  s.classList.add('on');
  cur=id;
  if(id!=='TH') curThread=null;
  if(id==='A1'){ renderInicio(); }
  if(id==='F1'){ renderCalendario(); }
  if(id==='F2'){ renderCalDetail(); }
  if(id==='G1'){ renderBoveda(); }
  if(id==='I3'){ renderI3(); }
  if(id==='I1'){ famFormInit(); renderFamForm(); } /* Fase 10 · Brief 30: cada entrada empieza de cero */
  if(id!=='FAM'){ var ftw=document.querySelector('#famScreen > .toast'); if(ftw) ftw.remove(); } /* Fase 10 · Brief 30b: el toast de Familia no sobrevive a salir de #FAM */
  if(id==='NOTIF'){ renderNotif(); } /* Fase 10 · Rediseño · Brief 12 */
  if(id==='CONFIG'){ renderConfig(true); } /* Fase 10 · Brief 48c: al entrar, todo cerrado */ /* Fase 10 · Brief 48 */
  scrTitle.classList.toggle('st-30', id==='NOTIF');
  paintNotifDot();
  if(id==='PEG'){ if(!pegKeep) pegReset(); pegKeep=false; renderPeg(); } /* Fase 10 · Rediseño · Brief 12 (corrección): al volver de los avisos conserva lo pegado */ /* Fase 10 · Brief 03: siempre entra desde "Agregar documento", empieza vacía */
  /* Fase 6 · desde FIN, "atrás" vuelve a DET a corregir sin perder lo ya revisado — resetDet() es solo para la entrada normal CAM/GAL→PROC→DET */
  /* Fase 6 · Brief 3: data-back fijo en el HTML solo servía si siempre se entraba por CAM — mismo mecanismo que ya usa G1/bovFrom */
  if(id==='DET'){ s.setAttribute('data-back', procFrom||'CAM'); if(!detNoReset) resetDet(); detNoReset=false; }
  if(id==='CONF'){ renderConf(); }
  if(id==='CAM'){ if(keepShots){ keepShots=false; } else { resetCam(); } }
  /* Fase 6 · PROC es una sola pantalla reusada por cámara/galería/correo — el copy y el destino automático se deciden aquí, no en cada punto de entrada */
  if(id==='PROC'){
    var procP = s.querySelector('.proc p');
    if(obMailActive){
      s.setAttribute('data-title','Revisando tu correo');
      if(procP) procP.textContent='Buscando órdenes, resultados y autorizaciones en tu correo…';
    } else {
      s.setAttribute('data-title','Leyendo las hojas'); /* Fase 10 · Brief 05 */
      if(procP) procP.textContent='Separando las hojas y extrayendo los datos…';
    }
    /* Fase 8 · Brief 6.1: correo desde el FAB también debe caer en CONF, no solo el de onboarding */
    s.setAttribute('data-auto', (obMailActive||fabMailActive) ? 'CONF' : 'DET');
  }
  /* Fase 10 · Brief 01b: solo .content se desplaza (ver down()); al cambiar a otra pantalla que no sea el chat, vuelve arriba */
  if(id!=='TH'){ content.scrollTop=0; }
  fadeContent(); /* Fase 11 · Brief 14b */

  var isHilo = s.getAttribute('data-hdr')==='hilo';
  /* Fase 6 · durante escaneo/subida/correo disparados desde el onboarding, el header superior tampoco tiene sentido: no hay familia armada ni menú/ayuda utilizables a medio onboarding */
  var hideHdrOb = !obHecho && (obScanActive || obMailActive) && [ /* Fase 10 · Brief 45b */'CAM','GAL','PROC','CONF','DET','FIN'].indexOf(id)>=0;
  /* Fase 10 · Brief 05 (punto 5): el encabezado global se queda también en el hilo; #hdrHilo es la segunda fila.
     En el hilo, #famChip se oculta con .en-hilo (no con display, que lo maneja updateChip()) */
  hdrGlobal.style.display = hideHdrOb?'none':'flex';
  hdrGlobal.classList.toggle('en-hilo', isHilo);
  hdrHilo.style.display   = isHilo?'block':'none';
  scrTitle.style.display  = isHilo?'none':'block';
  /* Fase 6 · header oculto en onboarding: la franja turquesa de scrTitle también se apaga, y las 6 pantallas ganan un botón de atrás propio en su lugar — FIN lo tenía escondido, el profe pidió que no (ver attemptExitOb) */
  scrTitle.classList.toggle('sc-ob', hideHdrOb);
  stBack.style.display = hideHdrOb ? 'flex' : 'none';
  var obBackLink = s.querySelector('.back-link');
  if(obBackLink) obBackLink.style.display = hideHdrOb ? 'none' : '';

  var back = s.getAttribute('data-back');
  topBack.style.display = (!isHilo && back) ? 'flex' : 'none';
  topMenu.style.display = (!isHilo && back) ? 'none' : 'flex';
  topBack.setAttribute('data-target', back||'');
  editBar.style.display='none'; editing=null;

  if(!isHilo){
    tTitle.textContent=fx(s.getAttribute('data-title')||'');
    tSub.textContent=fx(s.getAttribute('data-sub')||'');
    if(['A1','H2','F1','G1'].indexOf(id)>=0) lastMain=id;
  }
  /* Fase 10 · Brief 05: Inicio vuelve a tener título; la mascota vive dentro de #A1 (ver mascotAInicio) */
  stRow.style.display = 'flex';

  composer.style.display = s.getAttribute('data-comp')==='0'?'none':'flex';
  composer.classList.toggle('gen', id==='TH' && curThread==='gen'); /* Fase 10 · Brief 06: el "+" solo en la pestaña Taremi */
  chips.style.display = (id==='TH' && curThread==='gen') ? 'flex' : 'none';
  probSync(id); /* Fase 10 · Brief 21 */
  fab.style.display = s.getAttribute('data-fab')==='1'?'flex':'none';
  fab.classList.toggle('fab-boveda', s.getAttribute('data-comp')==='0'); /* Fase 10 · Brief 06: sin compositor (Inicio, Calendario, Bóveda) el FAB baja junto a la barra */
  fab.classList.toggle('fab-chips', chips.style.display==='flex'); /* Fase 10 · Brief 04: que no tape los chips */

  /* Fase 6 · el flujo de traer documentos (onboarding o FAB) no muestra la barra de navegación inferior */
  /* Fase 10 · Rediseño · Brief 12 (corrección): si los avisos se abrieron a mitad de la captura, tampoco hay barra (no se sale sin el aviso de salir sin guardar) */
  /* Fase 10 · Brief 30c: «Agregar familiar» (I1) tampoco muestra la barra inferior; Familia e I3 la conservan */
  nav.style.display = (['CAM','GAL','PROC','DET','CONF','FIN','I1'].indexOf(id)>=0 || (id==='NOTIF' && notifFrom && ['CAM','GAL','PROC','DET','CONF','FIN'].indexOf(notifFrom.id)>=0)) ? 'none' : 'flex';

  var navKey=s.getAttribute('data-nav')||'none';
  [].forEach.call(nav.querySelectorAll('.nav-item'), function(n){
    n.classList.toggle('active', n.getAttribute('data-nav')===navKey);
  });

  var auto=s.getAttribute('data-auto');
  if(auto) T(function(){ if(cur===id) show(auto); }, parseInt(s.getAttribute('data-automs')||'1600',10));

  updateChip();
  paintAvatars(byId[id]||document);
  markFlow(id);
}
function markFlow(id){
  [].forEach.call(document.querySelectorAll('#flowsel .fbtn'), function(b){
    var f=b.getAttribute('data-flow');
    b.classList.toggle('cur', f===id || (cur==='TH' && f===curThread));
  });
}
/* Fase 10 · Rediseño · Brief 11: FAB desplegado (lienzo 60). Las opciones suben encima de quien lo abrió: el FAB (a la derecha)
   o el "+" del compositor (a la izquierda, en espejo). Las posiciones salen del botón en tiempo real (inline, porque el FAB cambia
   de altura con la pantalla). El "+" del compositor queda debajo del velo (el dock tiene su propia capa), así que encima va #fdX */
var fdMenu=document.getElementById('fabMenu'), fdList=document.getElementById('fdList'), fdX=document.getElementById('fdX'), fdTrig=null;
function fdToggle(trig){ if(fdTrig) fdClose(); else fdOpen(trig); }
function fdOpen(trig){
  fdTrig=trig;
  var ar=document.getElementById('app').getBoundingClientRect(), r=trig.getBoundingClientRect();
  var esFab = trig===fab, CIRC=48, M=MARCO; /* Fase 10 · Brief 44: medidas de pantalla ÷ MARCO = medidas dentro del marco */
  fdList.classList.toggle('izq', !esFab);
  fdList.style.bottom=((ar.bottom-r.top)/M+14)+'px';
  if(esFab){ fdList.style.right=((ar.right-r.right+(r.width-CIRC*M)/2)/M)+'px'; fdList.style.left=''; }
  else { fdList.style.left=((r.left-ar.left+(r.width-CIRC*M)/2)/M)+'px'; fdList.style.right=''; }
  fdX.hidden=esFab;
  if(!esFab){ fdX.style.left=((r.left-ar.left)/M)+'px'; fdX.style.top=((r.top-ar.top)/M)+'px'; fdX.style.width=(r.width/M)+'px'; fdX.style.height=(r.height/M)+'px'; }
  /* Fase 10 · Rediseño · Brief 13 (corrección 5): con el correo ya conectado no se ofrece conectarlo otra vez (el reinicio apaga mailConnected) */
  var fdMail=fdList.querySelector('[data-tap="fabmail"]'); if(fdMail) fdMail.hidden=mailConnected;
  /* Fase 10 · Brief 15: en la propia historia, Escanear, Subir y Pegar van atenuados (sirve al FAB y al "+").
     Brief 18: con "En otras historias" y sin disabled: al tocarlos se abre #scrimOtra (ver el ruteo de data-go) */
  [].forEach.call(fdList.querySelectorAll('[data-go="CAM"],[data-go="GAL"],[data-go="PEG"]'), function(it){
    var soon=esPropia(), lb=it.querySelector('.fd-lbl'), tg=lb.querySelector('.tag-soon');
    it.disabled=false; it.classList.toggle('soon', soon);
    if(soon && !tg) lb.insertAdjacentHTML('beforeend','<span class="tag-soon">En otras historias</span>');
    if(!soon && tg) tg.remove();
  });
  fdMenu.hidden=false;
  fab.classList.add('fd-open');
  trig.setAttribute('aria-expanded','true'); trig.setAttribute('aria-label','Cerrar');
  var first=fdList.querySelector('[role="menuitem"]:not([hidden]):not([disabled])'); if(first) first.focus();
}
function fdClose(sinFoco){
  if(!fdTrig) return;
  var t=fdTrig; fdTrig=null;
  fdMenu.hidden=true; fdX.hidden=true;
  fab.classList.remove('fd-open');
  t.setAttribute('aria-expanded','false'); t.setAttribute('aria-label','Agregar documento');
  if(!sinFoco && document.body.contains(t) && t.offsetParent) t.focus();
}
fdMenu.addEventListener('click', function(e){ if(e.target.closest('[data-fdclose], #fdX')){ e.stopPropagation(); fdClose(); } });
document.addEventListener('keydown', function(e){
  if(!fdTrig) return;
  if(e.key==='Escape'){ e.preventDefault(); fdClose(); return; }
  /* menú: flechas entre opciones y Tab no se sale del menú (la primera opción es la más cercana al botón, abajo) */
  var its=[].slice.call(fdList.querySelectorAll('[role="menuitem"]:not([hidden]):not([disabled])')), i=its.indexOf(document.activeElement); /* Fase 10 · Rediseño · Brief 13 (corrección 5): sin la opción oculta */
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){ e.preventDefault(); var n=i<0?0:(i+(e.key==='ArrowUp'?1:-1)+its.length)%its.length; its[n].focus(); }
  else if(e.key==='Tab'){ e.preventDefault(); var m=i<0?0:(i+(e.shiftKey?-1:1)+its.length)%its.length; its[m].focus(); }
});
function closeSheets(){ fdClose(true); /* Fase 10 · Rediseño · Brief 11: el FAB desplegado reemplaza la hoja de Agregar */ ['scrimMM','scrimWho','scrimDocs','scrimDoc','scrimExit','scrimIcon','scrimOtra' /* Fase 10 · Brief 18 */, 'scrimFamDocs' /* Fase 10 · Brief 30 */, 'scrimMailOff' /* Fase 10 · Brief 48 */, 'scrimPolitica' /* Fase 11 · Brief 04 */, 'scrimCancelar' /* Fase 11 · Brief 04b */, 'scrimDatosDl', 'scrimDatosBorrar', 'scrimQueEs' /* Fase 11 · Brief 06 */].forEach(function(k){ var e=document.getElementById(k); if(e) e.style.display='none'; });
  camAltCerrar(); /* Fase 11 · Brief 05 (corrección): la hoja de la cámara que no alcanza a leer */
  sideClose(true); popClose(true); /* Fase 10 · Rediseño · Brief 12: barra lateral y menús pegados al botón ya no son hojas */ }

/* ============================================================
   Fase 10 · Rediseño · Brief 12 · CAPAS
   Barra lateral (☰) y menús pegados al botón ("Ver" y tipo de documento). Ninguno es .sheet-scrim:
   el foco, Tab y Escape se manejan aquí, no en initA11yDialogs.
   ============================================================ */
var sideTrigger=null, popCur=null, popBtn=null;
function renderSideHead(){
  var av=document.getElementById('sideAv');
  av.setAttribute('data-p','SO'); av.style.background=PCOL.SO; av.textContent=INIT.SO;
  document.getElementById('sideNm').textContent=fx('{u} {ape}');
  document.getElementById('sideMail').textContent=cuentaMail || fx('{mail}'); /* Fase 10 · Rediseño · Brief 13: el correo con que se creó la cuenta */
  paintAvatars(document.getElementById('sideNav'));
}
function sideOpen(trigger){
  if(tourStep>=0) return; /* Fase 10 · Rediseño · Brief 12 (corrección): mientras dura el recorrido, el recorrido manda */
  popClose(true);
  renderSideHead(); paintNotifDot();
  sideTrigger=trigger||document.getElementById('topMenu');
  document.getElementById('sideMenu').hidden=false;
  document.querySelector('#sideNav .side-x').focus();
}
function sideClose(sinFoco){
  var m=document.getElementById('sideMenu'); if(!m || m.hidden) return;
  m.hidden=true;
  var t=sideTrigger; sideTrigger=null;
  if(!sinFoco && t && document.body.contains(t) && t.offsetParent) t.focus();
}
/* Una sola función para los dos menús: abre, posiciona debajo del botón (alineado a su borde derecho) y cierra */
function popOpen(btn, menu){
  if(tourStep>=0) return; /* Fase 10 · Rediseño · Brief 12 (corrección) */
  popClose(true);
  var box=menu.offsetParent || menu.parentElement;
  menu.hidden=false;
  var br=btn.getBoundingClientRect(), cr=box.getBoundingClientRect(), M=MARCO; /* Fase 10 · Brief 44: ÷ MARCO */
  var right=Math.max(16, (cr.right-br.right)/M);
  if(cr.width/M-right-menu.offsetWidth<16) right=Math.max(16, cr.width/M-16-menu.offsetWidth);
  menu.style.top=((br.bottom-cr.top)/M+6)+'px';
  menu.style.right=right+'px';
  popCur=menu; popBtn=btn;
  btn.setAttribute('aria-expanded','true');
  var f=menu.querySelector('.pop-i.sel')||menu.querySelector('.pop-i'); if(f) f.focus();
}
function popClose(sinFoco){
  if(!popCur) return;
  popCur.hidden=true;
  var b=popBtn; popCur=null; popBtn=null;
  if(b){ b.setAttribute('aria-expanded','false'); if(!sinFoco && document.body.contains(b) && b.offsetParent) b.focus(); }
}
function popToggle(btn, menu, render){
  if(popCur===menu){ popClose(); return; }
  closeSheets(); render(); popOpen(btn, menu);
}
/* Tocar fuera cierra el menú y no hace nada más; tocar su propio botón lo alterna (lo resuelve el delegado) */
document.addEventListener('click', function(e){
  if(!popCur) return;
  if(popCur.contains(e.target) || (popBtn && popBtn.contains(e.target))) return;
  e.stopPropagation(); e.preventDefault(); popClose(true);
}, true);
document.addEventListener('keydown', function(e){
  if(popCur){
    var its=[].slice.call(popCur.querySelectorAll('.pop-i')), i=its.indexOf(document.activeElement);
    if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); popClose(); return; }
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); var n=i<0?0:(i+(e.key==='ArrowDown'?1:-1)+its.length)%its.length; its[n].focus(); return; }
    if(e.key==='Tab'){ e.preventDefault(); var m=i<0?0:(i+(e.shiftKey?-1:1)+its.length)%its.length; its[m].focus(); return; }
    return;
  }
  var sm=document.getElementById('sideMenu');
  if(sm && !sm.hidden){
    if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); sideClose(); return; }
    if(e.key==='Tab'){
      var f=[].slice.call(sm.querySelectorAll('button')).filter(function(el){ return el.offsetParent!==null; });
      var first=f[0], last=f[f.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    }
  }
}, true);
/* Si la pantalla se desplaza, el menú ya no está pegado a su botón: se cierra */
document.addEventListener('scroll', function(e){ if(popCur && !popCur.contains(e.target)) popClose(true); }, true);
/* Pantalla de avisos: "volver" regresa a la pantalla (o al hilo) desde donde se abrió */
var notifFrom=null, pegKeep=false;
function openNotif(){
  if(cur==='NOTIF') return;
  notifFrom={id:cur, th:(cur==='TH'?curThread:null), nav:TH.getAttribute('data-nav')};
  closeSheets(); show('NOTIF');
}
function notifBack(){
  var f=notifFrom; notifFrom=null;
  if(f && f.th){ openThread(f.th, f.nav); return; }
  if(f && f.id && f.id!=='NOTIF' && byId[f.id]){
    /* Fase 10 · Rediseño · Brief 12 (corrección): volver a la captura no la reinicia — conserva las fotos (CAM),
       lo revisado (DET) y el texto pegado (PEG), con las mismas banderas que ya usan "más fotos" y FIN→DET */
    if(f.id==='CAM') keepShots=true;
    if(f.id==='DET') detNoReset=true;
    if(f.id==='PEG') pegKeep=true;
    show(f.id); return;
  }
  goBackMain();
}
/* Fase 8 · Yifrah #10: salir por la flecha o por "Cancelar" (vía attemptExitOb) no pasa por el delegado de BACKMAIN,
   así que la bandera del correo desde el FAB se limpia aquí para no quedar pegada */
function goBackMain(){ fabMailActive=false; closeSheets(); show(lastMain); }

/* Fase 6 · advertencia de salir sin guardar, solo durante escaneo/correo del onboarding (hideHdrOb) — ver brief "Header oculto en onboarding".
   Generalizado para "Eliminar perfil" (I3): dangerLabel/action son opcionales — sin ellos se comporta
   igual que antes (botón "Salir sin guardar" que vuelve a lastMain), así que no rompe los 4 usos existentes. */
var exitAction=null;
/* Fase 10 · Brief 18: la usa "Ver otra historia" (#scrimOtra), solo en "Tu propia historia". Fase 11 · Brief 01: sale "Cambiar de historia"
   y el paso 1; obShow(1) cae en la cuenta. Si se enciende DEMO_PROPIA, necesita otra entrada */
function verHistorias(){ closeSheets(); resetDemo(); obShow(1); }
/* Fase 10 · Brief 18: hoja "Esto lo pruebas en otra historia" (Escanear, Subir y Pegar en la propia historia) */
function otraOpen(){ document.getElementById('scrimOtra').style.display='flex'; }
function showExitDialog(title, body, neutralLabel, dangerLabel, action){
  exitTitle.textContent = title;
  exitBody.textContent = body;
  exitNeutralBtn.textContent = neutralLabel;
  exitDangerBtn.textContent = dangerLabel || 'Salir sin guardar';
  exitAction = action || null;
  scrimExit.style.display='flex';
}
function attemptExitOb(){
  /* Fase 6 · desde FIN ya está todo guardado — no hay nada que perder, así que "atrás" va directo a
     corregir el documento en DET (la pantalla inmediatamente anterior), sin diálogo de advertencia */
  if(cur==='FIN'){ detNoReset=true; show('DET'); return; }
  if(cur==='GAL'){ goBackMain(); return; }
  if(cur==='PROC' && obMailActive){ goBackMain(); return; }
  if((cur==='CAM' || cur==='PROC') && !obMailActive){
    if(shots<1){ goBackMain(); return; }
    var body = shots===1
      ? 'Vas a perder la foto que tomaste. Esto no se puede deshacer.'
      : 'Vas a perder las '+shots+' fotos que tomaste. Esto no se puede deshacer.';
    showExitDialog('¿Salir sin guardar?', body, 'Seguir escaneando');
    return;
  }
  if(cur==='DET'){ showExitDialog('¿Salir sin guardar?', 'Vas a perder los documentos que revisaste. Esto no se puede deshacer.', 'Seguir revisando'); return; }
  if(cur==='CONF'){ showExitDialog('¿Salir sin guardar?', 'Vas a perder lo que encontré en tu correo. Esto no se puede deshacer.', 'Seguir revisando'); return; }
  goBackMain();
}
stBack.addEventListener('click', attemptExitOb);
exitNeutralBtn.addEventListener('click', function(){ scrimExit.style.display='none'; });
exitDangerBtn.addEventListener('click', function(){ scrimExit.style.display='none'; (exitAction||goBackMain)(); exitAction=null; });
/* Fase 10 · Rediseño · Brief 12: el ícono solo se elige en "Familia y perfiles"; "Listo" cierra el selector */
document.getElementById('iconDone').addEventListener('click', function(){
  document.getElementById('scrimIcon').style.display='none';
});

document.addEventListener('click', function(e){
  /* Fase 6 · tocar el fondo oscuro de cualquier hoja (no la tarjeta blanca adentro) la cierra — antes
     "¿A quién quieres ver?" (hoy menú pegado al botón, Brief 12) no tenía ninguna forma de salir sin elegir a alguien primero */
  if(e.target.classList && e.target.classList.contains('sheet-scrim')){
    if(e.target.id==='scrimIcon'){ document.getElementById('iconDone').click(); }
    else { closeSheets(); }
    return;
  }
  if(e.target.closest('[data-close]')){ cancelPend=null; closeSheets(); return; }
  if(e.target.closest('[data-cancelok]')){ var ok=cancelPend; cancelPend=null; closeSheets(); if(ok) ok(); return; } /* Fase 11 · Brief 04b (B) */

  /* Fase Móvil · Punto 1b: "Reiniciar el prototipo" en Configuración, reemplaza el reset del panel externo */
  if(e.target.closest('#cfgReset')){ resetDemo(); return; }
  /* Fase 10 · Brief 48: el correo en Configuración */
  var cAlt=e.target.closest('[data-camalt]'); if(cAlt){ camAltIr(cAlt.getAttribute('data-camalt')); return; } /* Fase 11 · Brief 05 (B) */
  if(e.target.closest('[data-cfgrevisar]')){ mailRevisado=Date.now(); cfgToast='Revisé tu correo. No hay nada nuevo.'; renderConfig(); return; }
  var swA=e.target.closest('[data-aviso]'); /* Fase 11 · Brief 06e */
  if(swA){ var kA=swA.getAttribute('data-aviso'); AVISOS_ON[kA]=!AVISOS_ON[kA]; renderConfig(); renderNotif(); var nb=document.querySelector('[data-aviso="'+kA+'"]'); if(nb) nb.focus(); return; }
  if(e.target.closest('#hiloInfo')){ openQueEs(); return; } /* Fase 11 · Brief 06 (B) */
  if(e.target.closest('[data-datosdl]')){ document.getElementById('scrimDatosDl').style.display='flex'; return; } /* Fase 11 · Brief 06 (A) */
  if(e.target.closest('[data-datosbor]')){ document.getElementById('scrimDatosBorrar').style.display='flex'; return; }
  if(e.target.closest('[data-datosdlok]')){ closeSheets(); cfgToast='En la app real se descarga tu carpeta.'; renderConfig(); return; } /* no descarga nada */
  if(e.target.closest('[data-datosborok]')){ closeSheets(); resetDemo(); return; } /* lo mismo que «Reiniciar el prototipo» */
  if(e.target.closest('[data-cfgoff]')){ document.getElementById('scrimMailOff').style.display='flex'; return; }
  if(e.target.closest('[data-mailoff]')){ closeSheets(); mailConnected=false; mailRevisado=null; cfgToast='Desconecté tu correo.'; renderConfig(); renderBoveda(); return; }
  /* Fase 10 · Brief 18: "Ver otra historia" (#scrimOtra) */
  if(e.target.closest('[data-otrahist]')){ verHistorias(); return; }
  var temaBtn=e.target.closest('#cfgBody [data-tema]'); /* Fase 10 · Brief 49 */
  if(temaBtn){ aplicarTema(temaBtn.getAttribute('data-tema')); renderConfig(); return; }

  /* Fase 10 · Brief 08e: "Ver el recorrido otra vez" desde Ayuda, empieza en el paso 1 sobre Inicio */
  if(e.target.closest('[data-tourreplay]')){ show('A1'); tourOpen(0); return; }

  var ip=e.target.closest('[data-iconpick]');
  if(ip){ openIconSheet(ip.getAttribute('data-iconpick')); return; }
  var io=e.target.closest('[data-iconopt]');
  if(io){
    /* Fase 10 · Rediseño · Brief 13b (corrección 2): la opción vacía son las iniciales */
    if(iconPickKey){ var ico=io.getAttribute('data-iconopt'); if(ico) PICON[iconPickKey]=ico; else delete PICON[iconPickKey]; paintAvatars(document); }
    [].forEach.call(document.querySelectorAll('#iconGrid .ic-opt'), function(b){ b.classList.toggle('sel', b===io); });
    return;
  }

  var undo=e.target.closest('[data-undo]');
  if(undo){
    /* H06 unificado: ya no hay Deshacer instantáneo. Toda acción salió de la app, así que "Deshacer"
       siempre abre la conversación del trámite — con un mensaje genérico desde el toast de Inicio,
       y con el flujo específico de radicar cuando el toast vive dentro del hilo mismo. */
    /* Fase 11 · Brief 10b: un solo camino para el aviso de Inicio y el del hilo; el texto va en burbuja normal y los botones aparte */
    var enHilo=undo.getAttribute('data-undo')==='hilo';
    var k=enHilo ? (curThread||'cir') : (pendingToastKey||curThread||'cir');
    pendingToast=null; if(!enHilo) pendingToastKey=null;
    var tipo=undoTipo(k);
    if(!enHilo) openThread(k, 'inicio');
    commit(k,{who:'s', text: tipo==='radicada' && enHilo ? 'Espera, necesito cambiar algo de lo que radicaste' : 'Espera, necesito cambiar algo de esto'});
    var btns = tipo==='radicada'
      ? '<button type="button" class="btn-s" data-act="undo.retirar">Pedir que la retiren</button><button type="button" class="btn-s" data-act="undo.corregir">Corregir un documento</button>'
      : probOpts(k).filter(function(o){ return o!=='otra'; }).map(function(o){ return '<button type="button" class="btn-s" data-act="undo.prob" data-o="'+o+'">'+PROB_L[o]+'</button>'; }).join('');
    play(k, btns ? [{who:'t', text: tipo==='radicada' ? 'Claro. ¿Qué quieres hacer?' : 'Claro. ¿Qué cambió?'}, {who:'t', wgt:btns}]
      : [{who:'t', text:'Esto ya salió de la app y no puedo deshacerlo.'}]); /* respaldo: no debería verse */
    return;
  }

  var edb=e.target.closest('[data-editid]');
  if(edb){ startEdit(edb.getAttribute('data-editid')); return; }

  var day=e.target.closest('[data-day]');
  if(day){
    var wd=day.closest('.wgt');
    [].forEach.call(wd.querySelectorAll('.cal-d'), function(x){ x.classList.remove('sel'); });
    day.classList.add('sel');
    var db=wd.querySelector('[data-act="ped.dia"]'); if(db) db.removeAttribute('disabled');
    return;
  }

  var pt=e.target.closest('[data-ptag]');
  if(pt){ ptagPend=parseInt(pt.getAttribute('data-ptag'),10); document.getElementById('scrimWho').style.display='flex'; return; }

  var sw=e.target.closest('[data-setwho]');
  if(sw){ var parts=sw.getAttribute('data-setwho').split('|'); if(ptagPend!==null) setPtag(ptagPend, parts[0]); ptagPend=null; closeSheets(); return; }

  var chip=e.target.closest('[data-chip]');
  if(chip){ textReply(chip.getAttribute('data-chip')); return; }

  var slot=e.target.closest('[data-slot]');
  if(slot){
    var w=slot.closest('.wgt');
    [].forEach.call(w.querySelectorAll('.slot'), function(x){ x.classList.remove('sel'); });
    slot.classList.add('sel');
    var cf=w.querySelector('[data-act="ped.confirmar"]');
    if(cf) cf.removeAttribute('disabled');
    /* H05: el borrador se guarda al TOCAR, no al confirmar */
    if(cur==='TH' && curThread){
      DRAFTS[curThread]={slot:slot.getAttribute('data-slot'), doc:slot.getAttribute('data-doc'), sede:slot.getAttribute('data-sede')};
      renderInicio();
    }
    return;
  }

  var act=e.target.closest('[data-act]');
  if(act){ if(act.hasAttribute('disabled')) return;
    if(act.classList.contains('chip-sim')) simUsar(act); /* Fase 10 · Brief 02b */
    var f=ACT[act.getAttribute('data-act')]; if(f) f(act); return; }

  var th=e.target.closest('[data-thread]');
  if(th){ if(th.hasAttribute('disabled')) return;
    closeSheets();
    var from = th.getAttribute('data-from')==='cal' ? 'cal' : (lastMain==='G1'?'bov':(lastMain==='F1'?'cal':'inicio'));
    openThread(th.getAttribute('data-thread'), from);
    return; }

  var fam=e.target.closest('[data-fam]');
  /* Fase 8 · Esqueleto 2: elegir persona ya no salta a la Bóveda, se queda filtrando la pantalla donde estabas */
  if(fam){ bovPerson=fam.getAttribute('data-fam'); popClose(); closeSheets();
    if(cur==='A1') renderInicio();
    else if(cur==='F1') renderCalendario();
    else if(cur==='G1') renderBoveda();
    updateChip();
    return; }
  if(e.target.closest('#bovTypeChip')){ popToggle(e.target.closest('#bovTypeChip'), document.getElementById('bovTypeMenu'), renderBovTypeMenu); return; } /* Fase 10 · Rediseño · Brief 12 */
  var bt=e.target.closest('[data-bovtype]');
  if(bt){ bovType=bt.getAttribute('data-bovtype'); popClose(true); closeSheets(); renderBoveda(); var tc=document.getElementById('bovTypeChip'); if(tc) tc.focus(); return; }
  /* Fase 6 · portada de la Bóveda: tocar una carpeta ya estando en G1 (sin navegar a otra pantalla) — los
     botones que sí navegan (F2/menú/etc.) combinan data-bovcat con data-go y se resuelven más abajo. */
  var bc=e.target.closest('[data-bovcat]');
  if(bc && !bc.hasAttribute('data-go')){ bovFolder=bc.getAttribute('data-bovcat'); renderBoveda(); return; }
  var tp=e.target.closest('[data-tap]');
  if(tp){
    if(tp.hasAttribute('disabled')) return;
    var w=tp.getAttribute('data-tap');
    if(w==='shutter') shutterTap();
    else if(w==='camnolee') camNoLee(); /* Fase 11 · Brief 05 (B) */
    else if(w==='camdone') camDoneTap();
    else if(w==='guardar') guardarTap();
    else if(w==='masfotos') masFotosTap();
    else if(w==='thumb') thumbTap(); /* Fase 10 · Brief 08 */
    else if(w==='retake') retakeTap();
    else if(w==='fin') finTap();
    else if(w==='fincal') finCalTap(); /* Fase 10 · Brief 08d */
    else if(w==='fincomp') finCompTap(tp); /* Fase 10 · Brief 08f */
    else if(w==='hoja2') hoja2Tap();
    /* Fase 8 · Yifrah #10: "Cancelar" de CAM/CONF pasa por el mismo aviso que la flecha de atrás */
    else if(w==='cancelob') attemptExitOb();
    else if(w==='closeconftip'){ document.getElementById('confTip').style.display='none'; }
    /* Fase 8 · Brief 6.1: correo desde el FAB, fuera del onboarding */
    else if(w==='fabmail'){ closeSheets(); fabMailActive=true; show('PROC'); } /* Fase 10 · Brief 45: mailConnected se enciende al guardar, no al buscar */
    else if(w==='docpend') docPendAbrir(); /* Fase 10 · Brief 40 */
    return;
  }

  /* H02: expandir/colapsar cada documento de la revisión */
  var rv=e.target.closest('[data-rev]');
  if(rv){
    var b=document.querySelector('[data-revb="'+rv.getAttribute('data-rev')+'"]');
    if(b) b.style.display = (b.style.display==='none') ? '' : 'none'; /* Fase 10 · Brief 29: al abrir manda el display de la hoja de estilos (el flex con gap de .epi-b) */
    if(b && rv.hasAttribute('aria-expanded')) rv.setAttribute('aria-expanded', b.style.display!=='none' ? 'true' : 'false'); /* Fase 10 · Brief 05: gira la flecha */
    return;
  }

  /* H01: visor de documento */
  var dvw=e.target.closest('[data-docview]');
  if(dvw){ openViewer(dvw.getAttribute('data-docview')); return; }
  var vfx=e.target.closest('[data-vfix]'); /* Fase 10 · Brief 08f */
  if(vfx){ vFixSave(vfx.getAttribute('data-vfix')); return; }
  if(e.target.closest('[data-vclose]')){ document.getElementById('viewer').style.display='none'; return; }
  if(e.target.closest('[data-vshare]')){
    document.getElementById('natName').textContent = (document.getElementById('vTitle').textContent||'documento')+'.pdf';
    document.getElementById('natShare').style.display='flex'; return;
  }
  if(e.target.closest('[data-natclose]')){ document.getElementById('natShare').style.display='none'; return; }
  if(e.target.closest('[data-sideclose]')){ sideClose(); return; } /* Fase 10 · Rediseño · Brief 12 */

  /* Fase 11 · Brief 04 (B): sale data-helpgo (atajo a las órdenes desde el menú y desde Ayuda) */

  var dv=e.target.closest('[data-docv]');
  if(dv){ openDocSheet(parseInt(dv.getAttribute('data-docv'),10)); return; }

  var rt=e.target.closest('[data-retry]');
  if(rt){ loadFail=false; renderBoveda(); return; }

  if(e.target.closest('[data-clearf]')){ bovPerson='all'; bovType='all'; bovQuery=''; renderBoveda(); return; }
  if(e.target.closest('[data-bovclear]')){ bovQuery=''; renderBoveda(); return; }
  /* Fase 10 · Brief 06: "Nueva pregunta" vuelve a la bienvenida; la tarjeta de la mascota abre la pestaña Taremi */
  var cd=e.target.closest('[data-calday]'); /* Fase 10 · Brief 06 */
  if(cd){ var v=cd.getAttribute('data-calday'); calDaySel = (v==='all' || parseInt(v,10)===calDaySel) ? null : parseInt(v,10); renderCalendario(); return; }
  if(e.target.closest('[data-cursofold]')){ cursoOpen=!cursoOpen; renderInicio(); return; }
  if(e.target.closest('#mascotHd') && cur==='A1' && !e.target.closest('button')){ openThread('gen'); return; }
  if(e.target.closest('#famChip')){ popToggle(document.getElementById('famChip'), document.getElementById('famMenu'), renderFamMenu); return; } /* Fase 10 · Rediseño · Brief 12 */

  var g2=e.target.closest('[data-go2]');
  /* Fase 6 · antes: tocar a cualquiera de las 4 personas en Familia abría siempre el perfil de Mateo —
     data-go2 nunca guardaba a quién se había tocado. Ahora i3Key lo guarda antes de mostrar I3. */
  if(g2){ i3Key=g2.getAttribute('data-go2'); i3Editing=false; i3Edit=null; i3EditOrig=null; closeSheets(); show('I3'); return; }

  /* Fase 6 · editar/eliminar perfil (I3) */
  if(e.target.closest('#i3RelSheet .relpick')) return; /* Fase 10 · Brief 43: el campo del autocompletar */
  if(e.target.id==='i3RelSheet'){ document.getElementById('i3RelSheet').style.display='none'; renderI3(); return; }
  if(e.target.closest('[data-i3edit]')){ i3EnterEdit(i3Key); return; }
  if(e.target.closest('[data-i3cancel]')){ i3Editing=false; i3Edit=null; i3EditOrig=null; renderI3(); return; }
  var ita=e.target.closest('[data-i3toggleaprox]');
  if(ita){ i3Edit.approx=!i3Edit.approx; i3Edit.nacErr=''; renderI3(); return; }
  if(e.target.closest('[data-i3relopen]')){ openI3RelSheet(); return; }
  var ir=e.target.closest('[data-i3rel]');
  if(ir){
    var irv=ir.getAttribute('data-i3rel');
    i3Edit.rel=irv; i3Edit.otro=''; /* Fase 10 · Brief 43: sale "Otro"; la relación guarda el texto final */
    document.getElementById('i3RelSheet').style.display='none'; renderI3();
    var t1=document.querySelector('[data-i3relopen]'); if(t1) t1.focus();
    return;
  }
  var isv=e.target.closest('[data-i3save]');
  if(isv){
    if(isv.hasAttribute('disabled')) return;
    PROFILE_EDITS[i3Key]={nm:i3Edit.nm.trim(), nac:i3Edit.nac, approx:i3Edit.approx, edadAprox:i3Edit.edadAprox, rel:i3Edit.rel, otro:i3Edit.otro};
    /* Fase 8 · Estructura 1: propaga el cambio a V/PNAME/INIT — antes solo cambiaba lo que I3 mismo leía */
    propagateI3Edit(i3Key);
    i3Editing=false; i3Edit=null; i3EditOrig=null;
    renderI3();
    return;
  }

  var bv=e.target.closest('[data-bov]');
  if(bv){ bovPerson=bv.getAttribute('data-bov'); bovType='all'; bovQuery=''; bovFolder=null; bovFrom=cur; closeSheets(); show('G1'); return; }

  var go=e.target.closest('[data-go]');
  if(go){
    if(go.classList.contains('soon') && go.classList.contains('fd-it')){ fdClose(true); otraOpen(); return; } /* Fase 10 · Brief 18: "En otras historias" */
    if(go.hasAttribute('disabled')) return;
    var t=go.getAttribute('data-go');
    var tk=go.getAttribute('data-thread-key');
    if(tk) calSelKey=tk;
    if(t==='CAP'){ fdToggle(go); return; } /* Fase 10 · Rediseño · Brief 11: FAB desplegado (también desde el "+" del compositor) */
    if(t==='MENU'){ sideOpen(go); return; } /* Fase 10 · Rediseño · Brief 12: barra lateral */
    if(t==='MM'){ closeSheets(); document.getElementById('scrimMM').style.display='flex'; return; }
    if(t==='NOTIF'){ openNotif(); return; } /* Fase 10 · Rediseño · Brief 12: pantalla propia */
    if(t==='DOCS'){ openDocsSheet(); return; }
    /* Fase 8 · Brief 6.1: cancelar a mitad de camino no debe dejar la bandera pegada para un escaneo posterior */
    if(t==='BACKMAIN'){ fabMailActive=false; goBackMain(); return; }
    /* Fase 6 · Brief 3: galería sí tiene una pantalla propia a la que volver; las opciones directas del FAB desplegado ("Pegar texto de WhatsApp", "Conectar tu correo") no, así que su atrás sale del flujo */
    if(t==='PROC'){ procFrom = go.classList.contains('gal-i') ? 'GAL' : 'BACKMAIN'; }
    closeSheets();
    if(t==='G1'){
      /* Fase 6 · portada de la Bóveda: algunos destinos (calendario, "ver en la Bóveda") piden una
         carpeta puntual en vez de la portada — mismo mecanismo que el bloque de arriba, pero con navegación */
      var bcat=go.getAttribute('data-bovcat');
      if(bcat){ bovPerson='all'; bovType='all'; bovQuery=''; bovFrom=null; bovFolder=bcat; }
      /* Fase 8 · Esqueleto 2: entrar a la Bóveda por navegación normal (ej. la pestaña) ya no borra el filtro
         de persona activo en las otras 3 pantallas — sí se sigue reiniciando tipo/carpeta/búsqueda como antes */
      else if(!bovKeep){ var keepPerson=bovPerson; bovReset(); bovPerson=keepPerson; }
    }
    bovKeep=false;
    show(t);
  }
});

/* Fase 6 · edición de I3: mismo criterio que el onboarding (ob.addEventListener 'input'/'focusout') —
   actualiza el estado y, para no perder foco/cursor en cada tecla, solo togglea el botón "Guardar"
   a mano en vez de volver a pintar toda la pantalla; el re-render completo queda para blur/toggle. */
document.getElementById('I3').addEventListener('input', function(e){
  if(!i3Editing || !i3Edit) return;
  var id=e.target.id;
  if(id==='i3fNm'){ i3Edit.nm=e.target.value; }
  else if(id==='i3fNac'){
    var val=fechaFormat(e.target.value);
    e.target.value=val; i3Edit.nac=val; i3Edit.nacErr='';
    e.target.classList.remove('err');
    var box=e.target.closest('.field'), em=box&&box.querySelector('.err-msg');
    if(em) em.style.display='none';
  } else if(id==='i3fEdad'){
    var val2=e.target.value.replace(/\D/g,'').slice(0,3);
    e.target.value=val2; i3Edit.edadAprox=val2; i3Edit.nacErr='';
    e.target.classList.remove('err');
    var box2=e.target.closest('.field'), em2=box2&&box2.querySelector('.err-msg');
    if(em2) em2.style.display='none';
  } else return;
  /* Fase 8 · Reauditoría Yifrah: esta copia de "ready" (separada de i3EditHTML() a propósito, para
     no perder el cursor en cada tecla) también necesita el chequeo de dirty — si no, escribir y
     luego borrar hasta dejar el campo igual al original mantenía el botón habilitado hasta el
     próximo re-render completo (blur de fecha/edad, togglear aproximada, etc.) */
  var dirty = JSON.stringify(i3Edit) !== JSON.stringify(i3EditOrig);
  var ready = dirty && i3Edit.nm.trim() && (i3Edit.approx ? edadAproxValida(i3Edit.edadAprox).ok : fechaValida(i3Edit.nac).ok) && (i3Key==='SO' || !i3Edit.rel || i3Edit.rel!=='Otro' || i3Edit.otro.trim()); /* Fase 11 · Brief 04b (A) */
  var sb=document.querySelector('#I3 [data-i3save]');
  if(sb) sb.toggleAttribute('disabled', !ready);
});
document.getElementById('I3').addEventListener('focusout', function(e){
  if(!i3Editing || !i3Edit) return;
  var id=e.target.id;
  if(id==='i3fNac'){
    var v=(i3Edit.nac||'').trim();
    if(!v){ i3Edit.nacErr=''; }
    else{ var r=fechaValida(v); i3Edit.nacErr = r.ok ? '' : (r.reason==='incompleta' ? 'Escribe la fecha completa (día, mes y año).' : 'Revisa la fecha — no parece correcta.'); }
    renderI3();
  } else if(id==='i3fEdad'){
    var r2=edadAproxValida(i3Edit.edadAprox);
    i3Edit.nacErr = r2.ok ? '' : (r2.reason==='incompleta' ? 'Escribe una edad aproximada.' : 'Revisa la edad — no parece correcta.');
    renderI3();
  }
});
/* Fase 10 · Brief 43: sale el campo #i3fOtro (lo escrito se elige con «Usar «…»») */

document.getElementById('hiloBack').addEventListener('click', function(){ show(lastMain); });
topBack.addEventListener('click', function(){
  var t=this.getAttribute('data-target');
  /* Fase 8 · reapertura Yifrah #10: la flecha del encabezado es la otra
     salida de CAM/CONF con algo que perder — debe avisar igual que
     "Cancelar", que ya usa attemptExitOb() */
  if((cur==='CAM' || cur==='CONF') && !obScanActive && !obMailActive){
    attemptExitOb();
    return;
  }
  /* Fase 10 · Brief 08d: atrás desde #DET vuelve a la cámara con las fotos que ya tomaste (show('CAM') sin keepShots las borraba) */
  if(cur==='DET' && t==='CAM' && shots>0){ masFotosTap(); return; }
  /* Fase 6 · Brief 3: 'BACKMAIN' no es un id de pantalla (mismo sentinel que ya usa el delegado de data-go) — sin este caso, el atrás de AYUDA y ahora el de DET (cuando procFrom es 'BACKMAIN') no hacían nada */
  if(t==='BACKMAIN'){ goBackMain(); return; }
  if(t==='NOTIFBACK'){ notifBack(); return; } /* Fase 10 · Rediseño · Brief 12 */
  /* Fase 6 · portada de la Bóveda: el atrás de una carpeta o de "Todos" no navega a otra pantalla, vuelve
     a la portada dentro de la misma G1 — mismo criterio de sentinel que 'BACKMAIN' */
  if(t==='BOVPORTADA'){ bovFolder=null; bovQuery=''; bovType='all'; renderBoveda(); return; }
  show(t==='MAIN' ? lastMain : t);
});

/* ============================================================
   Fase 10 · Brief 03 · PEGAR TEXTO (#PEG)
   Mismo embudo de la v6 §4: esto entendí → ¿de quién es? → ¿qué trámite es? Nada se guarda sin elegir a la persona.
   La lectura es simulada: un texto con fecha y hora se lee como el mensaje de ejemplo (PEG_MSG); uno sin ellas recibe la respuesta honesta.
   ============================================================ */
var PEG_MSG='{eps} le informa: su cita de {t1l} quedó asignada para el lunes 9 de noviembre a las 3:00 p.m. con {docm} en {sede1}. Por favor llegar 20 minutos antes.';
/* el horario de ped que ya existe en slotsWgt() (el mismo que usa ped.confirmar por defecto) */
var PEG_CITA={when:'Lun 9 nov · 3:00 p.m.', doc:'{docm}', sede:'{sede1}', llegar:20};
var WARN_IC='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>';
/* res: null | 'nada' | 'ok' · who: persona elegida · fin: null | 'ped' (unida al trámite) | 'bov' (solo Bóveda) · doc: el que se guardó */
var peg={txt:'', res:null, who:null, fin:null, doc:null};
function pegReset(){ peg={txt:'', res:null, who:null, fin:null, doc:null}; }
function pegTieneCita(t){
  var fecha=/(lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo|ma[ñn]ana|\d{1,2}\s+de\s+[a-záéíóú]+|\d{1,2}\/\d{1,2})/i.test(t);
  var hora=/(\d{1,2}(:\d{2})?\s*(a\.?\s?m\.?|p\.?\s?m\.?)|\d{1,2}:\d{2})/i.test(t);
  return fecha && hora;
}
/* se une a ped solo si es de {p1}, ped está accionable y {p1} está en la familia */
function pegVaAPed(){ var c=card('ped'); return !!peg.who && detSlot(peg.who)===detSlot('SF') && !!c && c.st==='accionable' && personaVisible(c); }
function pegNombre(k){ return k==='SO' ? 'ti' : PNAME[k]; }
function renderPeg(){
  var box=document.getElementById('pegBox'); if(!box) return;
  var cerrado = peg.fin==='ped';
  box.innerHTML=
    '<div class="field"><label for="pegIn">El mensaje</label>'+
    '<textarea id="pegIn" class="peg-in" rows="6" placeholder="Pega aquí el mensaje de WhatsApp o de texto"'+(cerrado?' readonly':'')+'>'+
      peg.txt.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</textarea></div>'+
    (cerrado ? '' :
      '<button type="button" class="btn-s" data-peg="pegar">Pegar lo que copié</button>'+
      '<button type="button" class="btn-p" data-peg="leer"'+(peg.txt.trim()?'':' disabled')+'>Leer el mensaje</button>')+
    '<div id="pegRes" class="peg-res"></div>';
  renderPegRes();
}
function renderPegRes(){
  var box=document.getElementById('pegRes'); if(!box) return;
  var h='';
  if(peg.res==='nada'){
    h='<div class="row">'+tAv('atenta')+'<div class="bub t">No encontré una fecha ni una hora en ese texto. ¿Me cuentas qué es, o pegas el mensaje completo?</div></div>';
  } else if(peg.res==='ok'){
    var ok='<span class="ok-chip" aria-label="Lo dice el mensaje">'+OK_IC+'</span>';
    var fila=function(k,v){ return '<div class="exrow"><span><span class="ex-k">'+k+'</span><span class="ex-v">'+v+'</span></span>'+ok+'</div>'; };
    var para = peg.who
      ? fila('Para quién', peg.who==='SO' ? 'Tú' : PNAME[peg.who])
      : '<div class="exrow warn"><span><span class="ex-k">Para quién</span><span class="ex-v">El mensaje no dice el nombre.</span></span>'+
        '<span class="warn-chip" aria-label="Falta confirmar">'+WARN_IC+'</span></div>';
    var quien=SLOTS.filter(function(k){ return !personaFuera(k); }).map(function(k){
      var on=peg.who===k;
      return '<button type="button" class="who'+(on?' on':'')+'" data-pegwho="'+k+'" aria-pressed="'+(on?'true':'false')+'"'+(peg.fin==='ped'?' disabled':'')+'>'+
        '<span class="av" data-p="'+k+'" style="background:'+PCOL[k]+'">'+INIT[k]+'</span>'+(k==='SO'?'Tú':PNAME[k])+'</button>';
    }).join('');
    /* Fase 10 · Brief 47b: las candidatas de la pista que no están en la familia también se eligen (abren "¿de quién es?") */
    quien+=(V.pegCand||[]).filter(function(k){ return SLOTS.indexOf(k)>=0 && personaNoAgregada(k) && !(detDe(k)||{}).fuera; }).map(function(k){
      return '<button type="button" class="who" data-pegfuera="'+k+'"'+(peg.fin==='ped'?' disabled':'')+'>'+
        '<span class="av" data-p="'+k+'" style="background:'+PCOL[k]+'">'+INIT[k]+'</span>'+
        '<span class="who-txt">'+PNAME[k]+'<span class="who-sub">No está en tu familia</span></span></button>';
    }).join('');
    h='<div class="wgt"><div class="wgt-t">Esto entendí</div><div class="exlist">'+
      fila('Qué es','{t1}')+fila('Cuándo',PEG_CITA.when)+fila('Con quién',PEG_CITA.doc)+fila('Dónde',PEG_CITA.sede)+para+'</div>'+
      (peg.who ? '' : '<p class="wgt-d">{pistaPeg}</p>')+
      '<div class="who-grid">'+quien+'</div>'+
      '<div class="wgt-div"></div>'+
      '<p class="wgt-d">Además dice: «Llegar 20 minutos antes».<br>Te lo recuerdo el día antes de la cita.</p></div>';
    if(peg.who && !peg.fin && pegVaAPed()){
      h+='<div class="wgt"><div class="wgt-t">{p1} tenía pendiente agendar {t1l}</div>'+
         '<button type="button" class="btn-p" data-peg="unir">Agregar la cita a ese trámite</button></div>';
    } else if(peg.fin==='bov'){
      h+='<div class="row">'+tAv()+'<div class="bub t">Guardé la cita en la Bóveda. No encontré un trámite pendiente para '+pegNombre(peg.who)+'.</div></div>'+
         '<button type="button" class="btn-s" data-go="G1" data-bovcat="all">Ver en la Bóveda</button>'; /* Fase 10 · Brief 47b: abre "Todos" con la cita primero */
    }
  }
  box.innerHTML=fx(fx(h)); /* {pistaPeg} trae {p1}/{p2} adentro */
  if(peg.fin==='ped'){
    box.appendChild(msgEl({who:'t', comp:{
      t:'Guardé la cita del {t1l} de {p1}',
      s:PEG_CITA.when+' · '+PEG_CITA.doc+' · '+PEG_CITA.sede,
      time:'Hoy · 9:41 a.m.',
      ev:'Ver en el calendario', go:'F1',
      icon:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>'
    }}));
  }
  paintAvatars(box);
}
/* la cita queda como documento (Bóveda); si va a ped, se vincula a la consulta de la orden (ctr) */
function pegGuardaDoc(ep){
  if(!peg.doc){
    peg.doc={ep:ep, t:'Cita de {t1l}', s:PEG_CITA.when+' · '+PEG_CITA.sede, p:peg.who, ty:'mensaje', pill:['Cita','espera'],
      rel:'La trajiste pegando un mensaje de {eps}. Dice que hay que llegar 20 minutos antes.'};
    DOCS.push(peg.doc);
  }
  if(DOCS.indexOf(peg.doc)<0) DOCS.push(peg.doc); /* Fase 10 · Brief 47b: vuelve de "¿de quién es?" */
  peg.doc.p=peg.who; peg.doc.ep=ep; if(ep==='ctr') peg.doc.th='ped'; else delete peg.doc.th;
  if(ep==='na'){ bovMarcarNuevos([peg.doc]); bovFresh=true; renderBoveda(); } /* Fase 10 · Brief 47b: "Lo último que guardaste" */
  appVacia=false;
}
/* Fase 10 · Brief 03b: si el hilo ya se había abierto, sus widgets de agendar ("Agendar cita", horarios, "No me sirve ninguno")
   quedan bloqueados con lock(). El hilo no está en pantalla al pegar, así que se marcan (m.lk) y msgEl() los bloquea al pintarlos. */
function pegBloqueaAgendar(k){
  /* copia, no m.lk=true: los mensajes pueden ser los mismos objetos de INTRO y el reinicio los reusa */
  THREADS[k].msgs.forEach(function(m,i,a){ if(m.wgt && /data-act="ped\.(agendar|confirmar|mas|dia)"/.test(m.wgt)) a[i]=Object.assign({},m,{lk:true}); });
  if(cur==='TH' && curThread===k) [].forEach.call(TH.querySelectorAll('[data-act^="ped.agendar"],[data-act="ped.confirmar"],[data-act="ped.mas"],[data-act="ped.dia"]'), lock);
}
/* elegir persona es la confirmación: si no hay trámite pendiente, la cita va solo a la Bóveda (Fase 10 · Brief 47b: sale del manejador para reusarla al volver de "¿de quién es?") */
function pegElegir(k){
  peg.who=k;
  if(pegVaAPed()){ pegQuitaDoc(); peg.fin=null; }
  else { pegGuardaDoc('na'); peg.fin='bov'; }
  renderPegRes();
}
/* Fase 10 · Brief 47b: candidata que no está en la familia → la cita queda pendiente a su nombre y se abre "¿de quién es?" solo con ella.
   pegPendPrev = el SCAN_IDS que había antes (si quedaba algo pendiente de un escaneo) */
var pegPend=false, pegPendPrev=null;
function pegFuera(k){
  pegQuitaDoc(); peg.fin=null; peg.who=k;
  peg.doc={ep:'na', t:'Cita de {t1l}', s:PEG_CITA.when+' · '+PEG_CITA.sede, p:k, ty:'mensaje', pill:['Cita','espera'],
    rel:'La trajiste pegando un mensaje de {eps}. Dice que hay que llegar 20 minutos antes.'};
  DOCS_PEND.push(peg.doc); pegPend=true; pegPendPrev=SCAN_IDS; SCAN_IDS=[detSlot(k)];
  docPendAbrir();
}
function pegQuitaDoc(){ if(peg.doc){ var i=DOCS.indexOf(peg.doc); if(i>=0) DOCS.splice(i,1); peg.doc=null; } }
/* en #PEG y no en #pegBox: applyProfile() reescribe el contenido de las pantallas y #pegBox se reemplaza */
document.getElementById('PEG').addEventListener('input', function(e){
  if(e.target.id!=='pegIn') return;
  peg.txt=e.target.value;
  var b=this.querySelector('[data-peg="leer"]'); if(b){ if(peg.txt.trim()) b.removeAttribute('disabled'); else b.setAttribute('disabled',''); }
  /* si cambian el texto, lo que entendí ya no vale (lo guardado en la Bóveda sí se queda) */
  if(peg.res && !peg.fin){ peg.res=null; peg.who=null; renderPegRes(); }
});
document.getElementById('PEG').addEventListener('click', function(e){
  var b=e.target.closest('[data-peg]'), w=e.target.closest('[data-pegwho]');
  var wf=e.target.closest('[data-pegfuera]');
  if(wf){ if(peg.fin!=='ped') pegFuera(wf.getAttribute('data-pegfuera')); return; } /* Fase 10 · Brief 47b */
  if(w){
    if(peg.fin==='ped') return;
    pegElegir(w.getAttribute('data-pegwho'));
    return;
  }
  if(!b) return;
  var a=b.getAttribute('data-peg');
  if(a==='pegar'){ peg.txt=fx(PEG_MSG); peg.res=null; peg.who=null; renderPeg(); }
  else if(a==='leer'){
    peg.res = pegTieneCita(peg.txt) ? 'ok' : 'nada';
    renderPegRes();
    var r=document.getElementById('pegRes'); if(r && r.scrollIntoView) r.scrollIntoView({block:'nearest'});
  }
  else if(a==='unir'){
    if(!pegVaAPed()) return;
    var k='ped';
    pegGuardaDoc('ctr');
    /* el hilo de ped queda como si se hubiera confirmado ahí: mismo mensaje de agendada y el chip "Simular: la cita es mañana" */
    THREADS[k].started=true;
    pegBloqueaAgendar(k); /* Fase 10 · Brief 03b: no se puede agendar dos veces */
    commit(k,{who:'t', text:'Guardé la cita del mensaje de {eps} que pegaste.'}); /* Fase 10 · Brief 03b: lo pegó la persona, no Taremi */
    citaAgendada(k, PEG_CITA.when, PEG_CITA.doc, PEG_CITA.sede, {llegar:PEG_CITA.llegar}).slice(1).forEach(function(m){ commit(k,m); }); /* Fase 11 · Brief 04 (C): un solo acuse; sale el comprobante "Agendé…" (la cita la agendó la persona) */
    peg.fin='ped';
    renderPeg();
  }
});

/* ============================================================
   ONBOARDING
   ============================================================ */
/* Fase Móvil · Punto 1a: OBN 4→5, nuevo paso 2 "elegir familia" entre "Empecemos por alguien" e "importar" */
/* Fase 10 · Brief 03: OBN 5→6, nuevo paso 4 "Estas son las personas de tus documentos" antes de "Ya está" */
/* Fase 10 · Rediseño · Brief 13: OBN 6→7. 0 bienvenida · 1 historia · 2 cuenta · 3 tú y tu familia · 4 traer documentos · 5 ¿quién es quién? · 6 listo */
/* Fase 10 · Rediseño · Brief 13b: OBN 7→8. … 5 ¿quién es quién? · 6 así quedó tu familia (pantalla propia) · 7 ya está */
/* Fase 11 · Brief 01: sale el paso 1 (historia). Los números de paso se quedan; obShow() salta el 1 y obBar() no lo cuenta */
/* Fase 11 · Brief 02: OBN 8→7. 0 bienvenida · 1 así cuido tus datos · 2 cuenta · 3 tú y tu familia · 4 traer documentos (y bandeja) ·
   5 leí tus documentos · 6 listo. Sale el salto del paso 1 y sale el paso 7 «Ya está». obAcepto = la casilla del paso 1 */
var obStep=0, OBN=7, ob=document.getElementById('ob'), obAcepto=false;
/* Fase 6 · escaneo/subida/correo disparados desde el onboarding: *Active marca el flujo en curso, obScanDone si ya se guardó algo real */
var obScanActive=false, obScanSource=null, obScanDone=false, obMailActive=false;
/* Fase 10 · Brief 45b: obHecho = el onboarding ya terminó (obFinish o docPendFin). Desde ahí ninguna captura de la app reabre #ob;
   solo "Organizar los documentos" y "Reiniciar el prototipo" (resetDemo la apaga) */
var obHecho=false;
/* Fase 6 · Brief 2: sin sincronización real, solo que el correo conectado no se sienta como un paso olvidado */
var mailConnected=false;
/* Fase 10 · Brief 48: mailRevisado = hora en que se guardó lo del correo o del último "Revisar ahora";
   camUsada y micUsado = si ya se usaron (permisos en Configuración); cfgToast = aviso de una sola vez */
var mailRevisado=null, camUsada=false, micUsado=false, cfgToast=null;
/* Fase 8 · Brief 6.1: correo conectado desde el FAB, fuera del onboarding */
var fabMailActive=false;
/* Fase 10 · Rediseño · Brief 13: la cuenta. cuentaMail = correo con que se creó (lo usa el menú), cuentaGoogle = si fue con Google.
   cuentaVista = 'ini' | 'mail' | 'code' dentro del paso 2; cuentaCode = el código simulado ya llegó; obMailDraft = lo escrito en "Tu correo".
   obBandeja = la pantalla "¿Busco también en tu bandeja?" está abierta dentro del paso 4 */
var cuentaMail=null, cuentaGoogle=false, cuentaVista='ini', cuentaCode=false, obMailDraft='', obBandeja=false;
var OB_CODE='482913';
function obBar(){ var h=''; for(var i=0;i<OBN;i++) h+='<i class="'+(i<=obStep?'done':'')+'"></i>'; var b=document.getElementById('obBar'); b.innerHTML=h; b.classList.toggle('reabre', !!obReabre); } /* Fase 10 · Brief 46: reabierto desde la app, sin barra. Fase 11 · Brief 02: vuelve a contar el paso 1 */
function obShow(n){
  /* Fase 10 · Brief 03: la detección solo existe si se conectó el correo o se escaneó algo; si no, se salta en los dos sentidos (Brief 13: paso 5) */
  if(n===5 && !detAplica()) n = obStep>5 ? 4 : 6;
  if(obStep===3 && n!==3) obFamApply(); /* Fase 10 · Rediseño · Brief 13: lo editado en "Empecemos por ti" llega a toda la app */
  if(n!==4) obBandeja=false;
  obStep=n;
  var key=(n===4 && obBandeja) ? 'bandeja' : String(n);
  [].forEach.call(document.querySelectorAll('.ob-step'), function(s){ s.classList.toggle('on', s.getAttribute('data-step')===key); });
  document.getElementById('obBack').classList.toggle('hide', n===0);
  var nb=document.getElementById('obNext'), sk=document.getElementById('obSkip');
  nb.textContent = n===0 ? 'Empezar' : 'Continuar'; /* Fase 11 · Brief 02 · Brief 09: el último paso ya no promete llegar a Inicio */
  /* Fase 11 · Brief 02: sale "Saltar la configuración". "Ahora no" solo en traer documentos (mientras no se trajo nada), la bandeja y la detección */
  var traido = !!document.getElementById('obMail').getAttribute('data-done') || obScanDone;
  sk.style.display = ((n===4 && (obBandeja || !traido)) || n===5) ? 'block' : 'none';
  sk.textContent = (n===4 && obBandeja) ? 'Ahora no' : 'Lo hago después'; /* Fase 11 · Brief 07: un texto por pantalla; «Ahora no» solo en la bandeja */
  if(obReabre && n===OBN-1) nb.textContent='Listo'; /* Fase 10 · Brief 40 (ajuste): ya se está en la app */
  nb.style.display = (n===4 && !obBandeja && !traido) ? 'none' : ''; /* Fase 11 · Brief 02: "Continuar" sale cuando ya se trajo algo */
  nb.removeAttribute('disabled');
  if(n===1){ document.getElementById('obAcepto').checked=obAcepto; nb.toggleAttribute('disabled', !obAcepto); }
  else if(n===2) obCuentaView();
  else if(n===3){ obEditIx=-1; renderObFam(); }
  else if(n===4 && obBandeja){
    nb.textContent='Sí, busca en mi correo'; /* Fase 11 · Brief 02 */
    document.getElementById('obBandejaMail').textContent = cuentaMail || fx('{mail}');
    document.getElementById('obBandejaCta').textContent = (cuentaMail && !cuentaGoogle) ? 'Tu correo' : 'Tu cuenta de Google';
  }
  else if(n===5){ renderDet(); /* Fase 10 · Brief 03: renderDet() pone el texto y el estado del botón */
    /* Fase 10 · Brief 19: el paso empieza arriba (el .ob-step guardaba el scroll de la visita anterior) y el foco va al título */
    var st5=document.querySelector('.ob-step[data-step="5"]'); if(st5) st5.scrollTop=0;
    var t5=document.getElementById('obDetTitle'); if(t5) t5.focus({preventScroll:true}); }
  else if(n===6){ renderObFamSum(); document.querySelector('.ob-listo .ob-m').innerHTML=mascotaSVG('celebra', 96); } /* Fase 11 · Brief 02: «Listo» */
  obBar(); obPieH(); /* Fase 10 · Brief 46b */
}
/* Fase 11 · Brief 01: sale renderObFamChoice() (paso 1); OB_PLUS lo usa "Agregar a quien cuidas" */
var OB_PLUS='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'; /* Fase 10 · Brief 15: el "+" de .ob-add-ic, compartido con la cuarta historia */
/* Fase 10 · Rediseño · Brief 13: las tres vistas de la cuenta. "Continuar" solo aparece con el correo escrito o con el código lleno */
function obCuentaView(){ obCuentaPinta(); obPieH(); } /* Fase 10 · Brief 46b: cada vista de la cuenta muestra u oculta "Continuar"; el pie se vuelve a medir */
function obCuentaPinta(){
  [].forEach.call(document.querySelectorAll('[data-cview]'), function(v){ v.hidden = v.getAttribute('data-cview')!==cuentaVista; });
  var nb=document.getElementById('obNext');
  if(cuentaVista==='ini'){ nb.style.display='none'; return; }
  nb.style.display='';
  if(cuentaVista==='mail'){
    var inp=document.getElementById('obMailInput');
    nb.textContent='Enviarme el código';
    nb.toggleAttribute('disabled', !obMailValida(inp.value));
    return;
  }
  document.getElementById('obCodeMail').textContent=obMailDraft;
  [].forEach.call(document.querySelectorAll('#obCode i'), function(c,i){ c.textContent = cuentaCode ? OB_CODE.charAt(i) : ''; });
  document.getElementById('obCodeSim').toggleAttribute('disabled', cuentaCode);
  nb.textContent='Continuar';
  if(!cuentaCode) nb.style.display='none';
}
function obCuentaLista(google){
  cuentaGoogle=google;
  cuentaMail = google ? fx('{mail}') : obMailDraft;
  cuentaVista='ini'; cuentaCode=false;
  obFamInit(); obShow(3);
}
/* Fase 10 · Rediseño · Brief 13b: "Así quedó tu familia" es su propia pantalla (paso 6, lienzo 56).
   Fase 11 · Brief 02 (lienzo, fila 4, «Listo»): se junta con «Ya está». Una tarjeta con una fila por persona: avatar de 48 con el lápiz
   (#scrimIcon; esta pantalla existe para elegir los íconos) y el nombre. Sin relación; quien quedó fuera de la familia no aparece */
function obFamRow(av, nm){
  return '<div class="fam-r ob-fam-r"><span class="ob-famsum-av">'+av+'</span>'+
    '<span class="card-main"><span class="card-title">'+nm+'</span></span></div>';
}
function obFamSlotRow(k){
  var nm = k==='SO' ? V.u : PNAME[k];
  return obFamRow('<span class="av" data-p="'+k+'" style="background:'+PCOL[k]+'">'+INIT[k]+'</span>'+
    '<button type="button" class="av-badge av-badge-sm" data-iconpick="'+k+'" aria-label="Elegir ícono para '+(k==='SO'?'ti':nm)+'">'+I3_PENCIL+'</button>', k==='SO' ? fx('{u} · Tú') : nm);
}
function renderObFamSum(){
  var box=document.getElementById('obFamSum'); if(!box) return;
  var rows=obFamSlotRow('SO')+SLOTS.filter(function(k){ return k!=='SO' && !personaFuera(k); }).map(obFamSlotRow).join('');
  /* Fase 10 · Rediseño · Brief 13 (corrección 9): también las personas nuevas que la detección dejó en la familia. Sin lápiz: no tienen ranura en PICON */
  detExtrasIn().forEach(function(id){
    rows+=obFamRow('<span class="av" style="background:'+detCol(id)+'">'+detInitials(detNm(id)) /* Fase 11 · Brief 04 */+'</span>', detNm(id));
  });
  box.innerHTML='<div class="det-grp">'+rows+'</div>';
  /* Fase 11 · Brief 08: con solo Sonia, la frase no habla de una familia que no hay */
  var solo=SLOTS.every(function(k){ return k==='SO' || personaFuera(k); }) && !detExtrasIn().length, ld=document.getElementById('obListoDesc');
  /* Fase 11 · Brief 09: «Así quedó…» pasa al título (reemplaza los textos de los Briefs 07 y 08); reabierto conserva «Listo» */
  var lt=document.getElementById('obListoTitle');
  if(lt) lt.textContent = obReabre ? fx('Listo, {u}') : (solo ? 'Así quedó tu cuenta' : 'Así quedó tu familia');
  if(ld) ld.textContent = obReabre ? (solo ? 'Así quedó tu cuenta. En Familia puedes agregar a alguien cuando quieras.' : 'Así quedó tu familia. En Familia puedes editar los datos de cada persona.')
    : (solo ? 'En Familia puedes agregar a alguien cuando quieras.' : 'En Familia puedes editar los datos de cada persona.');
  paintAvatars(box);
}
function obFinish(){
  /* Fase 10 · Rediseño · Brief 13: "Saltar" desde el paso 3 también guarda lo editado. Ya no existe obSkipped: siempre hay historia
     Fase 10 · Rediseño · Brief 13b: solo desde el paso 3 (desde otro paso ya se aplicó al salir de él); si no, pisaba el nivel
     que "Organizar los documentos" escribió en r1/r2/r3 */
  if(obStep===3) obFamApply();
  if(obReabre){ docPendFin(); return; } /* Fase 10 · Brief 40: reabierto desde Inicio o la Bóveda */
  obHecho=true; obScanActive=false; obMailActive=false; /* Fase 10 · Brief 45b: ninguna bandera del onboarding sigue encendida en la app */
  /* Fase 6 · H-onboarding: saltar todo sin traer un documento real sí tiene consecuencia en el primer Inicio y en la primera Bóveda */
  var mailDone = !!document.getElementById('obMail').getAttribute('data-done');
  /* Fase 8 · Coherencia: appVacia persiste (no se apaga aquí) hasta que guardarTap() guarde algo real */
  appVacia = esPropia() ? !DOCS.length : (!mailDone && !obScanDone); /* Fase 10 · Brief 16: en la propia historia, vacía mientras no se guarde la orden */
  /* Brief 4 · ped/cir arrancan ocultas en CARDS0; se revelan solo si el onboarding trajo datos reales (#1, #2, #5) */
  /* Fase 10 · Brief 03: y solo si su persona quedó en la familia (personaVisible); ya no se revelan en silencio */
  var revela=function(k){ var c=card(k); if(c.st==='oculto' && personaVisible(c)) c.st='accionable'; }; /* Fase 10 · Brief 40: solo lo oculto (en el primer onboarding ped/cir/med/ter siempre lo están) */
  if(esPropia()){} /* Fase 10 · Brief 16: proGuardar() ya reveló el control; cir, med y ter no existen aquí */
  /* Fase 11 · Brief 04b (A): con «Ahora no» en "Leí tus documentos" (sin detOk) no se revela nada: nadie organizó esos documentos */
  else if(!detOk){}
  else if(mailDone){ revela('ped'); revela('cir'); revela('med'); revela('ter'); } /* Fase 11 · Brief 14b: sale lip */ /* Fase 10 · Brief 06: ter existe desde el inicio (en Inicio no sale por en30) */
  else if(obScanDone){ revela('cir'); }
  /* Fase 10 · Brief 03: "No es de mi familia" saca sus documentos de la Bóveda (el reinicio los devuelve desde DOCS0) */
  /* Fase 10 · Rediseño · Brief 13c: corre siempre, no solo con detOk
     Fase 10 · Brief 45: se revierte "sin documentos, lo de quien no se agregó tampoco llega después desde el FAB": queda en DOCS_BANDEJA */
  /* Fase 10 · Brief 40: si se trajeron documentos y se saltó la detección, lo de quien solo no se agregó queda aparte (DOCS_PEND), no se borra */
  var guarda = !esPropia() && !detOk && (mailDone || obScanDone);
  DOCS=DOCS.filter(function(d){
    if(d.ty==='imagen') return true; /* Fase 11 · Brief 05 (B): las fotos sin leer no son de nadie todavía: se quedan en «Sin consulta asociada» */
    var k=fx(d.p);
    if(guarda && detSlot(k)!=='SO' && !detCarneFuera(d)){ ((!SCAN_IDS || SCAN_IDS.indexOf(detSlot(k))>=0) ? DOCS_PEND : DOCS_BANDEJA).push(d); return false; } /* Fase 11 · Brief 04b (A): sin detección, todo lo que no es de Sonia queda sin organizar, esté o no su persona en la familia */
    if(!personaFuera(k) && !detCarneFuera(d)) return true;
    if(personaNoAgregada(k) && !(detDe(k)||{}).fuera && !detCarneFuera(d)) ((guarda && (!SCAN_IDS || SCAN_IDS.indexOf(detSlot(k))>=0)) ? DOCS_PEND : DOCS_BANDEJA).push(d); /* Fase 10 · Brief 45. Brief 47: si solo se escaneó, lo de quien no salió en lo escaneado sigue en la bandeja */
    return false;
  });
  if(!DOCS_PEND.length) SCAN_IDS=null; /* Fase 10 · Brief 47 */
  paintChips(); /* Fase 10 · Rediseño · Brief 13c (corrección): los chips del chat siguen a la familia final */
  buildFamLists();
  ob.classList.add('hidden');
  show('A1');
  /* Fase 6 · el tour de orientación en el primer Inicio ya explica el modelo mental — este overlay quedaría duplicado justo detrás */
}
/* ============================================================
   Fase 10 · Brief 40 · DOCUMENTOS SIN ORGANIZAR
   DOCS_PEND = documentos que trajo el onboarding de personas que no se agregaron, cuando se saltó la detección.
   No están en DOCS: ni Bóveda, ni Inicio, ni avisos, ni Calendario. "Organizar los documentos" reabre el paso 5;
   obReabre = la pantalla de origen ('A1' o 'G1'); obReabreSnap = la detección como estaba, para "Atrás" y "Ahora no" */
var DOCS_PEND=[], obReabre=null, obReabreSnap=null;
/* Fase 10 · Brief 45: DOCS_BANDEJA = documentos que siguen "en el correo": el onboarding terminó sin traer documentos y su persona no se
   agregó. No están en DOCS ni en DOCS_PEND y no generan tarjeta. "Lo que encontré" desde la app los muestra; al guardar, lo de la familia
   confirmada entra a la Bóveda y lo demás pasa a DOCS_PEND. fabPend = el paso 5 se abrió desde ese guardado (para el aviso de vuelta) */
var DOCS_BANDEJA=[], fabPend=false;
/* Fase 10 · Brief 47: SCAN_IDS = personas que aparecen en lo escaneado o subido cuando lo pendiente viene solo de un escaneo (null si
   entró el correo); la detección muestra solo a ellas. scanPend = el paso 5 se abrió desde el guardado de un escaneo en la app (para FIN o el aviso) */
var SCAN_IDS=null, scanPend=false;
/* busca un documento escaneado en la Bóveda o, si su persona no está en la familia, en la bandeja o en lo pendiente */
function scanDoc(f){ return DOCS.filter(f)[0] || DOCS_BANDEJA.filter(f)[0] || DOCS_PEND.filter(f)[0]; }
function docPendHTML(){
  if(!DOCS_PEND.length || bovPerson!=='all') return '';
  return '<div class="empty sin-org"><h4>Documentos sin organizar</h4>'+
    '<p>Traje documentos que todavía no sé de quién son. Dime de quién es cada uno y te armo sus trámites.</p>'+
    '<button type="button" class="btn-p" data-tap="docpend">Organizar los documentos</button></div>';
}
function docPendAbrir(){
  if(!DOCS_PEND.length) return;
  obReabre = cur==='G1' ? 'G1' : cur==='PEG' ? 'PEG' : 'A1'; /* Fase 10 · Brief 47b: también desde "Pegar texto" */
  obReabreSnap={det:JSON.parse(JSON.stringify(DETECT)), detOk:detOk, detDupe:detDupe, r:[V.r1, V.r2, V.r3]};
  obStep=5; /* sin pasar por obFamApply() de otro paso */
  ob.classList.remove('hidden');
  obShow(5);
}
/* "Atrás" o "Ahora no" desde el paso 5 reabierto: todo como estaba, la tarjeta sigue */
function docPendCerrar(){
  var sn=obReabreSnap;
  DETECT=sn.det; detOk=sn.detOk; detDupe=sn.detDupe; V.r1=sn.r[0]; V.r2=sn.r[1]; V.r3=sn.r[2];
  refrescarPersonas();
  var to=obReabre; obReabre=null; obReabreSnap=null;
  ob.classList.add('hidden');
  if(fabPend){ fabPend=false; pendingNote='Guardé lo de tu familia. Lo demás te espera en «Documentos sin organizar».'; renderInicio(); } /* Fase 10 · Brief 45 */
  if(scanPend){ scanPend=false; pendingNote='Lo guardo cuando me digas de quién es. Te espera en «Documentos sin organizar».'; renderInicio(); } /* Fase 10 · Brief 47 */
  if(pegPend){ pegPend=false; DOCS_PEND=DOCS_PEND.filter(function(d){ return d!==peg.doc; }); SCAN_IDS=pegPendPrev; pegPendPrev=null; peg.doc=null; peg.who=null; peg.fin=null; renderPegRes(); } /* Fase 10 · Brief 47b: "Ahora no" no guarda nada */
  show(to);
}
/* «Listo» (Fase 11 · Brief 02: era "Entrar a Taremi" del paso 7): lo confirmado entra como en el onboarding, sin tocar appVacia ni el recorrido */
function docPendFin(){
  obHecho=true; obScanActive=false; obMailActive=false; /* Fase 10 · Brief 45b */
  var revela=function(k){ var c=card(k); if(c.st==='oculto' && personaVisible(c)) c.st='accionable'; };
  var mailDone = !!document.getElementById('obMail').getAttribute('data-done');
  if(mailDone || mailConnected){ revela('ped'); revela('cir'); revela('med'); revela('ter'); } /* Fase 11 · Brief 14b: sale lip */ /* Fase 10 · Brief 45: también si el correo se conectó desde la app */
  else if(obScanDone){ revela('cir'); }
  var pegK=null;
  if(pegPend){ pegPend=false; pegK=peg.doc.p; DOCS_PEND=DOCS_PEND.filter(function(d){ return d!==peg.doc; }); } /* Fase 10 · Brief 47b: la cita no entra como pendiente: la decide pegElegir() al volver */
  var nuevos=DOCS_PEND.filter(function(d){ return !personaFuera(fx(d.p)) && !detCarneFuera(d) && !DOCS.some(function(x){ return docMismo(x,d); }); });
  /* Fase 10 · Brief 47: si lo pendiente viene de un escaneo, se revela el trámite de cada orden que entró; lo de quien no salió en la detección sigue pendiente */
  var resto = SCAN_IDS ? DOCS_PEND.filter(function(d){ return nuevos.indexOf(d)<0 && SCAN_IDS.indexOf(detSlot(fx(d.p)))<0; }) : [];
  if(SCAN_IDS) nuevos.forEach(function(d){ if(d.ty==='orden' && d.th && card(d.th)) revela(d.th); });
  DOCS=DOCS.concat(nuevos); DOCS_PEND=resto;
  if(pegK!==null){ SCAN_IDS=pegPendPrev; pegPendPrev=null; } /* Fase 10 · Brief 47b: lo pendiente de antes sigue con su origen */
  if(!DOCS_PEND.length) SCAN_IDS=null;
  if(nuevos.length){ bovMarcarNuevos(nuevos); bovFresh=true; }
  paintChips(); buildFamLists();
  var to=obReabre; obReabre=null; obReabreSnap=null;
  ob.classList.add('hidden');
  renderBoveda(); renderCalendario(); renderNotif();
  if(fabPend){ fabPend=false; pendingNote='Guardé todo lo que encontré en tu correo ✓'; } /* Fase 10 · Brief 45 */
  renderInicio();
  if(scanPend){ scanPend=false; finArmar(); return; } /* Fase 10 · Brief 47: después de "¿de quién es?", FIN con lo que se creó */
  show(to);
  if(pegK!==null){ if(personaFuera(pegK)){ peg.doc=null; peg.who=null; renderPegRes(); } else pegElegir(pegK); } /* Fase 10 · Brief 47b: con "No es de mi familia", la cita queda sin persona */
}
/* Fase 10 · Rediseño · Brief 13: "Sí, busca en mi bandeja" hace lo que hacían #obMailAllow / #obMailGoogle */
function obBandejaSi(){
  obBandeja=false;
  ob.classList.add('hidden');
  obMailActive=true; /* Fase 10 · Brief 45: mailConnected se enciende al guardar en "Lo que encontré", no aquí */
  show('PROC');
}
document.getElementById('obNext').addEventListener('click', function(){
  /* Fase 10 · Rediseño · Brief 13: dentro de la cuenta, el botón de abajo es "Enviarme el código" y luego "Continuar" */
  if(obStep===2){
    if(cuentaVista==='mail'){
      var v=document.getElementById('obMailInput').value.trim();
      if(!obMailValida(v)) return;
      obMailDraft=v; cuentaVista='code'; cuentaCode=false; obCuentaView(); return;
    }
    if(cuentaVista==='code' && cuentaCode) obCuentaLista(false);
    return;
  }
  if(obStep===4 && obBandeja){ obBandejaSi(); return; }
  if(obStep===5){ detConfirmar(); return; } /* Fase 10 · Rediseño · Brief 13b: "Organizar los documentos" guarda y pasa al paso 6 (Fase 11 · Brief 02: «Listo») */
  if(obStep===0){ obEmpezar(); return; } /* Fase 11 · Brief 01 */
  if(obStep===1){ if(!obAcepto) return; cuentaVista='ini'; cuentaCode=false; obShow(2); return; } /* Fase 11 · Brief 02 */
  if(obStep<OBN-1) obShow(obStep+1); else obFinish();
});
/* Fase 11 · Brief 01: "Empezar" aplica la historia de Sonia (antes lo hacía [data-obfam]). Fase 11 · Brief 02: y va a "Así cuido tus datos" */
function obEmpezar(){ applyProfile('sonia'); obShow(1); }
document.getElementById('obAcepto').addEventListener('change', function(e){ obAcepto=e.target.checked; document.getElementById('obNext').toggleAttribute('disabled', !obAcepto); }); /* Fase 11 · Brief 02 */
document.getElementById('obPolitica').addEventListener('click', function(){ document.getElementById('scrimPolitica').style.display='flex'; }); /* Fase 11 · Brief 04 (B): la política se lee en una hoja */
document.getElementById('obBack').addEventListener('click', function(){
  /* Fase 10 · Rediseño · Brief 13: dentro de la cuenta, atrás recorre sus vistas; desde la bandeja vuelve a "traer documentos" */
  if(obStep===2 && cuentaVista!=='ini'){ cuentaVista = cuentaVista==='code' ? 'mail' : 'ini'; cuentaCode=false; obCuentaView(); return; }
  if(obStep===4 && obBandeja){ obBandeja=false; obShow(4); return; }
  if(obReabre && obStep===5){ docPendCerrar(); return; } /* Fase 10 · Brief 40: no se va al paso 4 */
  if(obStep===3){ cuentaVista='ini'; cuentaCode=false; }
  if(obStep>0) obShow(obStep-1);
});
/* Fase 10 · Rediseño · Brief 13: en la bandeja "Ahora no" vuelve al paso 4 sin traer nada
   Fase 11 · Brief 02: en traer documentos sigue a «Listo» (obShow(5) salta la detección si no hay documentos); en la detección deja todo sin organizar, como antes */
document.getElementById('obSkip').addEventListener('click', function(){
  if(obStep===4 && obBandeja){ obBandeja=false; obShow(4); return; }
  if(obStep===4){ obShow(5); return; }
  if(obReabre && obStep===5){ docPendCerrar(); return; } /* Fase 10 · Brief 40: "Ahora no" */
  obFinish();
});

/* ============================================================
   Fase 10 · Brief 03 · DETECCIÓN DE PERSONAS (paso 4 del onboarding)
   Reemplaza la asignación silenciosa de obFinish(): nada entra a Inicio sin que se diga de quién es.
   DETECT[id] = {rel, fuera, open}. id = SF/MT/MA (personas de la historia)
   o una de DET_EXTRA (solo existen aquí). detOk se prende al tocar "Organizar los documentos".
   Fase 11 · Brief 01: sale el nivel de cuidado; la detección pide solo la relación
   Fase 11 · Brief 02 (lienzo, fila 2): sale la relación. DETECT[id] = {si, nm, fuera, known}: quien se agregó en el paso 3 coincide
   (known, sin pregunta); a las demás se les pregunta "¿Es de tu familia?" y, con «Sí», se confirma el nombre leído (nm)
   ============================================================ */
var DETECT={}, detOk=false, detDupe=null; /* Fase 10 · Rediseño · Brief 13b: sale detResumen (el resumen es el paso 6) */
var detEvAbre={}; /* Fase 11 · Brief 02: personas con "En N documentos" abierto */
/* SP solo aparece en Sonia si "No, es otra persona"; CR es el nombre de relleno para mostrar la exclusión */
var DET_EXTRA={SP:{nm:'Sofia G.', /* Fase 10 · Brief 19 (corrección): respaldo; detExtraNm() lo calcula */ ev:'Carné de vacunación'}, CR:{nm:'Carlos Rincón', ev:'Llegó en un correo reenviado'}};
function detAplica(){ return !esPropia() && (!!document.getElementById('obMail').getAttribute('data-done') || obScanDone || (!!obReabre && DOCS_PEND.length>0)); } /* Fase 10 · Brief 15: en la propia historia el paso 5 se salta siempre. Fase 10 · Brief 45c: y sí aplica en el paso reabierto con documentos sin organizar */
function detHayDupe(){ return PROF==='sonia'; }
/* Fase 10 · Brief 03c: las personas de la historia ya se conocen: llegan resueltas con los datos de PROFILES (r1/r2/r3) */
/* Fase 10 · Rediseño · Brief 13c: "ya en tu familia" = persona de la historia que se agregó en el paso 3; las demás de la historia
   son personas nuevas, con su relación de la historia como sugerencia en pregunta */
/* Fase 10 · Brief 19 (corrección): nombres completos, a la colombiana (primer apellido del papá + primer apellido de la mamá).
   Solo se ven donde "se lee" un documento (evidencia de la detección y visor). Si en el paso 3 se escribió solo el nombre (o el
   nombre y el primer apellido), se conservan los apellidos de la historia; si se escribieron otros apellidos, manda lo escrito */
var FULL_N={SO:'u', SF:'1', MT:'2', MA:'3'};
function apellidosDe(full){
  var w=(full||'').trim().split(/\s+/).slice(1).filter(function(x){ return !/^(de|del|la|los)$/i.test(x); });
  return w.slice(-2);
}
/* nm (opcional, Brief 19 · corrección 3): el nombre ya editado (perfil #I3); se le suman los apellidos de la persona */
function nombreCompleto(code, nm){
  var n=FULL_N[code]; if(!n) return nm || (PNAME && PNAME[code])||'';
  var base=V['f'+n], tw=(nm || (code==='SO' ? V.u+' '+(V.ape||'') : V['p'+n]||'')).trim().split(/\s+/);
  if(!base) return nm || (code==='SO' ? PNAME && PNAME.SO : V['p'+n])||''; /* propia: no hay nombres completos, solo el nombre ({p2}); V directo porque fx() puede llamarla antes de buildPeople() */
  var bAp=apellidosDe(base), tAp=tw.slice(1);
  var prefijo = tAp.every(function(a,i){ return bAp[i] && a.toLowerCase()===bAp[i].toLowerCase(); });
  return prefijo ? [tw[0]].concat(base.trim().split(/\s+/).slice(1)).join(' ') : tw.join(' '); /* conserva "de" (Rosa Molina de Reyes) */
}
/* Fase 11 · Brief 02: salen REL_APELLIDO y relSostenida() (la relación sugerida de la detección) */
function detHist(id){ return !DET_EXTRA[id]; }
function detKnown(id){ return detHist(id) && obAgregados.indexOf(id)>=0; }
function detIds(){
  var ids=SLOTS.filter(function(k){ return k!=='SO'; });
  if(detHayDupe()) ids.push('SP'); /* Fase 10 · Brief 03c: «Sofia P.» es siempre una tarjeta nueva en Sonia */
  ids.push('CR');
  /* Fase 10 · Brief 47: si lo pendiente viene de un escaneo o una subida, solo quien aparece en lo escaneado (sin «Sofia P.» ni las del correo) */
  if(SCAN_IDS && (scanPend || obReabre || obScanDone)) ids=ids.filter(function(id){ return SCAN_IDS.indexOf(id)>=0; });
  ids.forEach(function(id){
    if(DETECT[id] && (!detHist(id) || DETECT[id].known===detKnown(id))) return; /* Brief 13c: si cambió lo agregado, la tarjeta se rehace */
    /* Fase 11 · Brief 02: quien se agregó en el paso 3 llega confirmada; nm = el nombre como aparece en los documentos */
    var kn=detKnown(id);
    DETECT[id]={si:kn, nm:detLeido(id), fuera:false, known:kn};
  });
  return ids;
}
function detExtrasIn(){ return detOk ? ['SP','CR'].filter(function(id){ return DETECT[id] && !DETECT[id].fuera && DETECT[id].si && (id!=='SP' || detDupe==='otra' || !detSofiaEnFam()); }) : []; } /* Fase 11 · Brief 02: «Sí», ya no la relación */
/* Fase 10 · Rediseño · Brief 13 (corrección 8): el nombre del carné sale de {p1} y {ape} como lo escribiría el carné
   (primer nombre sin tilde + inicial del apellido). Con los datos de la historia es «Sofia G.» (Brief 19: apellido de la niña); si en
   "Empecemos por ti" se cambió el nombre, la duda de la detección se hace sobre el nombre nuevo */
function detExtraNm(id){
  if(id!=='SP') return DET_EXTRA[id].nm;
  /* Fase 10 · Brief 19 (corrección): el carné usa el primer apellido de la niña, no el de la dueña → «Sofia G.» */
  var nm=(V.p1||'').split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g,''), ap=(apellidosDe(nombreCompleto('SF'))[0]||'').trim();
  return nm+(ap ? ' '+ap.charAt(0).toUpperCase()+'.' : '');
}
function detNm(id){ return DET_EXTRA[id] ? ((detOk && DETECT[id] && DETECT[id].nm.trim()) || detExtraNm(id)) : PNAME[id]; } /* Fase 11 · Brief 02: el nombre confirmado */
function detLeido(id){ return DET_EXTRA[id] ? detExtraNm(id) : nombreCompleto(id); } /* Fase 11 · Brief 02: el nombre como aparece en los documentos */
/* Fase 11 · Brief 04 (B): las iniciales de una persona detectada salen del nombre leído (Sofia G. → SG, Carlos Rincón → CR) */
function detInitials(n){ var w=(n||'').replace(/\./g,'').trim().split(/\s+/).filter(Boolean); if(!w.length) return '··'; return (w.length>1 ? w[0].charAt(0)+w[w.length-1].charAt(0) : w[0].slice(0,2)).toUpperCase(); }
/* Fase 11 · Brief 04 (B): «¿Es la misma Sofía?» solo si Sofía está en la familia; si no, Sofia G. es una persona nueva */
function detSofiaEnFam(){ var d=DETECT.SF; return !!(d && d.si && !d.fuera); }
function detIni(id){ return DET_EXTRA[id] ? detInitials(detExtraNm(id)) : INIT[id]; }
function detCol(id, i){ return DET_EXTRA[id] ? 'var(--extra)' : PCOL[id]; } /* Fase 10 · Rediseño · Brief 09: detectadas por el escaneo (Fase 11 · Brief 01b: en niebla) */
/* fila de Familia para una persona que solo existe por la detección: no tiene perfil que abrir */
function detExtraRow(id){
  return '<div class="fam-r"><span class="av" style="background:'+detCol(id,['SP','CR'].indexOf(id))+'">'+detIni(id)+'</span>'+
    '<span class="card-main"><span class="card-title">'+detNm(id)+'</span></span></div>'; /* Fase 11 · Brief 02: sin relación */ /* Fase 10 · Brief 03c: "Otro" muestra lo escrito. Fase 11 · Brief 01: solo la relación */
}
/* el carné de «Sofia P.»: si es otra persona y se excluye, sale de la Bóveda con ella */
/* Fase 10 · Rediseño · Brief 13 (corrección 10): si es otra persona, el carné sale de la Bóveda aunque se quede en la familia
   (antes solo salía si además era "No es de mi familia"): no tiene ranura propia y se mostraba con {p1} */
function detCarneFuera(d){ return detHayDupe() && detDupe==='otra' && d.ty==='certificado'; }
/* Fase 11 · Brief 02: sale detEvid() (la línea "Así aparece: …"). La evidencia es "En N documentos" (DOCS y DOCS_PEND de esa persona),
   que se abre a sus consultas con la misma tarjeta de «Lo que encontré» (título, fecha y contador) */
function detDocs(id){
  var sl = id==='SP' ? 'SF' : id;
  return DOCS.concat(DOCS_PEND).filter(function(d){
    if(detSlot(fx(d.p))!==sl) return false;
    if(id==='SP') return d.ty==='certificado'; /* el carné de «Sofia G.» */
    return !(id==='SF' && detHayDupe() && detDupe==='otra' && d.ty==='certificado');
  });
}
function detEvBtn(id){
  var n=detDocs(id).length;
  if(!n) return '<span class="card-sub">'+(DET_EXTRA[id] ? DET_EXTRA[id].ev : 'En un correo de '+fx('{eps}'))+'</span>'; /* Carlos Rincón: no hay documento que abrir */
  var ab=!!detEvAbre[id];
  return '<button type="button" class="det-evb" data-detev="'+id+'" aria-expanded="'+ab+'">'+(id==='SO' ? 'Tú · ' : '')+'En '+n+' documento'+(n===1?'':'s')+'</button>';
}
function detEpisHTML(id){
  if(!detEvAbre[id]) return '';
  var docs=detDocs(id), h='';
  epiOrden().forEach(function(ep){
    var dd=docs.filter(function(d){ return d.ep===ep.id; }); if(!dd.length) return;
    h+='<div class="epi epi-card'+(ep.id==='na'?' epi-loose':'')+'"><div class="epi-h"><span class="epi-t"><b>'+ep.t+'</b></span>'+epiColaHTML(dd, ep.dcorta)+'</div></div>';
  });
  return '<div class="det-epis">'+fx(h)+'</div>';
}
function detHecha(id){
  var d=DETECT[id];
  if(d.fuera) return true;
  /* Fase 10 · Brief 03c: «Sofia P.» queda resuelta con "Sí, es {p1}"; la pregunta vive ahora en su propia tarjeta */
  if(id==='SP' && detSofiaEnFam()){ if(detDupe==='misma') return true; if(detDupe!=='otra') return false; } /* Fase 11 · Brief 04 */
  return d.si && !!d.nm.trim(); /* Fase 11 · Brief 02: «Sí» y un nombre */
}
function detListo(){ return detIds().every(detHecha); }
/* Fase 11 · Brief 02 · "Leí tus documentos" (lienzo, fila 2): "Coinciden con tu familia" (tú y quienes agregaste, con check, sin pregunta)
   y "No las agregaste" (una tarjeta por persona, con "¿Es de tu familia?" o "¿Es la misma Sofía?"). Salen la relación (detRelHTML,
   detChip, #obRelSheet aquí), "Ya están en tu familia" y la tarjeta "Confirmada" */
var SLOT_CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12.5l4 4 8-9"/></svg>';
function detChk(){ return '<span class="det-chk" role="img" aria-label="Confirmada">'+SLOT_CHECK+'</span>'; }
function detAv(id, color){
  return '<span class="av"'+(color && !DET_EXTRA[id] ? ' data-p="'+id+'"' : '')+' style="background:'+(color ? detCol(id) : 'var(--extra)')+'">'+(DET_EXTRA[id] ? detInitials(detLeido(id)) : INIT[id]) /* Fase 11 · Brief 04 */+'</span>';
}
function detCoincideRow(id){
  var so=id==='SO';
  return '<div class="fam-r-row"><div class="fam-r det-r"><span class="av" data-p="'+(so?'SO':id)+'" style="background:'+PCOL[so?'SO':id]+'">'+INIT[so?'SO':id]+'</span>'+
    '<span class="card-main"><span class="card-title">'+nombreCompleto(so?'SO':id)+'</span>'+detEvBtn(id)+'</span>'+detChk()+'</div>'+detEpisHTML(id)+'</div>';
}
function detBotones(a, b){
  return '<div class="det-2b"><button type="button" class="btn-s" '+a[0]+'>'+a[1]+'</button><button type="button" class="btn-s" '+b[0]+'>'+b[1]+'</button></div>';
}
function detCardHTML(id){
  var d=DETECT[id], sf=detNm('SF');
  /* «Sí, es Sofía»: la tarjeta se pliega en una línea */
  if(id==='SP' && detDupe==='misma' && !d.fuera && detSofiaEnFam()){ /* Fase 11 · Brief 04 */
    return '<div class="pcard det-card"><div class="fam-r det-r det-plegada">'+detChk()+
      '<span class="card-main"><span class="card-title">Es '+sf+' · su carné pasa a ella</span></span>'+
      '<button type="button" class="ob-link det-link" data-detdupe="">Cambiar</button></div></div>';
  }
  var color = d.si && !d.fuera;
  var h='<div class="pcard det-card"><div class="pcard-h">'+detAv(id, color)+
     '<span class="card-main"><span class="pcard-nm">'+detLeido(id)+'</span>'+(color && !d.known ? '<span class="card-sub">Lo agregas a tu familia</span>' : detEvBtn(id))+'</span>'+(color ? detChk() : '')+'</div>'+detEpisHTML(id)+'<div class="pcard-b">';
  if(d.fuera){
    return h+'<p class="det-q">No es de tu familia. No guardo su documento.</p>'+
      '<button type="button" class="ob-link det-link" data-detundo="'+id+'">Deshacer</button></div></div>';
  }
  if(id==='SP' && detDupe!=='otra' && detSofiaEnFam()){ /* Fase 11 · Brief 04: sin Sofía en la familia, pregunta como a cualquiera */
    return h+'<p class="det-q">¿Es la misma '+sf+'?</p>'+detBotones(['data-detdupe="misma"','Sí, es '+sf], ['data-detdupe="otra"','No, es otra'])+'</div></div>';
  }
  if(!d.si){
    return h+'<p class="det-q">¿Es de tu familia?</p>'+detBotones(['data-detsi="'+id+'"','Sí'], ['data-detfuera="'+id+'"','No'])+'</div></div>';
  }
  h+='<div class="field"><label for="detNm'+id+'">Nombre</label><input class="ob-inp" type="text" id="detNm'+id+'" data-detnm="'+id+'" value="'+d.nm.replace(/"/g,'&quot;')+'">'+
     '<p class="helper">Así aparece en sus documentos. Corrígelo si está mal.</p></div>';
  if(!d.known) h+='<button type="button" class="ob-link det-link" data-detundo="'+id+'">Deshacer</button>'; /* Fase 11 · Brief 04b (A): «Sí» también se deshace, igual que «No» */
  if(id==='SP') h+='<p class="helper">Su carné no lo guardo en la Bóveda. Si lo necesitas, llévalo en físico.</p>'; /* Fase 10 · Rediseño · Brief 13 (corrección 11) */
  return h+'</div></div>';
}
function renderDet(){
  var box=document.getElementById('obDet'); if(!box) return;
  var nb=document.getElementById('obNext'), ids=detIds();
  var conocidas=ids.filter(detKnown), nuevas=ids.filter(function(id){ return !detKnown(id); });
  var h='<div class="wgt-lbl">Coinciden con tu familia</div><div class="det-grp">'+detCoincideRow('SO')+conocidas.map(detCoincideRow).join('')+'</div>';
  if(nuevas.length) h+='<div class="wgt-lbl">No las agregaste</div>'+nuevas.map(detCardHTML).join('');
  box.innerHTML=h; paintAvatars(box);
  nb.textContent='Organizar los documentos';
  nb.toggleAttribute('disabled', !detListo());
}
/* "Organizar los documentos": lo confirmado entra a la familia; el nombre corregido llega a toda la app (como en el paso 3)
   Fase 10 · Rediseño · Brief 13b: y se pasa directo al paso 6. Fase 11 · Brief 02: sin relación; el paso 6 es «Listo» */
function detConfirmar(){
  if(!detListo()) return;
  detOk=true;
  var cambio=false, set=function(key,val){ if(V[key]!==val){ V[key]=val; cambio=true; } };
  ['SF','MT','MA'].forEach(function(k){
    var d=DETECT[detSlot(k)]; if(!d || d.fuera || !d.si || d.known) return;
    var pe=obPersonaDe(k); pe.nm=d.nm; obPersonaEscribe(pe, set);
  });
  if(cambio) repaintStatic();
  refrescarPersonas();
  obShow(6);
}
document.getElementById('obDet').addEventListener('click', function(e){
  var t, d;
  if((t=e.target.closest('[data-detev]'))){ var ei=t.getAttribute('data-detev'); detEvAbre[ei]=!detEvAbre[ei]; renderDet();
    var eb=document.querySelector('[data-detev="'+ei+'"]'); if(eb) eb.focus(); return; }
  if((t=e.target.closest('[data-detsi]'))){ d=DETECT[t.getAttribute('data-detsi')]; d.si=true; renderDet();
    var ni=document.getElementById('detNm'+t.getAttribute('data-detsi')); if(ni) ni.focus(); return; }
  if((t=e.target.closest('[data-detfuera]'))) DETECT[t.getAttribute('data-detfuera')].fuera=true;
  else if((t=e.target.closest('[data-detundo]'))){ d=DETECT[t.getAttribute('data-detundo')]; d.fuera=false; d.si=false; }
  /* Fase 10 · Brief 03c: la pregunta vive en la tarjeta de «Sofia G.». Fase 11 · Brief 02: "Cambiar" (data-detdupe="") la vuelve a abrir */
  else if((t=e.target.closest('[data-detdupe]'))){ detDupe=t.getAttribute('data-detdupe')||null; DETECT.SP.si=false; }
  else return;
  renderDet();
});
document.getElementById('obDet').addEventListener('input', function(e){
  var id=e.target.getAttribute('data-detnm'); if(!id) return;
  DETECT[id].nm=e.target.value;
  document.getElementById('obNext').toggleAttribute('disabled', !detListo());
});
/* ---- Familia: tarjetas colapsables, sin preselección (H11, H14) ---- */
/* Fase 10 · Brief 43: parentesco con autocompletar. REL_TODAS reemplaza a RELS y a detRels(): una sola lista, sin "Otro"
   (lo que no está se usa tal como se escribió). relPickerHTML() dibuja el contenido de #i3RelSheet (Fase 11 · Brief 02: ya no el de #obRelSheet ni #faRelSheet) */
var REL_TODAS=['Hija','Hijo','Mamá','Papá','Pareja','Esposa','Esposo','Hermana','Hermano','Abuela','Abuelo','Nieta','Nieto','Tía','Tío','Sobrina','Sobrino','Prima','Primo','Suegra','Suegro','Cuñada','Cuñado','Nuera','Yerno','Bisabuela','Bisabuelo','Madrastra','Padrastro','Hijastra','Hijastro','Madrina','Padrino'];
var REL_FREC=['Hija','Hijo','Mamá','Papá','Pareja'];
var REL_EQUIV={madre:['Mamá'], padre:['Papá'], novia:['Pareja'], novio:['Pareja'], esposa:['Pareja'], esposo:['Pareja']}; /* suman, no reemplazan */
function relNorm(s){ return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim(); }
function relLimpio(s){ s=(s||'').trim().slice(0,30).trim(); return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }
function relEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
/* filas: [valor, texto, marcada]. Vacío → la relación actual (si no es frecuente) y las frecuentes; con texto → filtra, máx. 6 filas */
function relFilas(q, cur){
  var n=relNorm(q), out=[];
  if(!n){
    if(cur && REL_FREC.indexOf(cur)<0) out.push([cur, cur, true]);
    REL_FREC.forEach(function(r){ out.push([r, r, r===cur]); });
    return out;
  }
  var emp=[], con=[], eq=[];
  REL_TODAS.forEach(function(r){ var x=relNorm(r).indexOf(n); if(x===0) emp.push(r); else if(x>0) con.push(r); });
  if(n.length>=3) Object.keys(REL_EQUIV).forEach(function(k){ if(k.indexOf(n)===0) eq=eq.concat(REL_EQUIV[k]); });
  var vistos={};
  emp.concat(eq, con).forEach(function(r){ if(!vistos[r]){ vistos[r]=1; out.push([r, r, false]); } });
  var usar=relLimpio(q), exacta=REL_TODAS.some(function(r){ return relNorm(r)===n; });
  if(usar && !exacta){ out=out.slice(0,5); out.push([usar, 'Usar «'+usar+'»', false]); }
  return out.slice(0,6);
}
/* tpl: los atributos de cada fila, con {v} en lugar del valor (p. ej. 'data-i3rel="{v}"'); pre: prefijo de los id de la hoja */
function relFilasHTML(q, cur, tpl, pre){
  return relFilas(q, cur).map(function(f, i){
    return '<button type="button" class="m3i'+(f[2]?' sel':'')+'" role="option" id="'+pre+'RelOpt'+i+'" aria-selected="'+f[2]+'" '+tpl.replace('{v}', relEsc(f[0]))+'>'+relEsc(f[1])+'</button>';
  }).join('');
}
function relAnuncio(n){ return n===1 ? '1 sugerencia' : n+' sugerencias'; }
function relPickerHTML(valor, tpl, pre){
  var cur=valor||'', n=relFilas('', cur).length;
  return '<div class="field relpick"><label for="'+pre+'RelIn">Relación</label>'+
    '<input type="text" id="'+pre+'RelIn" class="relpick-in" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="'+pre+'RelLb"'+
    ' maxlength="30" autocomplete="off" placeholder="Escribe, por ejemplo, tía" data-cur="'+relEsc(cur)+'" data-tpl="'+relEsc(tpl)+'" data-pre="'+pre+'"></div>'+
    '<div role="listbox" id="'+pre+'RelLb" aria-label="Relación">'+relFilasHTML('', cur, tpl, pre)+'</div>'+
    '<p class="sr-only" aria-live="polite" id="'+pre+'RelLive">'+relAnuncio(n)+'</p>';
}
/* al escribir solo se repinta la lista (el campo no pierde el foco); Enter elige la primera fila. Escape lo cierra initA11yDialogs() */
document.addEventListener('input', function(e){
  var t=e.target; if(!t.classList || !t.classList.contains('relpick-in')) return;
  var pre=t.getAttribute('data-pre'), cur=t.getAttribute('data-cur');
  document.getElementById(pre+'RelLb').innerHTML=relFilasHTML(t.value, cur, t.getAttribute('data-tpl'), pre);
  document.getElementById(pre+'RelLive').textContent=relAnuncio(relFilas(t.value, cur).length);
});
document.addEventListener('keydown', function(e){
  var t=e.target; if(e.key!=='Enter' || !t.classList || !t.classList.contains('relpick-in')) return;
  e.preventDefault();
  var f=document.querySelector('#'+t.getAttribute('data-pre')+'RelLb [role="option"]'); if(f) f.click();
});
var obPeople=[]; /* Fase 10 · Rediseño · Brief 13: se llena desde la historia en obFamInit() */
var obEditIx=-1; /* Fase 11 · Brief 02: fila del paso 3 con el nombre abierto (antes obMenuIx, la hoja de relación) */
/* Fase 6 · fecha de nacimiento con formato forzado dd/mm/aaaa */
function fechaFormat(v){
  var d=(v||'').replace(/\D/g,'').slice(0,8);
  if(d.length>4) return d.slice(0,2)+'/'+d.slice(2,4)+'/'+d.slice(4);
  if(d.length>2) return d.slice(0,2)+'/'+d.slice(2);
  return d;
}
function fechaValida(v){
  var m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec((v||'').trim());
  if(!m) return {ok:false, reason:'incompleta'};
  var d=+m[1], mo=+m[2], y=+m[3];
  if(d<1||d>31||mo<1||mo>12) return {ok:false, reason:'imposible'};
  var dt=new Date(y, mo-1, d);
  if(dt.getFullYear()!==y || dt.getMonth()!==mo-1 || dt.getDate()!==d) return {ok:false, reason:'imposible'};
  var hoy=new Date(); hoy.setHours(0,0,0,0);
  if(dt>hoy || y<hoy.getFullYear()-120) return {ok:false, reason:'imposible'};
  return {ok:true};
}
/* Fase 6 · edad aproximada, alternativa a la fecha exacta para un tercero (#3) */
function edadAproxValida(v){
  var s=(v||'').trim();
  if(!/^\d+$/.test(s)) return {ok:false, reason: s==='' ? 'incompleta' : 'imposible'};
  var n=+s;
  if(n<0 || n>120) return {ok:false, reason:'imposible'};
  return {ok:true};
}
function obInitials(n){
  var p=(n||'').trim();
  if(!p) return '··';
  var primero=p.split(/\s+/)[0];
  return (primero.slice(0,2)||'··').toUpperCase();
}
/* Fase 6 · edad calculada a partir de la fecha de nacimiento: meses si <1 año, años el resto */
function obEdad(nac){
  var v=fechaValida(nac);
  if(!v.ok) return '';
  var m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(nac.trim());
  var d=+m[1], mo=+m[2], y=+m[3];
  /* Fase 10 · Rediseño · Brief 13b (corrección): el "hoy" del prototipo (HOY_SIM) y meses hasta los 2 años */
  var hoy=HOY_SIM;
  var meses=(hoy.getFullYear()-y)*12+(hoy.getMonth()-(mo-1));
  if(hoy.getDate()<d) meses--;
  if(meses<0) meses=0;
  if(meses<24) return meses+' mes'+(meses===1?'':'es');
  var anios=Math.floor(meses/12);
  return anios+' año'+(anios===1?'':'s');
}
function obRelLabel(p){ return p.rel==='Otro' ? (p.otro||'Otro') : p.rel; }
/* Fase 10 · Rediseño · Brief 13: "Empecemos por ti". obPeople se arma desde la historia (obFamInit) y lo editado se escribe en V
   al salir del paso (obFamApply). Solo se edita lo que llega de verdad a la app: nombre y relación. El nivel va como texto
   ("¿Quién es quién?" lo vuelve a preguntar) y ya no hay "Agregar a quien cuidas" (no llegaba a la app).
   Fase 10 · Rediseño · Brief 13b: sale el nivel (se pregunta en "¿Quién es quién?") y entra la fecha de nacimiento. Solo {p2}
   la trae de la historia (V.nac2raw); las demás van vacías (nunca inventadas) y, si se escriben, quedan en OB_NAC */
var OB_N={SF:1,MT:2,MA:3}, OB_VAR={SO:'sonia',SF:'sofia',MT:'mateo',MA:'marta'};
/* Fase 10 · Brief 15: EPS de la hoja "¿Cuál es tu EPS?" (más "Otra", con campo de texto, como la relación) */
var OB_EPS=['Sura','Sanitas','Compensar','Nueva EPS','Salud Total','Famisanar'], obEpsMenu=false;
function obEpsDe(p){ return p.eps==='Otra' ? (p.epsOtro||'').trim().replace(/\s+/g,' ') : (p.eps||''); }
/* si la EPS no es la original de la historia (o es la propia historia), no hay teléfono ni sedes de la historia */
function obEpsApply(e, set){
  var o=PROFILES[PROF].v, igual=!esPropia() && e===o.eps;
  set('eps', e); set('epsn', epsNombre(e));
  set('tel', igual ? o.tel : '');
  /* Fase 10 · Brief 16b: "Coosalud EPS" → "Coosalud Centro"; "Nueva EPS" se queda completa */
  var base = (/\s+EPS$/i.test(e) && !/^nueva eps$/i.test(e)) ? e.replace(/\s+EPS$/i,'') : e;
  set('sede1', igual ? o.sede1 : base+' Centro'); set('sede2', igual ? o.sede2 : base+' Norte');
}
var obFamQuito=false; /* Fase 11 · Brief 08: true si la persona quitó a alguien (el botón pasa a "Agregar a alguien") */
function obFamInit(){
  /* Fase 10 · Brief 15: "Tu EPS" llega prellenada con la de la historia (V.eps); en la propia historia, vacía */
  var ep=V.eps||'', enLista=OB_EPS.indexOf(ep)>=0;
  /* Fase 10 · Brief 19 (corrección 4): "Nombre completo" llega prellenado con el del punto 7 (en la propia historia, lo de siempre) */
  obPeople=[{k:'SO', me:true, nm:(esPropia() ? fx('{u} {ape}') : nombreCompleto('SO')).trim(), nac:OB_NAC.SO||'', nacErr:'', eps:enLista ? ep : (ep ? 'Otra' : ''), epsOtro:enLista ? '' : ep}];
  ['SF','MT','MA'].filter(function(k){ return SLOTS.indexOf(k)>=0; }).forEach(function(k){ obPeople.push(obPersonaDe(k)); }); /* Fase 10 · Brief 30: sale a obPersonaDe() */
  obEditIx=-1; obEpsMenu=false;
  /* Fase 11 · Brief 08: la familia ya no llega puesta; se agrega con un toque o sale de los documentos */
  obAgregados=[]; obFamQuito=false;
}
/* Fase 10 · Brief 30: la tarjeta de una persona de la historia, prellenada; la usan el paso 3 (obFamInit) y «Agregar familiar» (#I1) */
function obPersonaDe(k){
  var r=V['r'+OB_N[k]]||'';
  return {k:k, me:false, nm:esPropia() ? (V['p'+OB_N[k]]||'') : nombreCompleto(k), rel:relDeStr(r), /* Fase 10 · Brief 19 (corrección 4). Fase 11 · Brief 04b: la relación puede no estar */ otro:'', resto:restoDeStr(r),
    nac:(k==='MT' ? V.nac2raw : OB_NAC[k])||'', nacErr:'',
    approx:!!OB_APROX[k], edadAprox:OB_APROX[k]||''}; /* Fase 10 · Brief 18: edad aproximada. Fase 11 · Brief 01: sale el nivel */
}
/* Fase 10 · Rediseño · Brief 13c: tarjetas visibles del paso 3 (tú + las agregadas) y la siguiente persona de la historia por agregar */
function obEnFam(p){ return p.me || obAgregados.indexOf(p.k)>=0; }
function obSiguiente(){ for(var i=0;i<obPeople.length;i++) if(!obEnFam(obPeople[i])) return obPeople[i]; return null; }
/* iniciales: las de la historia mientras el nombre no cambie (Mateo es MT, no MA) */
function obIni(p){
  var o=PROFILES[PROF].v, nm=p.nm.trim();
  if(esPropia()) return obInitials(nm); /* Fase 10 · Brief 15 */
  if(p.me) return nm.split(/\s+/)[0]===o.u ? o.iu : obInitials(nm);
  return nm.split(/\s+/)[0]===o['p'+OB_N[p.k]] ? o['i'+OB_N[p.k]] : obInitials(nm); /* Fase 10 · Brief 19 (corrección 4): el campo trae el nombre completo */
}
/* Fase 11 · Brief 02: salen obNacOk() y OB_ERR_IC (la fecha del paso 3 y de #I1) */
/* Fase 10 · Brief 15: sin EPS no se continúa. Fase 11 · Brief 01: sale el nivel */
function obReady(){ return obPeople.filter(obEnFam).every(function(p){ return p.nm.trim() && (!p.me || !!obEpsDe(p)); }); } /* Fase 11 · Brief 02: tu nombre, tu EPS y el nombre de cada persona agregada */
/* Fase 10 · Brief 30: lo que una tarjeta escribe en V, OB_NAC y OB_APROX (sale de obFamApply(); la comparte #I1). Fase 11 · Brief 01: sin conNivel */
function obPersonaEscribe(p, set){
    var nm=p.nm.trim().replace(/\s+/g,' '), ini=obIni(p);
    /* Fase 10 · Rediseño · Brief 13b: la fecha llega al perfil (i3DateRow). {p2} usa la de la historia; las demás, OB_NAC */
    var nac=p.approx ? '' : (p.nac||'').trim(); /* Fase 10 · Brief 18: con edad aproximada, la fecha no cuenta */
    if(p.k==='MT'){ set('nac2raw', nac); set('nac2', fechaLarga(nac)); }
    else if(nac) OB_NAC[p.k]=nac; else delete OB_NAC[p.k];
    var ap=(p.approx && (p.edadAprox||'').trim()) ? p.edadAprox.trim() : '';
    if(!p.me){ if(ap) OB_APROX[p.k]=ap; else delete OB_APROX[p.k]; }
    /* Fase 10 · Brief 19 (corrección 4): la primera palabra es el nombre que usa la app; el resto, los apellidos, que van al nombre
       completo ({fu}/{fN}: perfil, detección, visor, "Paciente:") y a la comparación de apellidos. {ape} = el primer apellido */
    var w=nm.split(' '), nom=w[0];
    if(p.me){ set('u', nom); set('ape', apellidosDe(nm)[0]||''); set('fu', nm); set('iu', ini); obEpsApply(obEpsDe(p), set); return; } /* Fase 10 · Brief 15: V.eps */
    var n=OB_N[p.k], r=relEdad(p.k, obRelLabel(p), esEdad(p.resto) ? '' : p.resto); /* Fase 10 · Rediseño · Brief 13b (corrección): edad desde la fecha. Fase 11 · Brief 01: sin nivel */
    set('p'+n, nom); set('f'+n, nm); set('i'+n, ini); set('r'+n, r); /* Fase 10 · Brief 19 (corrección 4) */
    if(p.k==='MT' && PROFILES[PROF].hide.indexOf('SF')>=0){ set('p1', nom); set('f1', nm); set('i1', ini); set('r1', r); } /* lógica genérica de hide:['SF'] (antes Martha); con Sonia no se activa */
}
function obFamApply(){
  if(!obPeople.length || !obPeople[0].k || !obReady()) return;
  var cambio=false, set=function(key,val){ if(V[key]!==val){ V[key]=val; cambio=true; } };
  obPeople.filter(obEnFam).forEach(function(p){ obPersonaEscribe(p, set); }); /* Fase 10 · Rediseño · Brief 13c: solo tú y las agregadas. Brief 30: sale a obPersonaEscribe() */
  obPeople.forEach(function(p){ if(!p.me && !obEnFam(p)) delete OB_APROX[p.k]; }); /* Fase 10 · Brief 18: quien se quitó no deja edad */
  if(cambio){ repaintStatic(); refrescarPersonas(); }
}
/* Fase 10 · Brief 30: la tarjeta de persona de «Agregar familiar» (#I1). i = 'f'; o.pre = prefijo de los id de los campos
   Fase 11 · Brief 02: solo el nombre (salen la relación, la fecha y «Quitar»; el paso 3 ya no la usa: tiene sus filas, obFamFilaHTML) */
function obCardHTML(p, i, o){
  var vr=OB_VAR[p.k];
  return '<div class="pcard ob-pc" style="--pc-t:var(--'+vr+'-t);--tinte:var(--'+vr+'-t)">'+ /* Fase 10 · Brief 18: --tinte */
     '<div class="pcard-h"><span class="av" style="background:var(--'+vr+')">'+obIni(p)+'</span>'+
     '<span class="card-main"><span class="pcard-nm">'+(p.nm.trim()||'Sin nombre')+'</span></span></div>'+
     '<div class="pcard-b"><div class="field"><label for="'+o.pre+'Nm'+i+'">Nombre</label><input class="ob-inp" type="text" id="'+o.pre+'Nm'+i+'" data-obf="nm" data-obi="'+i+'" placeholder="Nombre" value="'+p.nm.replace(/"/g,'&quot;')+'"></div></div></div>';
}
/* Fase 11 · Brief 02 · paso 3 (lienzo, fila 2): "Tú" con tu nombre y tu EPS; "Tu familia" (opcional) con una fila por persona.
   El lápiz (obEditIx) abre en la misma fila el campo "Nombre" y «Quitar» */
function obFamTuHTML(p){
  var eL=obEpsDe(p) || (p.eps==='Otra' ? 'Otra' : '');
  return '<div class="pcard ob-tu"><div class="pcard-b">'+
    '<div class="field"><label for="obNm0">Tu nombre</label><input class="ob-inp" type="text" id="obNm0" data-obf="nm" data-obi="0" placeholder="Tu nombre" value="'+p.nm.replace(/"/g,'&quot;')+'"></div>'+
    (cuentaGoogle && !esPropia() ? '<p class="ob-gnote"><span class="ob-g" aria-hidden="true">G</span>Lo tomé de tu cuenta de Google. Cámbialo si prefieres otro.</p>' : '')+ /* Fase 10 · Brief 15 */
    /* Fase 10 · Brief 15: "Tu EPS", obligatoria. Abre #obRelSheet en modo EPS */
    '<div class="field"><label>Tu EPS</label><div class="sel-wrap">'+
    '<button type="button" class="box'+(eL?' filled':'')+'" data-obeps="1"><span>'+(eL||'Elige tu EPS')+'</span><span class="chev">'+CHEV_D+'</span></button></div></div>'+
    '<p class="ob-gnote">Con tu nombre y tu EPS reconozco tus documentos.</p>'+ /* Fase 11 · Brief 08: la razón, en lugar del subtítulo */
    '</div></div>';
}
function obFamFilaHTML(p, i){
  var vr=OB_VAR[p.k], ab=obEditIx===i, nm=p.nm.trim();
  var h='<div class="fam-r-row" data-obrow="'+i+'"><div class="fam-r ob-fam-r"><span class="av" style="background:var(--'+vr+')">'+obIni(p)+'</span>'+
    '<span class="card-main"><span class="card-title">'+(nm||'Sin nombre')+'</span></span>'+
    '<button type="button" class="icon-btn ob-lapiz" data-obedit="'+i+'" aria-expanded="'+ab+'" aria-label="Editar '+(nm ? 'a '+nm.split(' ')[0] : 'esta persona')+'">'+I3_PENCIL+'</button></div>';
  if(ab) h+='<div class="ob-fam-ed"><div class="field"><label for="obNm'+i+'">Nombre</label><input class="ob-inp" type="text" id="obNm'+i+'" data-obf="nm" data-obi="'+i+'" placeholder="Nombre" value="'+p.nm.replace(/"/g,'&quot;')+'"></div>'+
    '<button type="button" class="ob-link ob-quitar" data-obquitar="'+p.k+'">Quitar</button></div>'; /* Fase 10 · Rediseño · Brief 13c */
  return h+'</div>';
}
function renderObFam(){
  var box=document.getElementById('obFam'); if(!box) return;
  var h='<div class="ob-fam-g"><div class="wgt-lbl">Tú</div></div>'+obFamTuHTML(obPeople[0]);
  var filas='';
  obPeople.forEach(function(p,i){ if(!p.me && obEnFam(p)) filas+=obFamFilaHTML(p, i); }); /* Fase 10 · Rediseño · Brief 13c: quien no se agregó no tiene fila */
  h+='<div class="ob-fam-g"><div class="wgt-lbl">Tu familia <span class="ob-opc">Opcional</span></div></div>';
  if(filas) h+='<div class="det-grp ob-fam-grp">'+filas+'</div>';
  /* Fase 10 · Rediseño · Brief 13c: cada toque agrega a la siguiente persona de la historia; sin nadie más, desaparece */
  if(!obAgregados.length && !obFamQuito) h+='<p class="ob-gnote">Así sé de quién es cada documento que traigas.</p>'; /* Fase 11 · Brief 08b: el motivo, solo con el botón "Agregar a mi familia" */
  if(obSiguiente()) h+='<button type="button" class="btn-s ob-add-b" data-obadd="1">'+OB_PLUS+(obFamQuito ? 'Agregar a alguien' : 'Agregar a mi familia')+'</button>'; /* Fase 11 · Brief 08 */
  box.innerHTML=h;
  var btn=document.getElementById('obNext');
  if(btn && obStep===3) btn.toggleAttribute('disabled', !obReady());
  renderRelSheet();
}

/* Fase 6 · menú de Parentesco a pantalla completa (misma hoja que el resto del prototipo) */
function renderRelSheet(){
  var sheet=document.getElementById('obRelSheet'); if(!sheet) return;
  var rt=document.getElementById('obRelTitle');
  /* Fase 11 · Brief 02: sale la rama de la detección (la relación); la hoja queda solo para la EPS */
  /* Fase 10 · Brief 15: la misma hoja, con las EPS */
  if(obEpsMenu && obPeople[0]){
    var me=obPeople[0], he='';
    OB_EPS.concat(['Otra']).forEach(function(r){ he+='<button type="button" class="m3i'+(me.eps===r?' sel':'')+'" data-obepspick="'+r+'">'+r+'</button>'; });
    if(me.eps==='Otra') he+='<div class="m3-other"><input type="text" data-obf="epsOtro" data-obi="0" placeholder="¿Cuál es?" value="'+(me.epsOtro||'').replace(/"/g,'&quot;')+'"></div>';
    if(rt) rt.textContent='¿Cuál es tu EPS?';
    document.getElementById('obRelList').innerHTML=he;
    sheet.style.display='flex';
    return;
  }
  sheet.style.display='none'; /* Fase 11 · Brief 02: sale la relación del paso 3 (y obRelListHTML) */
}

/* Fase 10 · Brief 30: lo que comparten la tarjeta del paso 3 (en #ob) y la de «Agregar familiar» (#I1, data-obi="f").
   obP() da la persona. Fase 11 · Brief 02: sale obCardRepaint() */
function obP(i){ return i==='f' ? famForm : obPeople[+i]; }
/* Fase 11 · Brief 02: sale obCardClick() (relación y "No sé la fecha exacta" del paso 3 y de #I1) */
ob.addEventListener('click', function(e){
  if(e.target.closest('#obAccGoogle')){ obCuentaLista(true); return; }
  if(e.target.closest('#obAccMail')){
    document.getElementById('obMailInput').value = obMailDraft || fx('{mail}');
    document.getElementById('obMailErr').style.display='none';
    document.getElementById('obMailInput').classList.remove('err');
    cuentaVista='mail'; obCuentaView(); return;
  }
  if(e.target.closest('#obCodeSim')){ cuentaCode=true; obCuentaView(); return; }
  if(e.target.closest('#obCodeResend')) return; /* "Reenviar" no hace nada nuevo en la demo */
  if(e.target.closest('#obCodeChange')){ cuentaVista='mail'; cuentaCode=false; obCuentaView(); return; }
  /* Fase 10 · Rediseño · Brief 13c: agregar a la siguiente persona de la historia / quitarla (vuelve a "no agregada") */
  /* Fase 11 · Brief 02: la fila nueva llega con su campo "Nombre" abierto */
  if(e.target.closest('[data-obadd]')){
    /* Fase 11 · Brief 08: el primer toque agrega a toda la historia; tras "Quitar", agrega a la siguiente */
    var sg=obSiguiente(); if(!sg) return;
    if(obFamQuito){ obAgregados.push(sg.k); obEditIx=obPeople.indexOf(sg); renderObFam(); var ni=document.getElementById('obNm'+obEditIx); if(ni) ni.focus(); }
    else{ var nx; while((nx=obSiguiente())) obAgregados.push(nx.k); obEditIx=-1; renderObFam(); var lp=document.querySelector('[data-obedit]'); if(lp) lp.focus(); }
    return;
  }
  var qb=e.target.closest('[data-obquitar]');
  if(qb){
    obAgregados=obAgregados.filter(function(k){ return k!==qb.getAttribute('data-obquitar'); }); obEditIx=-1; obFamQuito=true; renderObFam(); /* Fase 11 · Brief 08 */
    var ab=document.querySelector('[data-obadd]'); if(ab) ab.focus();
    return;
  }
  /* Fase 11 · Brief 02: el lápiz abre o cierra el nombre en su fila */
  var eb=e.target.closest('[data-obedit]');
  if(eb){
    var ei=+eb.getAttribute('data-obedit'); obEditIx = obEditIx===ei ? -1 : ei; renderObFam();
    var ef = obEditIx>=0 ? document.getElementById('obNm'+obEditIx) : document.querySelector('[data-obedit="'+ei+'"]'); if(ef) ef.focus();
    return;
  }
  /* Fase 10 · Brief 15: "Tu EPS" */
  if(e.target.closest('[data-obeps]')){ obEpsMenu=!obEpsMenu; renderObFam(); return; }
  var epb=e.target.closest('[data-obepspick]');
  if(epb){
    var me0=obPeople[0], ev=epb.getAttribute('data-obepspick');
    me0.eps=ev;
    if(ev!=='Otra'){ me0.epsOtro=''; obEpsMenu=false; }
    renderObFam();
    if(ev==='Otra'){ var oi0=document.querySelector('[data-obf="epsOtro"]'); if(oi0) oi0.focus(); }
    else { var eb0=document.querySelector('[data-obeps]'); if(eb0) eb0.focus(); }
    return;
  }
  if(e.target.closest('.m3-other')) return; /* Fase 10 · Brief 43. Fase 11 · Brief 02: sale la relación de la detección */
  var scanBtn=e.target.closest('[data-obscan]');
  if(scanBtn){
    if(scanBtn.classList.contains('soon')){ otraOpen(); return; } /* Fase 10 · Brief 18: "En otras historias" */
    if(scanBtn.getAttribute('data-done') || scanBtn.disabled) return;
    obScanActive=true;
    obScanSource=scanBtn.getAttribute('data-obscan');
    ob.classList.add('hidden');
    show(obScanSource==='gal' ? 'GAL' : 'CAM');
    return;
  }
  /* Fase 10 · Rediseño · Brief 13: "Buscar en tu bandeja" abre su pantalla dentro del paso 4 (antes era una hoja) */
  if(e.target.closest('#obMail')){
    if(document.getElementById('obMail').getAttribute('data-done')) return;
    obBandeja=true; obShow(4);
    return;
  }
  if(e.target.id==='obRelSheet'){
    obEpsMenu=false; renderObFam(); return;
  }
});
function obMailValida(v){ return (v||'').indexOf('@')>-1; }
ob.addEventListener('input', function(e){
  if(e.target.id==='obMailInput'){
    var v=e.target.value;
    var mbtn=document.getElementById('obNext'); /* Fase 10 · Rediseño · Brief 13: "Enviarme el código" */
    var merr=document.getElementById('obMailErr');
    var mok = obMailValida(v);
    if(mbtn) mbtn.toggleAttribute('disabled', !mok);
    if(merr) merr.style.display = (v.trim() && !mok) ? 'flex' : 'none';
    e.target.classList.toggle('err', !!(v.trim() && !mok));
    return;
  }
  /* Fase 10 · Brief 43: sale el campo "Otro" de la detección (data-detotro) */
  obCardInput(e); /* Fase 10 · Brief 30: lo comparte #I1 */
});
function obCardInput(e){
  var f=e.target.getAttribute('data-obf'); if(!f) return;
  var i=e.target.getAttribute('data-obi'), p=obP(i); if(!p) return;
  p[f]=e.target.value; /* Fase 11 · Brief 02: sale la fecha (y la edad aproximada) del paso 3 y de #I1 */
  var hd;
  if(i==='f'){ famListo(); hd=document.querySelector('#I1 .pcard'); } /* Fase 10 · Brief 30 */
  else {
    var btn=document.getElementById('obNext');
    if(btn && obStep===3) btn.toggleAttribute('disabled', !obReady()); /* Fase 10 · Rediseño · Brief 13: paso 3 */
    hd=document.querySelector('#obFam [data-obrow="'+i+'"]'); /* Fase 11 · Brief 02: la fila de la persona (tu tarjeta no tiene encabezado) */
  }
  if(hd){ var nm=hd.querySelector('.pcard-nm, .card-title'), av=hd.querySelector('.av');
    if(nm) nm.textContent = p.nm.trim() || 'Sin nombre';
    if(av) av.textContent = obIni(p); }
}
/* Fase 11 · Brief 02: sale obCardFocusout() (validaba la fecha del paso 3 y de #I1) */
/* ============================================================
   Fase 10 · Brief 30 · AGREGAR FAMILIAR (#I1)
   Agrega la siguiente persona de la historia que no está en la familia, con la tarjeta del paso 3 (obCardHTML) y sus
   manejadores (obCardInput, con data-obi="f"; Fase 11 · Brief 02: solo el nombre). famForm vive solo mientras se está en #I1: cada entrada
   empieza de cero. Si el correo ya estaba conectado, ofrece guardar lo que Taremi vio de esa persona y dejó fuera (#scrimFamDocs)
   ============================================================ */
var famForm=null, famToast=null, famOferta=null; /* Fase 11 · Brief 02: sale famMenu (la hoja de relación de #I1) */
function famSiguiente(){ var l=['SF','MT','MA'].filter(function(k){ return SLOTS.indexOf(k)>=0 && personaFuera(k); }); return l[0]||null; }
function famReady(){ var p=famForm; return !!p && !!p.nm.trim(); } /* Fase 11 · Brief 02: solo el nombre */
function famListo(){ var b=document.getElementById('faAdd'); if(b) b.toggleAttribute('disabled', !famReady()); }
function famFormInit(){ var k=famSiguiente(); famForm = k ? obPersonaDe(k) : null; }
function renderFamForm(){
  var box=document.getElementById('faBody'); if(!box) return;
  box.innerHTML = famForm ? obCardHTML(famForm, 'f', {pre:'fa', quitar:false}) : '';
  famListo();
}
/* lo que Taremi vio en el correo de esa persona y obFinish() dejó fuera de DOCS (sin el carné que la detección excluyó) */
function docMismo(a,b){ return a.ep===b.ep && a.t===b.t && a.ty===b.ty && a.s===b.s; }
function famDocsFuera(k){
  if(esPropia() || !mailConnected) return [];
  var sl=detSlot(k);
  return DOCS0.filter(function(d){ return detSlot(fx(d.p))===sl && !detCarneFuera(d) && !DOCS.some(function(x){ return docMismo(x,d); }); });
}
/* trámites de esa persona que se revelan con sus documentos, como en obFinish() con el correo */
var FAM_TRAM=['ped','cir','med','ter','lip']; /* Fase 11 · Brief 01b */
function famTram(k){ var sl=detSlot(k); return FAM_TRAM.map(card).filter(function(c){ return c && detSlot(fx(c.av))===sl; }); }
function famAgregar(){
  if(!famReady()) return;
  var p=famForm, k=p.k;
  if(obAgregados.indexOf(k)<0) obAgregados.push(k);
  if(DETECT[k]) DETECT[k].fuera=false; /* "No es de mi familia" se limpia */
  var cambio=false, set=function(key,val){ if(V[key]!==val){ V[key]=val; cambio=true; } };
  obPersonaEscribe(p, set); /* Fase 11 · Brief 01: sin nivel */
  var nom=V['p'+OB_N[k]], docs=famDocsFuera(k);
  DOCS_PEND=DOCS_PEND.filter(function(d){ return detSlot(fx(d.p))!==detSlot(k); }); /* Fase 10 · Brief 40: ya no están sin organizar */
  famForm=null;
  /* sin sus documentos guardados no tiene trámites: lo que el correo del FAB dejó en accionable vuelve a oculto */
  if(docs.length) famTram(k).forEach(function(c){ if(c.st==='accionable') c.st='oculto'; });
  else famToast='Agregué a '+nom+' a tu familia.';
  if(cambio) repaintStatic();
  refrescarPersonas(); paintChips(); renderBoveda(); renderCalendario(); renderNotif();
  show('FAM');
  if(docs.length){
    famOferta={k:k, docs:docs};
    document.getElementById('famDocsTitle').textContent='Encontré documentos de '+nom+' en tu correo';
    document.getElementById('famDocsSub').textContent='Los vi cuando revisé tu correo. No los guardé porque '+nom+' todavía no estaba en tu familia.';
    var fl=document.getElementById('famDocsList'), fp=fx(docs[0].p); /* Fase 10 · Brief 46: la fila de la Bóveda, sin tocar y sin línea (solo el punto) */
    fl.style.setProperty('--pc', PCOL[fp]||'');
    fl.innerHTML=fx(docs.map(function(d){ return docRowHTML(d, false, true, true); }).join(''));
    document.getElementById('scrimFamDocs').style.display='flex';
  }
}
function famDocsCerrar(){ famOferta=null; document.getElementById('scrimFamDocs').style.display='none'; buildFamLists(); }
function famDocsNo(){ if(!famOferta) return; famToast='Agregué a '+V['p'+OB_N[famOferta.k]]+' a tu familia.'; famDocsCerrar(); }
function famDocsSi(){
  if(!famOferta) return;
  var k=famOferta.k, nom=V['p'+OB_N[k]], add=[];
  /* vuelven desde DOCS0 en su orden original: cada una antes del siguiente documento de DOCS0 que ya esté en DOCS */
  famOferta.docs.forEach(function(d){
    var c=JSON.parse(JSON.stringify(d)), at=-1, i0=DOCS0.indexOf(d);
    for(var j=i0+1; j<DOCS0.length && at<0; j++){ for(var m=0; m<DOCS.length; m++) if(docMismo(DOCS[m], DOCS0[j])){ at=m; break; } }
    if(at<0) DOCS.push(c); else DOCS.splice(at, 0, c);
    add.push(c);
  });
  bovMarcarNuevos(add);
  /* sus trámites, solo los que sigan ocultos (Fase 11 · Brief 01: sin nivel) */
  famTram(k).forEach(function(c){ if(c.st==='oculto' && personaVisible(c)) c.st='accionable'; });
  appVacia=false;
  famToast='Guardé '+add.length+' documentos de '+nom+' en la Bóveda.';
  renderInicio(); renderBoveda(); renderCalendario(); renderNotif();
  famDocsCerrar();
}
document.getElementById('I1').addEventListener('click', function(e){
  if(e.target.closest('#faAdd')) famAgregar();
});
document.getElementById('I1').addEventListener('input', obCardInput); /* Fase 11 · Brief 02: sale #faRelSheet */
document.getElementById('scrimFamDocs').addEventListener('click', function(e){
  if(e.target.closest('[data-famdocs="si"]')){ famDocsSi(); return; }
  if(e.target.closest('[data-famdocs="no"]') || e.target.id==='scrimFamDocs'){ e.stopPropagation(); famDocsNo(); }
});

/* Fase 6 · correo reusa el mismo mecanismo de pantallas que cámara/galería — una sola función marca cualquiera de los tres orígenes */
function markObDone(){
  var cardId, txtId;
  if(obMailActive){ cardId='obMail'; txtId='obMailTxt'; }
  else { cardId = obScanSource==='gal' ? 'obUploadCard' : 'obScanCard'; txtId = obScanSource==='gal' ? 'obUploadTxt' : 'obScanTxt'; }
  var c=document.getElementById(cardId), t=document.getElementById(txtId);
  if(!c||!t) return;
  c.setAttribute('data-done','1');
  c.style.borderColor='var(--r-exito)'; c.style.background='var(--r-exito-suave)';
  var msg = obMailActive
    ? 'Guardé todo lo que encontré en tu correo ✓' /* Fase 11 · Brief 02 */ /* Fase 10 · Rediseño · Brief 13 · Brief 16: en la propia historia también encuentra la orden */ /* Fase 10 · Rediseño · Brief 13 */
    : 'Guardé todo lo que escaneaste ✓';
  t.innerHTML='<h5 style="color:var(--r-exito);">'+msg+'</h5>';
}
obShow(0);

/* Fase Móvil · Punto 1: el panel externo (selector de perfil, saltos a flujos, Modo presentación,
   goTrabado()/goNegado()) se quitó del todo — lo que resolvía ahora vive en el onboarding (1a),
   Configuración (1b) y los chips "Simular" del hilo de autorización (1c, ver ACT.cir.simEstancado
   y ACT.cir.simNegado más abajo). */
function resetObCards(){
  var defs=[
    /* Fase 11 · Brief 02: textos de las fichas, sin "No la comparto con nadie" */
    ['obMail','obMailTxt','<h5>Buscar en mi correo</h5><p>Encuentro lo que tu EPS te ha enviado.</p>'], /* Fase 10 · Rediseño · Brief 13 */
    ['obScanCard','obScanTxt','<h5>Escanear una orden</h5><p>Le tomas una foto al papel.</p>'], /* Fase 10 · Brief 39: sin «cifrada» */
    ['obUploadCard','obUploadTxt','<h5>Subir un PDF o una foto</h5><p>Si ya lo tienes en el celular.</p>']
  ];
  defs.forEach(function(d){
    var card=document.getElementById(d[0]), txt=document.getElementById(d[1]);
    if(!card) return;
    card.removeAttribute('data-done'); card.style.borderColor=''; card.style.background='';
    if(txt) txt.innerHTML=d[2];
    /* Fase 10 · Brief 15: en la propia historia, Escanear y Subir aún no traen nada propio */
    var tg=card.querySelector('.tag-soon'); if(tg) tg.remove();
    var soon=esPropia() && d[0]!=='obMail';
    card.disabled=false; card.classList.toggle('soon', soon); /* Fase 10 · Brief 18: se pueden tocar; abren #scrimOtra */
    if(soon) card.insertAdjacentHTML('beforeend','<span class="tag-soon">En otras historias</span>');
  });
}
function resetDemo(){
  for(var ka in AVISOS_ON0) AVISOS_ON[ka]=AVISOS_ON0[ka]; /* Fase 11 · Brief 06e */
  clearTimers();
  CARDS = JSON.parse(JSON.stringify(CARDS0));
  /* Fase 10 · Brief 16: el control de la propia historia escribe p, CITA.ped y QLLEVAR.ped; el reinicio los devuelve */
  for(var qk in QLLEVAR0) QLLEVAR[qk]=JSON.parse(JSON.stringify(QLLEVAR0[qk])); /* Fase 10 · Brief 21 (corrección 2) */
  CITA.ped=JSON.parse(JSON.stringify(CITA_PED0)); QLLEVAR.ped=JSON.parse(JSON.stringify(QLLEVAR_PED0)); proPend=null;
  for(var k in THREADS0){ THREADS[k].msgs=[]; THREADS[k].started=false; THREADS[k].sub=THREADS0[k].sub; THREADS[k].p=THREADS0[k].p; THREADS[k].seen=0; } /* Fase 10 · Brief 06: seen */
  cursoOpen=false; calDaySel=null; /* Fase 10 · Brief 06 */
  notifFrom=null; /* Fase 10 · Rediseño · Brief 12 */
  pendingToast=null; pendingToastKey=null; undoSnap=null; freshConfirmKey=null; vi=0; chatInput.value=''; micMode(); bovReset();
  DRAFTS={}; SIMUSED={}; /* Fase 10 · Brief 02b */ probPanelClose(); /* Fase 10 · Brief 21 */ keepShots=false; tipSeen=false; bovFresh=false; bovFolder=null; /* Fase 10 · corrección Bóveda */ BOVNEW={}; bovAviso=null; /* Fase 10 · Brief 19 */ resetCam();
  /* Fase 10 · Brief 01: fases y estados nuevos vuelven con CARDS0; aquí se quitan los resultados agregados y la grabación */
  DOCS=JSON.parse(JSON.stringify(DOCS0)); ordScanKey=null; citaGrabStop();
  if(esPropia()) DOCS=[]; /* Fase 10 · Brief 15: la propia historia arranca (y reinicia) sin documentos ni consultas */
  setOffline(false); failOnce=false; loadFail=false; lastSlot=null;
  obScanActive=false; obScanSource=null; obScanDone=false; obMailActive=false; mailConnected=false; mailRevisado=null; camUsada=false; micUsado=false; cfgToast=null; /* Fase 10 · Brief 48 */ appVacia=false; tourSeen=false; PICON={}; if(tourStep>=0){ tourClose(true); tourSeen=false; } A1_ULT={}; /* Fase 10 · Brief 08e */
  /* Fase 10 · Rediseño · Brief 13: un reinicio vuelve a la bienvenida sin cuenta y con la familia de la historia */
  cuentaMail=null; cuentaGoogle=false; cuentaVista='ini'; cuentaCode=false; obMailDraft=''; obBandeja=false; obPeople=[]; obEditIx=-1; obAgregados=[]; obAcepto=false; /* Fase 10 · Rediseño · Brief 13c. Fase 11 · Brief 02: obAcepto */
  /* Fase 8 · Brief 6.1: reiniciar la bandera y el toast del correo desde el FAB */
  fabMailActive=false; pendingNote=null;
  /* Fase 6 · reinicia también las ediciones visuales de sesión de I3 */
  /* Fase 8 · Reauditoría Yifrah: i3EditOrig es estado nuevo, también se reinicia aquí */
  PROFILE_EDITS={}; i3Editing=false; i3Edit=null; i3EditOrig=null;
  /* Fase 10 · Brief 03: la detección vuelve a empezar (DOCS ya se restauró desde DOCS0 arriba) y Pegar texto queda vacío */
  DETECT={}; detOk=false; detDupe=null; DOCS_PEND=[]; obReabre=null; obReabreSnap=null; /* Fase 10 · Brief 40 */ DOCS_BANDEJA=[]; fabPend=false; /* Fase 10 · Brief 45 */ SCAN_IDS=null; scanPend=false; FIN_ULT={}; /* Fase 10 · Brief 47 */ pegPend=false; pegPendPrev=null; /* Fase 10 · Brief 47b */ obHecho=false; lastMain='A1'; /* Fase 10 · Brief 45b: también para "Cambiar de historia" (verHistorias → resetDemo) */ OB_NAC=JSON.parse(JSON.stringify(PROFILES[PROF].nac||{})); /* Fase 10 · Rediseño · Brief 13b: OB_NAC (corrección 2: vuelve a las fechas de la historia) */ OB_APROX={}; OB_NIVEL={}; /* Fase 10 · Brief 18 */ detEvAbre={}; /* Fase 11 · Brief 02 (sale detMenuId) */ pegReset();
  /* Fase 8 · Estructura 1: deshace también lo que propagateI3Edit ya escribió en V, y refresca
     PNAME/INIT — sin esto "Reiniciar demo" dejaba nombres/parentescos/edades editados. buildFamLists()
     hace falta aparte: a diferencia de A1/F1/G1/I3, show('FAM') no vuelve a pintar esa pantalla sola
     (ver show()), así que sin esto Familia se quedaba con el nombre viejo hasta la próxima edición o
     cambio de perfil. */
  V=JSON.parse(JSON.stringify(PROFILES[PROF].v)); buildPeople(); buildFamLists();
  var rs=document.getElementById('i3RelSheet'); if(rs) rs.style.display='none';
  famForm=null; famToast=null; famOferta=null; /* Fase 10 · Brief 30 */
  ['scrimFamDocs'].forEach(function(id){ var e=document.getElementById(id); if(e) e.style.display='none'; });
  var ct=document.getElementById('confTip'); if(ct) ct.style.display='flex';
  resetObCards();
  var ob17=document.querySelector('[data-flow="off"]'); if(ob17) ob17.textContent='17 · Sin conexión';
  renderInicio();
  ob.classList.remove('hidden'); obShow(0);
}


/* ---------- cambio de perfil de datos ---------- */
var STASH={};
function stashStatic(){
  screens.forEach(function(x){ if(x.id!=='A1'&&x.id!=='TH'&&x.id!=='G1'&&x.id!=='I3') STASH['s_'+x.id]=x.innerHTML; });
  ['scrimWho','scrimDocs'].forEach(function(k){
    var e=document.getElementById(k); if(e) STASH['h_'+k]=e.innerHTML;
  });
  STASH.hiloTitle=hiloTitle.textContent;
  screens.forEach(function(x){
    STASH['t_'+x.id]=x.getAttribute('data-title')||'';
    STASH['u_'+x.id]=x.getAttribute('data-sub')||'';
  });
}
/* Fase 10 · Rediseño · Brief 13: sale de applyProfile() para que los nombres editados en "Empecemos por ti" lleguen también a las pantallas fijas */
function repaintStatic(){
  screens.forEach(function(x){
    if(STASH['s_'+x.id]!==undefined && x.id!=='A1' && x.id!=='TH' && x.id!=='G1' && x.id!=='I3'){
      x.innerHTML=fx(STASH['s_'+x.id]);
    }
    if(STASH['t_'+x.id]) x.setAttribute('data-title', STASH['t_'+x.id]);
    if(STASH['u_'+x.id]) x.setAttribute('data-sub', STASH['u_'+x.id]);
  });
  ['scrimWho','scrimDocs'].forEach(function(k){
    var e=document.getElementById(k); if(e && STASH['h_'+k]!==undefined) e.innerHTML=fx(STASH['h_'+k]);
  });
  hiloTitle.textContent=fx(STASH.hiloTitle);
  paintChips();
}
function applyProfile(key){
  if(!PROFILES[key]) return;
  clearTimers();
  /* Fase 8 · Estructura 1: copia profunda — si no, editar en I3 (PROFILE_EDITS → V) corrompía
     PROFILES[key].v de forma permanente, mismo patrón que ya usa CARDS=JSON.parse(JSON.stringify(CARDS0)) */
  PROF=key; V=JSON.parse(JSON.stringify(PROFILES[key].v));
  buildPeople();
  repaintStatic();
  buildFamLists();
  /* Fase 8 · Brief 6.3: "Familia" decía "4 perfiles" fijo en cualquier perfil — ahora usa el conteo real de SLOTS */
  var famSec=document.getElementById('FAM');
  if(famSec){
    var nfam='Toca a alguien para editar sus datos.'; /* Fase 10 · Brief 03b: sin contar personas, igual en las tres historias */
    famSec.setAttribute('data-sub', nfam);
    if(cur==='FAM') tSub.textContent=nfam;
  }
  obPeople=[]; obEditIx=-1; /* Fase 10 · Rediseño · Brief 13: obFamInit() la llena al crear la cuenta */
  resetDemo();
  paintAvatars(document);
  var lbl=document.getElementById('profLabel');
  if(lbl){ lbl.textContent=PROFILES[key].label; }
  [].forEach.call(document.querySelectorAll('[data-prof]'), function(b){
    b.classList.toggle('cur', b.getAttribute('data-prof')===key);
  });
}

/* Fase 8 · Esqueleto 1: accesibilidad de teclado en las 14 hojas/diálogos — foco al abrir, trampa de foco
   con Tab, Escape cierra igual que el botón neutro/Cerrar, y el foco vuelve a quien abrió la hoja.
   Selector .sheet-scrim, .alert-scrim, .m3menu: scrimExit usa .alert-scrim (Fase 6, AlertDialog), no
   .sheet-scrim como las demás — sin incluirla quedaría fuera de la trampa de foco y del cierre con Escape. */
function initA11yDialogs(){
  var dialogs = [].slice.call(document.querySelectorAll('.sheet-scrim, .alert-scrim, .m3menu'));
  var lastTrigger=null;

  dialogs.forEach(function(d, i){
    d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true');
    var h=d.querySelector('h3,h4');
    if(h){ if(!h.id) h.id='a11yTtl'+i; d.setAttribute('aria-labelledby', h.id); }

    new MutationObserver(function(){
      var open = getComputedStyle(d).display!=='none';
      if(open){
        lastTrigger=document.activeElement;
        var f=d.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if(f) f.focus();
      } else if(lastTrigger && document.body.contains(lastTrigger)){
        lastTrigger.focus(); lastTrigger=null;
      }
    }).observe(d, {attributes:true, attributeFilter:['style']});
  });

  document.addEventListener('keydown', function(e){
    var open = dialogs.filter(function(d){ return getComputedStyle(d).display!=='none'; });
    if(!open.length) return;
    var d=open[open.length-1];

    if(e.key==='Escape'){
      /* i3RelSheet/obRelSheet reconstruyen su disparador (innerHTML) al cerrar, así que el nodo que
         tenía lastTrigger ya no existe cuando el observer intenta devolver el foco: se re-enfoca a mano
         con un selector estable en vez de depender del MutationObserver genérico. */
      if(d.id==='i3RelSheet'){
        d.style.display='none'; renderI3();
        var t1=document.querySelector('[data-i3relopen]'); if(t1) t1.focus();
      } else if(d.id==='obRelSheet' && obEpsMenu){
        /* Fase 10 · Brief 15: la hoja de la EPS */
        obEpsMenu=false; renderObFam();
        var t4=document.querySelector('[data-obeps]'); if(t4) t4.focus();
      } else if(d.id==='scrimFamDocs'){ famDocsNo(); /* Fase 10 · Brief 30: como «Ahora no» */
      } else closeSheets();
      return;
    }
    if(e.key==='Tab'){
      var f=[].slice.call(d.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(function(el){ return !el.disabled && el.offsetParent!==null; });
      if(!f.length) return;
      var first=f[0], last=f[f.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    }
  });
}

/* Fase 8 · Garrett: SVG decorativos (ícono junto a texto visible) ocultos al lector de pantalla.
   No toca los que ya llevan aria-label propio (ej. icon-btn) ni los que ya tienen aria-hidden.
   MutationObserver cubre pantallas/hojas que se renderizan después del arranque. */
function initDecorativeSvgA11y(){
  function maybeHide(s){ if(!s.hasAttribute('aria-label') && !s.hasAttribute('aria-hidden')) s.setAttribute('aria-hidden','true'); }
  function sweep(node){
    if(node.tagName==='svg' || node.tagName==='SVG') maybeHide(node);
    if(node.querySelectorAll) node.querySelectorAll('svg').forEach(maybeHide);
  }
  sweep(document);
  new MutationObserver(function(muts){
    muts.forEach(function(m){ m.addedNodes.forEach(function(n){ if(n.nodeType===1) sweep(n); }); });
  }).observe(document.body, {childList:true, subtree:true});
}

/* arranque */
buildPeople(); stashStatic(); applyProfile('sonia');
renderInicio(); show('A1'); paintAvatars(document);
initA11yDialogs();
initDecorativeSvgA11y();
})();
