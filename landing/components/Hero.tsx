"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { useLang } from "@/context/LangContext";

/* ── Magnetic hook ───────────────────────────────────── */
function useMag(str=0.28) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x,{stiffness:300,damping:20}), sy = useSpring(y,{stiffness:300,damping:20});
  return {
    ref, sx, sy,
    onMouseMove(e:React.MouseEvent){const r=ref.current?.getBoundingClientRect();if(!r)return;x.set((e.clientX-r.left-r.width/2)*str);y.set((e.clientY-r.top-r.height/2)*str);},
    onMouseLeave(){x.set(0);y.set(0);},
  };
}

/* ── Letters ─────────────────────────────────────────── */
const lv = {
  hidden:{opacity:0,y:60,rotateX:-80,filter:"blur(14px)"},
  visible:(i:number)=>({opacity:1,y:0,rotateX:0,filter:"blur(0px)",transition:{delay:0.32+i*0.034,duration:0.75,ease:[0.16,1,0.3,1]}}),
};

/* ── Phone mockup ────────────────────────────────────── */
function Phone() {
  return (
    <div style={{width:278,height:570,borderRadius:52,background:"linear-gradient(165deg,#18293a,#0c1b28)",border:"1px solid rgba(255,255,255,0.09)",boxShadow:"0 50px 120px rgba(0,0,0,0.65)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:100,height:28,background:"#0c1b28",borderRadius:"0 0 20px 20px",zIndex:20}}/>
      <div style={{position:"absolute",top:8,left:0,right:0,display:"flex",justifyContent:"space-between",padding:"0 28px",fontSize:9,color:"rgba(255,255,255,0.2)",fontWeight:500,zIndex:21}}>
        <span>9:41</span><span>●●● ▌</span>
      </div>
      <div style={{position:"absolute",inset:0,paddingTop:40,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"12px 20px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <p style={{color:"rgba(255,255,255,0.3)",fontSize:10,fontWeight:500}}>Добро пожаловать</p>
            <p style={{color:"white",fontWeight:700,fontSize:15,letterSpacing:"-0.02em"}}>HamshiraGo</p>
          </div>
          <div style={{width:36,height:36,borderRadius:12,background:"linear-gradient(135deg,#0d9488,#0891b2)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900,fontSize:16,boxShadow:"0 4px 12px rgba(13,148,136,0.3)"}}>+</div>
        </div>
        <div style={{margin:"0 20px 16px",padding:"10px 16px",borderRadius:16,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:10}}>
          <span style={{color:"rgba(255,255,255,0.25)",fontSize:14}}>🔍</span>
          <span style={{color:"rgba(255,255,255,0.25)",fontSize:13}}>Поиск услуг...</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"0 20px",marginBottom:16}}>
          {[
            {color:"#0d9488",d:"M18 2l4 4M14.5 5.5l4 4M11 7l6 6M6.8 11.8L3 21l4-1 9.2-9.2M9 14l-5 5M14 9l2-2",nm:"Укол",pr:"80 000"},
            {color:"#0891b2",d:"M12 2.69l5.66 5.66a8 8 0 11-11.31 0z",nm:"Капельница",pr:"150 000"},
            {color:"#7c3aed",d:"M22 12 18 12 15 21 9 3 6 12 2 12",isPolyline:true,nm:"Давление",pr:"50 000"},
            {color:"#059669",d:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22v-10h6v10",nm:"Уход",pr:"200 000"},
          ].map(({color,d,isPolyline,nm,pr})=>(
            <div key={nm} style={{padding:"10px 12px",borderRadius:16,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:6}}>
                {isPolyline ? <polyline points={d}/> : <path d={d}/>}
              </svg>
              <p style={{color:"white",fontSize:12,fontWeight:600,lineHeight:1.2}}>{nm}</p>
              <p style={{color:"#0d9488",fontSize:10}}>от {pr}</p>
            </div>
          ))}
        </div>
        <div style={{margin:"0 20px",flex:1,borderRadius:16,overflow:"hidden",position:"relative",background:"linear-gradient(135deg,#0d1f2d,#091a2a)",border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{position:"absolute",inset:0,opacity:0.14,backgroundImage:"linear-gradient(rgba(13,148,136,1) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,1) 1px,transparent 1px)",backgroundSize:"20px 20px"}}/>
          <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}} viewBox="0 0 200 120" preserveAspectRatio="none">
            <motion.path d="M40,90 Q80,50 120,40 Q150,30 165,30" fill="none" stroke="rgba(13,148,136,0.35)" strokeWidth="2" strokeDasharray="4 3"
              initial={{pathLength:0}} animate={{pathLength:1}} transition={{duration:2,delay:1,ease:"easeInOut"}}/>
          </svg>
          <div style={{position:"absolute",top:"22%",right:"18%"}}>
            <motion.div animate={{scale:[1,2.5],opacity:[0.5,0]}} transition={{duration:2,repeat:Infinity}}
              style={{position:"absolute",inset:-4,borderRadius:"50%",background:"#0d9488"}}/>
            <div style={{width:16,height:16,borderRadius:"50%",background:"#0d9488",boxShadow:"0 0 12px rgba(13,148,136,0.8)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"white"}}/>
            </div>
          </div>
          <div style={{position:"absolute",bottom:12,left:12,right:12,padding:"8px 12px",borderRadius:12,background:"rgba(10,20,30,0.85)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <p style={{color:"rgba(255,255,255,0.4)",fontSize:9}}>Медик едет к вам</p>
                <p style={{color:"#0d9488",fontSize:12,fontWeight:700}}>~12 минут</p>
              </div>
              <span style={{color:"rgba(255,255,255,0.25)",fontSize:10}}>●●●</span>
            </div>
          </div>
        </div>
        <div style={{height:20}}/>
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────── */
export default function Hero() {
  const { t } = useLang();
  const sRef = useRef<HTMLElement>(null);

  // Mouse → normalized [-0.5, 0.5]
  const mx = useMotionValue(0), my = useMotionValue(0);
  const smx = useSpring(mx,{stiffness:45,damping:18,mass:0.8});
  const smy = useSpring(my,{stiffness:45,damping:18,mass:0.8});

  // 3 depth layers
  const bX=useTransform(smx,[-0.5,0.5],[-10,10]), bY=useTransform(smy,[-0.5,0.5],[-7,7]);
  const tX=useTransform(smx,[-0.5,0.5],[-18,18]), tY=useTransform(smy,[-0.5,0.5],[-12,12]);
  const pX=useTransform(smx,[-0.5,0.5],[-35,35]), pY=useTransform(smy,[-0.5,0.5],[-24,24]);
  const rX=useTransform(smy,[-0.5,0.5],[4,-4]),   rY=useTransform(smx,[-0.5,0.5],[-5,5]);

  // Scroll fade
  const { scrollYProgress } = useScroll({ target: sRef, offset: ["start start","end start"] });
  const sOp=useTransform(scrollYProgress,[0,0.45],[1,0]);
  const sSc=useTransform(scrollYProgress,[0,0.45],[1,0.88]);

  const b1=useMag(0.24), b2=useMag(0.24);
  const t1=t.hero.title1, t2=t.hero.title2;

  return (
    <section ref={sRef}
      onMouseMove={e=>{const r=sRef.current?.getBoundingClientRect();if(!r)return;mx.set((e.clientX-r.left)/r.width-0.5);my.set((e.clientY-r.top)/r.height-0.5);}}
      onMouseLeave={()=>{mx.set(0);my.set(0);}}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{background:"radial-gradient(ellipse 100% 80% at 50% -5%, var(--hero-from) 0%, var(--hero-to) 65%)"}}>

      {/* Single subtle orb — top center */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{position:"absolute",width:900,height:700,top:-280,left:"50%",transform:"translateX(-50%)",borderRadius:"50%",background:"radial-gradient(ellipse, rgba(13,148,136,0.12) 0%, transparent 65%)"}}/>
      </div>

      {/* Scroll wrapper */}
      <motion.div style={{opacity:sOp,scale:sSc}} className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-28 pb-20">

        {/* 3D scene */}
        <div style={{perspective:"1400px"}}>
          <motion.div style={{rotateX:rX,rotateY:rY,transformStyle:"preserve-3d"}}
            className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Text — depth 1 */}
            <motion.div style={{x:tX,y:tY}}>
              <motion.div initial={{opacity:0,y:18,filter:"blur(6px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}}
                transition={{duration:0.65,delay:0.08,ease:[0.16,1,0.3,1]}}
                className="inline-flex items-center gap-2 mb-7 px-4 py-2 rounded-full text-xs font-bold uppercase"
                style={{background:"rgba(13,148,136,0.1)",border:"1px solid rgba(13,148,136,0.25)",color:"#0d9488",letterSpacing:"0.14em"}}>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"/>
                {t.hero.badge}
              </motion.div>

              <div style={{perspective:"600px",marginBottom:4}}>
                <h1 className="font-black tracking-tight" style={{fontSize:"clamp(40px,5.5vw,76px)",lineHeight:1.05,color:"var(--text-primary)"}}>
                  {t1.split(" ").map((word,wi)=>(
                    <span key={wi} style={{display:"inline-block",whiteSpace:"nowrap"}}>
                      {word.split("").map((ch,ci)=>(
                        <motion.span key={ci} custom={t1.split(" ").slice(0,wi).join(" ").length+ci} variants={lv} initial="hidden" animate="visible"
                          style={{display:"inline-block"}}>{ch}</motion.span>
                      ))}
                      {wi < t1.split(" ").length-1 && <span style={{display:"inline-block"}}>&nbsp;</span>}
                    </span>
                  ))}
                </h1>
              </div>
              <div style={{perspective:"600px",marginBottom:28}}>
                <h1 className="font-black tracking-tight grad-text-anim" style={{fontSize:"clamp(40px,5.5vw,76px)",lineHeight:1.05}}>
                  {t2.split(" ").map((word,wi)=>(
                    <span key={wi} style={{display:"inline-block",whiteSpace:"nowrap"}}>
                      {word.split("").map((ch,ci)=>(
                        <motion.span key={ci} custom={t1.length+t2.split(" ").slice(0,wi).join(" ").length+ci} variants={lv} initial="hidden" animate="visible"
                          style={{display:"inline-block"}}>{ch}</motion.span>
                      ))}
                      {wi < t2.split(" ").length-1 && <span style={{display:"inline-block"}}>&nbsp;</span>}
                    </span>
                  ))}
                </h1>
              </div>

              <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:1.25,duration:0.7}}
                style={{color:"var(--text-3)",fontSize:18,lineHeight:1.7,letterSpacing:"-0.01em",maxWidth:480,marginBottom:36}}>
                {t.hero.subtitle}
              </motion.p>

              {/* CTA buttons */}
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:1.45,duration:0.65}}
                className="flex flex-wrap gap-3 mb-10">
                <motion.a ref={b1.ref} href="#download" style={{x:b1.sx,y:b1.sy,background:"var(--text-primary)",boxShadow:"0 8px 32px var(--shadow),0 2px 8px rgba(0,0,0,0.2)",color:"var(--bg2)"}}
                  onMouseMove={b1.onMouseMove} onMouseLeave={b1.onMouseLeave}
                  className="flex items-center gap-3 px-6 py-4 rounded-2xl font-bold">
                  <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 814 1000" fill="currentColor">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49.8 188.4-49.8zM518.1 163.4c-35.3 41.6-98.1 71.9-158.2 71.9-8.3 0-16.6-.9-24.9-2.6C361.1 127.4 441.2 58 508.2 17c38.5-23.9 101.9-43.3 158.2-43.3 1.3 0 2.6 0 3.9.1-2.6 66.3-38.5 131.9-52.2 143.6z"/>
                  </svg>
                  <div>
                    <p style={{fontSize:10,opacity:0.5,fontWeight:400,lineHeight:1}}>{t.download.appStore.sub}</p>
                    <p style={{fontSize:15,fontWeight:900,lineHeight:1.3}}>App Store</p>
                  </div>
                </motion.a>

                <motion.a ref={b2.ref} href="#download"
                  style={{x:b2.sx,y:b2.sy,background:"var(--card-bg)",border:"1px solid var(--card-border-strong)",backdropFilter:"blur(16px)",color:"var(--text-primary)"}}
                  onMouseMove={b2.onMouseMove} onMouseLeave={b2.onMouseLeave}
                  className="flex items-center gap-3 px-6 py-4 rounded-2xl font-bold">
                  <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M3 20.5L14 12 3 3.5V20.5Z" fill="#4CAF50"/>
                    <path d="M14 12L3 3.5L16.5 8.75L14 12Z" fill="#1976D2"/>
                    <path d="M14 12L3 20.5L16.5 15.25L14 12Z" fill="#FF5722"/>
                    <path d="M16.5 8.75L14 12L16.5 15.25L21 12L16.5 8.75Z" fill="#FFC107"/>
                  </svg>
                  <div>
                    <p style={{fontSize:10,opacity:0.5,fontWeight:400,lineHeight:1}}>{t.download.googlePlay.sub}</p>
                    <p style={{fontSize:15,fontWeight:900,lineHeight:1.3}}>Google Play</p>
                  </div>
                </motion.a>
              </motion.div>

              {/* Social proof */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.9}}
                className="flex items-center gap-3">
                {["👩‍⚕️","👨‍⚕️","👩‍⚕️"].map((em,i)=>(
                  <div key={i} style={{width:36,height:36,borderRadius:"50%",background:"var(--card-bg)",border:"2px solid var(--hero-to)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,marginLeft:i>0?-8:0}}>{em}</div>
                ))}
                <div style={{width:1,height:16,background:"var(--card-border-strong)",margin:"0 4px"}}/>
                <p style={{fontSize:14,color:"var(--text-4)"}}>
                  <span style={{color:"var(--text-primary)",fontWeight:600}}>500+</span> {t.stats[0].label}
                </p>
              </motion.div>
            </motion.div>

            {/* Phone — depth 2 (foreground) */}
            <motion.div style={{x:pX,y:pY}} className="hidden lg:flex justify-center items-center">
              <motion.div initial={{opacity:0,x:80,rotateY:-25,filter:"blur(24px)"}}
                animate={{opacity:1,x:0,rotateY:0,filter:"blur(0px)"}}
                transition={{delay:0.65,duration:1.4,ease:[0.16,1,0.3,1]}} className="relative">
                <div style={{position:"absolute",inset:-40,borderRadius:60,background:"radial-gradient(ellipse, rgba(13,148,136,0.13), transparent 70%)",filter:"blur(30px)"}}/>
                <motion.div animate={{y:[0,-18,0],rotateZ:[-1,1,-1]}} transition={{duration:6,repeat:Infinity,ease:"easeInOut"}}>
                  <Phone/>
                </motion.div>
                {/* Chips */}
                <motion.div animate={{y:[0,-10,0]}} transition={{duration:3.5,repeat:Infinity,delay:0.3}}
                  style={{position:"absolute",right:-64,top:64,padding:"10px 14px",borderRadius:16,background:"rgba(13,148,136,0.12)",border:"1px solid rgba(13,148,136,0.3)",backdropFilter:"blur(16px)",boxShadow:"0 8px 24px rgba(0,0,0,0.3)",whiteSpace:"nowrap"}}>
                  <span style={{color:"#14b8a6",fontSize:13,fontWeight:700}}>⚡ 30 мин</span>
                </motion.div>
                <motion.div animate={{y:[0,10,0]}} transition={{duration:4.2,repeat:Infinity,delay:1}}
                  style={{position:"absolute",left:-68,bottom:176,padding:"10px 14px",borderRadius:16,background:"var(--card-bg)",border:"1px solid var(--card-border)",backdropFilter:"blur(16px)",boxShadow:"0 8px 24px var(--shadow)",whiteSpace:"nowrap"}}>
                  <p style={{color:"var(--text-4)",fontSize:10}}>Рейтинг</p>
                  <p style={{color:"var(--text-primary)",fontWeight:700,fontSize:14}}>4.8 ⭐</p>
                </motion.div>
                <motion.div animate={{y:[0,-8,0]}} transition={{duration:3,repeat:Infinity,delay:2}}
                  style={{position:"absolute",right:-56,bottom:112,padding:"8px 12px",borderRadius:12,background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)",backdropFilter:"blur(16px)"}}>
                  <span style={{color:"#34d399",fontSize:12,fontWeight:700}}>✓ Верифицирован</span>
                </motion.div>
              </motion.div>
            </motion.div>

          </motion.div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:2.5}}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.2em",color:"var(--text-5)"}}>{t.hero.scroll}</p>
        <motion.div animate={{y:[0,10,0]}} transition={{duration:1.8,repeat:Infinity}}
          style={{width:1,height:40,background:"linear-gradient(to bottom, rgba(13,148,136,0.5), transparent)"}}/>
      </motion.div>
    </section>
  );
}
