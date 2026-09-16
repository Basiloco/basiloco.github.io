const Q="modulepreload",J=function(n){return"/"+n},O={},K=function(e,l,s){let r=Promise.resolve();if(l&&l.length>0){let u=function(o){return Promise.all(o.map(f=>Promise.resolve(f).then(x=>({status:"fulfilled",value:x}),x=>({status:"rejected",reason:x}))))};document.getElementsByTagName("link");const t=document.querySelector("meta[property=csp-nonce]"),p=t?.nonce||t?.getAttribute("nonce");r=u(l.map(o=>{if(o=J(o),o in O)return;O[o]=!0;const f=o.endsWith(".css"),x=f?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${o}"]${x}`))return;const d=document.createElement("link");if(d.rel=f?"stylesheet":Q,f||(d.as="script"),d.crossOrigin="",d.href=o,p&&d.setAttribute("nonce",p),document.head.appendChild(d),f)return new Promise((h,y)=>{d.addEventListener("load",h),d.addEventListener("error",()=>y(new Error(`Unable to preload CSS for ${o}`)))})}))}function v(u){const t=new Event("vite:preloadError",{cancelable:!0});if(t.payload=u,window.dispatchEvent(t),!t.defaultPrevented)throw u}return r.then(u=>{for(const t of u||[])t.status==="rejected"&&v(t.reason);return e().catch(v)})},Z=`
  precision highp float;
  uniform sampler2D tA; uniform sampler2D tB;
  uniform vec2 uResA; uniform vec2 uResB; uniform vec2 uRes;
  uniform float uMix; uniform float uTime; uniform float uGrain; uniform float uVel; uniform float uFade; uniform vec3 uBg;
  uniform float uDriftA; uniform float uDriftB; uniform float uCalm;
  uniform vec3 uRip[10];
  uniform vec2 uMouse;
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  vec2 cover(vec2 uv, vec2 res){
    float sa = uRes.x / uRes.y, ia = res.x / res.y;
    vec2 s = sa > ia ? vec2(1.0, ia / sa) : vec2(sa / ia, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2 uv = vUv;
    float asp = uRes.x / uRes.y;
    float t = uTime * 0.22;

    // swell: the water is never still
    vec2 d = vec2(
      sin(uv.y * 5.0 + t) * 0.0035 + sin(uv.y * 19.0 - t * 1.4 + uv.x * 3.0) * 0.0012,
      cos(uv.x * 4.0 + t * 0.7) * 0.0035 + cos(uv.x * 23.0 + t * 1.1) * 0.0008
    ) * (1.0 - uCalm * 0.6);

    // ripples where you touched
    for (int i = 0; i < 10; i++) {
      vec3 r = uRip[i];
      if (r.z < 0.0) continue;
      vec2 dd = (uv - r.xy) * vec2(asp, 1.0);
      float dist = length(dd);
      float wave = sin(dist * 48.0 - r.z * 7.0) * exp(-dist * 5.5) * exp(-r.z * 1.1) * 0.014;
      d += normalize(dd + 1e-5) * wave;
    }
    // the lens of the cursor
    vec2 dm = (uv - uMouse) * vec2(asp, 1.0);
    float md = length(dm);
    d += normalize(dm + 1e-5) * smoothstep(0.32, 0.0, md) * 0.009;
    // scroll drags the image
    d.y += uVel * 0.025;

    vec2 uvA = cover((uv - 0.5) * (1.0 - uDriftA * 0.07) + 0.5, uResA) + d;
    vec2 uvB = cover((uv - 0.5) * (1.0 - uDriftB * 0.07) + 0.5, uResB) + d;
    vec3 a = texture2D(tA, uvA).rgb;
    vec3 b = texture2D(tB, uvB).rgb;
    // slight chromatic split at the edges, like a lens under water
    float edge = smoothstep(0.25, 0.7, distance(uv, vec2(0.5)));
    a.r = texture2D(tA, uvA + d * 0.22 * edge).r; b.r = texture2D(tB, uvB + d * 0.22 * edge).r;

    // dissolve through the water: the next image surfaces where the water is thinnest
    float n = noise(uv * 3.0 + vec2(t * 0.35, -t * 0.2)) * 0.6 + noise(uv * 9.0 - t * 0.5) * 0.4;
    float m = smoothstep(0.0, 1.0, clamp(uMix * 1.6 - n * 0.6, 0.0, 1.0));
    vec3 c = mix(a, b, m);

    // caustics: light through moving water
    float ca = pow(max(0.0, sin(uv.x * 18.0 + t * 2.1 + noise(uv * 4.0) * 3.0) * sin(uv.y * 13.0 - t * 1.6)), 7.0) * 0.07;
    c += ca;

    // grade: warm shadows, slightly lifted blacks, muted highs
    c = pow(c, vec3(1.06, 1.0, 0.94));
    c = mix(c, c * vec3(1.06, 0.98, 0.9), 0.4);
    c = c * 0.92 + 0.02;

    // vignette, grain, fade-in
    float vg = smoothstep(1.0, 0.3, distance(uv, vec2(0.5)) * 1.15);
    c *= mix(0.5, 1.0, vg);
    float g = hash(uv * uRes + fract(uTime) * 61.0) - 0.5;
    c += g * uGrain;
    c = mix(uBg, c, uFade);
    gl_FragColor = vec4(c, 1.0);
  }
`,ee=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches,te=()=>{try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}},ne=n=>n<.5?4*n*n*n:1-Math.pow(-2*n+2,3)/2;async function oe(n){if(!te())return document.documentElement.classList.add("no-gl"),null;const e=await K(()=>import("./three.module.Bx43vjkH.js"),[]),l=ee(),s=new e.WebGLRenderer({canvas:n,antialias:!1,powerPreference:"high-performance"});s.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));const r=new e.Scene,v=new e.OrthographicCamera(-1,1,1,-1,0,1),u=new e.DataTexture(new Uint8Array([14,12,11,255]),1,1);u.needsUpdate=!0;const t={tA:{value:u},tB:{value:u},uResA:{value:new e.Vector2(1,1)},uResB:{value:new e.Vector2(1,1)},uRes:{value:new e.Vector2(1,1)},uMix:{value:0},uTime:{value:0},uGrain:{value:l?.02:.045},uVel:{value:0},uFade:{value:0},uBg:{value:{x:.965,y:.945,z:.914}},uDriftA:{value:0},uDriftB:{value:0},uCalm:{value:0},uRip:{value:Array.from({length:10},()=>new e.Vector3(0,0,-1))},uMouse:{value:new e.Vector2(-9,-9)}},p=new e.ShaderMaterial({uniforms:t,vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }",fragmentShader:Z,depthTest:!1,depthWrite:!1});r.add(new e.Mesh(new e.PlaneGeometry(2,2),p));const o=()=>{const i=window.innerWidth,a=window.innerHeight;s.setSize(i,a,!1),t.uRes.value.set(i,a)};o(),window.addEventListener("resize",o);const f=new e.TextureLoader,x=i=>new Promise(a=>f.load(i,m=>{m.colorSpace=e.SRGBColorSpace,m.minFilter=e.LinearFilter,m.generateMipmaps=!1,a(m)},void 0,()=>a(null)));let d=[],h=0,y=0,M=-1,B=-1,A=0,S=0;const C=()=>{if(!d.length)return;const i=d[Math.min(h,d.length-1)],a=d[Math.min(h+1,d.length-1)];t.tA.value=i.tex,t.uResA.value.set(i.w,i.h),t.tB.value=a.tex,t.uResB.value.set(a.w,a.h),t.uMix.value=ne(y)},E=[];let D=0;const G=i=>{const a=i.clientX/window.innerWidth,m=1-i.clientY/window.innerHeight;t.uMouse.value.set(a,m);const _=performance.now();_-D>90&&!l&&(E.push({x:a,y:m,t0:_}),E.length>10&&E.shift(),D=_)},V=i=>{const a=i.clientX/window.innerWidth,m=1-i.clientY/window.innerHeight;E.push({x:a,y:m,t0:performance.now()-1}),E.length>10&&E.shift()};window.addEventListener("pointermove",G,{passive:!0}),window.addEventListener("pointerdown",V,{passive:!0});const X=new e.Clock;let k=0;const j=performance.now(),F=()=>{k=requestAnimationFrame(F);const i=performance.now();t.uTime.value=X.getElapsedTime(),t.uFade.value=Math.min(1,(i-j)/2400),t.uVel.value+=(A-t.uVel.value)*.08,A*=.9,t.uCalm.value+=(S-t.uCalm.value)*.05,t.uDriftA.value=.5+.5*Math.sin(t.uTime.value*.08+h),t.uDriftB.value=.5+.5*Math.sin(t.uTime.value*.08+h+1);for(let a=0;a<10;a++){const m=E[a];m?t.uRip.value[a].set(m.x,m.y,(i-m.t0)/1e3):t.uRip.value[a].set(0,0,-1)}for(let a=E.length-1;a>=0;a--)i-E[a].t0>4e3&&E.splice(a,1);(h!==M||y!==B)&&(C(),M=h,B=y),s.render(r,v)};F(),n.classList.add("is-live");const z={async setPhotos(i){d=(await Promise.all(i.map(x))).map(m=>m?{tex:m,w:m.image.width,h:m.image.height}:{tex:u,w:1,h:1}),M=-1,C()},go(i,a){h=Math.max(0,Math.min(i,Math.max(0,d.length-1))),y=Math.max(0,Math.min(1,a))},pin(i,a){z.go(i,a),C(),s.render(r,v)},velocity(i){A=Math.max(-1,Math.min(1,i))},calm(i){S=i},current(){return{index:h,blend:y}},dispose(){cancelAnimationFrame(k),window.removeEventListener("resize",o),window.removeEventListener("pointermove",G),window.removeEventListener("pointerdown",V),s.dispose()}};return z}let c=null,R=null,q=!1;function ae(){c=new AudioContext,R=c.createGain(),R.gain.value=0,R.connect(c.destination);const n=c.sampleRate*4,e=c.createBuffer(2,n,c.sampleRate);for(let d=0;d<2;d++){const h=e.getChannelData(d);let y=0,M=0,B=0;for(let A=0;A<n;A++){const S=Math.random()*2-1;y=.99765*y+S*.099,M=.963*M+S*.2965,B=.57*B+S*1.0526,h[A]=(y+M+B+S*.1848)*.11}}const l=c.createBufferSource();l.buffer=e,l.loop=!0;const s=c.createBiquadFilter();s.type="lowpass",s.frequency.value=420,s.Q.value=.6;const r=c.createOscillator();r.type="sine",r.frequency.value=.055;const v=c.createGain();v.gain.value=260,r.connect(v).connect(s.frequency);const u=c.createGain();u.gain.value=.5,l.connect(s).connect(u).connect(R);const t=c.createOscillator();t.type="sine",t.frequency.value=52;const p=c.createOscillator();p.type="sine",p.frequency.value=78.2;const o=c.createGain();o.gain.value=.16;const f=c.createOscillator();f.type="sine",f.frequency.value=.09;const x=c.createGain();x.gain.value=.08,f.connect(x).connect(o.gain),t.connect(o),p.connect(o),o.connect(R),l.start(),r.start(),t.start(),p.start(),f.start()}function Y(){c||ae(),c.resume(),R.gain.cancelScheduledValues(c.currentTime),R.gain.linearRampToValueAtTime(.9,c.currentTime+2.5),q=!0;try{localStorage.setItem("gb-sound","1")}catch{}}function ie(){if(!(!c||!R)){R.gain.cancelScheduledValues(c.currentTime),R.gain.linearRampToValueAtTime(0,c.currentTime+1.2),q=!1;try{localStorage.setItem("gb-sound","0")}catch{}}}const P=()=>q,re=()=>{try{return localStorage.getItem("gb-sound")==="1"}catch{return!1}},b=document.getElementById("scene");let g=null,T=null,w=[],U=0,W=0;const H=async()=>{const n=document.querySelector("[data-film]");w=n?[...n.querySelectorAll("[data-scene]")]:[],T=w.length?n:null;const e=document.querySelector("main[data-photo]");g&&(T?(await g.setPhotos(w.map(l=>l.dataset.scene)),g.calm(0)):e?.dataset.photo?(await g.setPhotos([e.dataset.photo]),g.calm(.6)):await g.setPhotos([]),I())},I=()=>{if(!g||!b)return;const n=performance.now(),e=window.scrollY-U,l=Math.max(16,n-W);if(g.velocity(e/l*.6),U=window.scrollY,W=n,T&&w.length){const s=window.innerHeight;let r=0;for(let o=0;o<w.length;o++)w[o].getBoundingClientRect().top<=s*.5&&(r=o);const v=w[r].getBoundingClientRect();let u=Math.min(1,Math.max(0,(s*.5-v.top-v.height*.55)/(v.height*.45)));r>=w.length-1&&(u=0),g.go(r,u),w.forEach((o,f)=>o.classList.toggle("is-on",f===r&&u<.75)),w.forEach((o,f)=>o.classList.toggle("is-viz",f===r&&u<.75&&o.getBoundingClientRect().top<=s*.12));const t=w[r].hasAttribute("data-light")&&u<.5||w[r+1]?.hasAttribute("data-light")&&u>=.5;document.documentElement.classList.toggle("is-light",!!t),document.documentElement.classList.toggle("is-deep",window.scrollY>s*.3);const p=T.getBoundingClientRect().bottom;b.style.opacity=String(Math.min(1,Math.max(0,p/(s*.6))))}else{const s=1-Math.min(1,Math.max(0,(window.scrollY-window.innerHeight*.1)/(window.innerHeight*.7)));b.style.opacity=String(s);const r=!!document.querySelector("main[data-photo][data-light]")&&s>.35;document.documentElement.classList.toggle("is-light",r)}},$=()=>{document.querySelectorAll("[data-sound]").forEach(n=>{if(n.dataset.bound)return;n.dataset.bound="1";const e=()=>{const l=n.querySelector("[data-sound-label]");l&&(l.textContent=P()?"on":"off"),n.setAttribute("aria-pressed",String(P()))};n.addEventListener("click",()=>{P()?ie():Y(),e()}),e()})};if(re()){const n=()=>{Y(),document.querySelectorAll("[data-sound-label]").forEach(e=>e.textContent="on"),document.querySelectorAll("[data-sound]").forEach(e=>e.setAttribute("aria-pressed","true")),window.removeEventListener("pointerdown",n),window.removeEventListener("keydown",n)};window.addEventListener("pointerdown",n),window.addEventListener("keydown",n)}const L=document.getElementById("cursor");if(L&&window.matchMedia("(hover: hover)").matches&&!L.__on){L.__on=!0;let n=-100,e=-100,l=-100,s=-100;window.addEventListener("pointermove",v=>{l=v.clientX,s=v.clientY},{passive:!0}),document.addEventListener("pointerover",v=>{L.classList.toggle("is-link",!!v.target.closest("a, button, [role=button]"))});const r=()=>{n+=(l-n)*.18,e+=(s-e)*.18,L.style.transform=`translate(${n}px, ${e}px)`,requestAnimationFrame(r)};r(),document.documentElement.classList.add("has-cursor")}async function N(){!b||b.__booted||(b.__booted=!0,g=await oe(b),g&&(b.__water=g,window.addEventListener("scroll",I,{passive:!0}),await H(),$()))}document.addEventListener("astro:page-load",()=>{b?.__booted?(H(),$()):N()});N();
