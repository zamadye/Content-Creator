// Original vector choreography for four review scenes. All state is a function of t.
const C={bg:'#081e26',ink:'#102e37',edge:'#31545b',mint:'#abe1c7',paper:'#fff3d9',amber:'#f2c473',red:'#d97c69',dim:'#87a2a5'};
const n=Number(document.body.dataset.scene), durations={2:16,3:30,14:24,18:19};
const clamp=x=>Math.min(1,Math.max(0,x));
const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
const cue=(t,a,b)=>ease((t-a)/(b-a));
const lerp=(a,b,p)=>a+(b-a)*p;
const f=x=>Number(x.toFixed(3));
const group=(content,transform='',opacity=1)=>`<g transform="${transform}" opacity="${f(clamp(opacity))}">${content}</g>`;
const line=(x1,y1,x2,y2,color=C.edge,width=3)=>`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const path=(d,color=C.mint,width=5,progress=1,more='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f(1-clamp(progress))}" ${more}/>`;
const text=(s,x,y,size=30,color=C.paper,more='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${more}>${s}</text>`;
const center=(s,x,y,size=30,color=C.paper,more='')=>text(s,x,y,size,color,`text-anchor="middle" ${more}`);
const label=(s,x,y,color=C.dim)=>text(s,x,y,18,color,'letter-spacing="3" font-weight="600"');
const rect=(x,y,w,h,fill=C.ink,stroke='none',r=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,r=6,fill=C.mint)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const defs=`<defs><linearGradient id="stone" x1="0" x2="1"><stop stop-color="#367174"/><stop offset=".28" stop-color="#84b6aa"/><stop offset=".32" stop-color="#93c3b3"/><stop offset="1" stop-color="#447a7b"/></linearGradient><linearGradient id="cap" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d8dbbf"/><stop offset="1" stop-color="#799f95"/></linearGradient><radialGradient id="light"><stop stop-color="#20505b" stop-opacity=".55"/><stop offset="1" stop-color="#081e26" stop-opacity="0"/></radialGradient><pattern id="blueprint" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" stroke="#a1cfc4" stroke-opacity=".035" fill="none"/></pattern><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L9 5 1 9" fill="none" stroke="context-stroke" stroke-width="1.6"/></marker></defs>`;
const bg=()=>`${defs}${rect(0,0,1920,1080,C.bg)}<ellipse cx="980" cy="490" rx="950" ry="620" fill="url(#light)"/>${rect(0,0,1920,1080,'url(#blueprint)')}`;
const folio=(section)=>`${label('KNOT THEORY',88,68)}${text(section,1832,68,18,C.dim,'text-anchor="end" letter-spacing="2"')}`;
const mast=(small,big,sub='')=>`${label(small,88,135,C.mint)}${text(big,84,205,59,C.paper,'font-weight="700" letter-spacing="-2"')}${sub?text(sub,88,251,24,C.dim):''}`;
const foot=(s,opacity=1)=>group(`${line(88,937,1832,937,C.edge,1)}${text(s,88,988,28,C.paper)}`,'',opacity);
const xs=[460,710,960,1210,1460];

function column(x,missing=0,stress=0){
  const y=missing*325;
  return group(`<path d="M-45 410H45L35 745H-35Z" fill="${stress>.7?C.red:'url(#stone)'}" stroke="#a7c7b6" stroke-width="2"/>${rect(-60,392,120,23,'url(#cap)')}${rect(-56,742,112,22,'url(#cap)')}${line(-22,430,-18,727,'#b1d8c4',3)}${line(13,430,11,727,'#315e63',2)}`,
    `translate(${x} ${f(y)}) rotate(${f(missing*6)} 0 500)`,1-missing);
}
function structure({missing=0,stress=0,settle=0,crack=0,transfer=0,load=0,t=0,meters=false}={}){
  const brace=settle*8;
  let out=`<ellipse cx="980" cy="800" rx="720" ry="35" fill="#020f15" opacity=".48"/>
    <path d="M282 360L350 322H1580L1640 360V396H282Z" fill="#45666a" stroke="#91b5a9" stroke-width="2"/>
    <path d="M282 360H1640V398H282Z" fill="url(#cap)"/>
    ${line(322,379,1600,379,'#e7e5c9',2)}`;
  // The support disappears; the remaining columns keep their original positions.
  out+=xs.map((x,i)=>column(x,i===2?missing:0,(i===1||i===3)?stress:0)).join('');
  out+=`<path d="M285 773H1640L1695 812H235Z" fill="#264951" stroke="#547c7d" stroke-width="2"/>${line(285,773,1640,773,'#8bb5a8',3)}`;
  if(missing>.8) out+=path('M915 748H1005',C.dim,2,1,'stroke-dasharray="5 9"');
  if(load>0) xs.forEach((x,i)=>{out+=group(path(`M${x} 278V344`,C.amber,5,load,'marker-end="url(#arrow)"'),'',i===2?1-missing:1)});
  if(transfer>0){
    out+=path('M955 416Q955 472 720 473V530',C.amber,6,transfer,'marker-end="url(#arrow)"');
    out+=path('M965 416Q965 472 1200 473V530',C.amber,6,transfer,'marker-end="url(#arrow)"');
  }
  out+=path('M970 363L950 375 975 388 959 399',C.red,4,crack);
  if(crack>.5) out+=path('M718 430L699 470 721 492 698 536 716 565',C.red,4,(crack-.5)*2);
  if(meters){
    xs.forEach((x,i)=>{
      const amount=i===2?lerp(.45,0,missing):lerp(.44,(i===1||i===3)?.91:.6,stress);
      const color=amount>.8?C.red:amount>.6?C.amber:C.mint;
      out+=rect(x-44,837,88,5,C.edge)+rect(x-44,837,88*amount,5,color);
      out+=center(i===2?'KOSONG':amount>.8?'BATAS':'BEBAN',x,875,14,i===2?C.dim:color,'letter-spacing="2"');
    });
  }
  return group(out,`translate(0 ${f(brace)})`);
}

function pillars(t){
  const missing=cue(t,5.8,7), transfer=cue(t,8.2,10.7);
  // One short decaying reaction to the removal, never a permanent shaking loop.
  const after=t-7, reaction=after>0?Math.exp(-after*2.8)*Math.sin(after*13):0;
  const state=t<5.8?'SETIAP PILAR MENOPANG BEBAN':t<10.7?'SATU PENOPANG HILANG':'BEBAN BERPINDAH KE PENOPANG LAIN';
  const shot=cue(t,0,2)*.025;
  return `${folio('01 / STRUKTUR')}${mast('EKSPERIMEN VISUAL','Kalau satu pilar hilang?')}
    ${group(structure({missing,load:cue(t,.9,2.2),transfer,t}),`translate(960 540) scale(${f(1+shot)}) translate(-960 -540) translate(0 ${f(reaction*5)})`)}
    ${group(`${center('RUANG KOSONG',960,665,18,C.dim,'letter-spacing="2"')}${line(960,685,960,728,C.dim,2)}`,'',cue(t,7.3,8.1)*(1-cue(t,10.5,11.4)))}
    ${group(`${text('Belum tentu.',88,866,62,C.mint,'font-weight="700" letter-spacing="-2"')}`,'',cue(t,12,12.7))}
    ${foot(state)}`;
}

function loads(t){
  const transfer=cue(t,1,4), stress=cue(t,11,19), crack=cue(t,19.5,23.5);
  const titles=t<5?'Ke mana bebannya pergi?':t<11?'Penopang lain mengambil alih.':t<19?'Ada batas kemampuan.':t<25?'Kerusakan bisa merambat.':'Lihat cara seluruh sistem bekerja.';
  const focus=cue(t,11,14)*.08-cue(t,24,27)*.08;
  let content=structure({missing:1,transfer,stress,crack,meters:true,t});
  // The loading paths develop once; no decorative moving dashes.
  content+=group(`${path('M710 530V718',stress>.7?C.red:C.amber,8,stress)}${path('M1210 530V718',stress>.7?C.red:C.amber,8,stress)}`,'',cue(t,6,7));
  const graph=cue(t,25,28.5);
  const pts=[[460,510],[710,410],[960,555],[1210,410],[1460,510]];
  const network=pts.map(([x,y],i)=>`${i?path(`M${pts[i-1][0]} ${pts[i-1][1]}L${x} ${y}`,C.mint,3,graph):''}${dot(x,y,14,C.mint)}`).join('');
  return `${folio('02 / DISTRIBUSI BEBAN')}${mast('LOAD REDISTRIBUTION',titles)}
    ${group(content,`translate(960 540) scale(${f(1+focus)}) translate(-960 -540)`,1-graph)}
    ${group(`${network}${center('KOMPONEN TERHUBUNG DALAM SATU STRUKTUR',960,732,26,C.dim)}`,'',graph)}
    ${foot(t<11?'ILUSTRASI PRINSIP · panjang indikator bukan data rekayasa':t<25?'Penggantian komponen saja belum menjelaskan sumber gangguan.':'Dari satu pilar, ke hubungan antarkomponen.')}`;
}

function institution(x,y,name,scale=1){
  return group(`<path d="M-125 0L0-60 125 0Z" fill="#45686b" stroke="#a4c6b5" stroke-width="3"/>${rect(-120,0,240,20,'url(#cap)')}${[-85,-28,28,85].map(px=>`${rect(px-9,22,18,105,'url(#stone)')}`).join('')}${rect(-138,128,276,20,'url(#cap)')}${center(name,0,195,25,C.paper,'font-weight="600"')}`,`translate(${x} ${y}) scale(${scale})`);
}
function candidate(x,y,which){
  return group(`${dot(0,-31,25,C.mint)}<path d="M-45 56V27a45 45 0 0 1 90 0V56Z" fill="#527e7c" stroke="#a8cbb9" stroke-width="2"/>${center(which,0,97,20,C.dim)}`,`translate(${x} ${y})`);
}
function constitution(t){
  const nominate=cue(t,3.2,7), elect=cue(t,8,12.2), calendar=cue(t,13.5,16), conclusion=cue(t,20,22);
  const nomineeAlpha=cue(t,4.2,5.6), gridAlpha=cue(t,12,13);
  let grid='';
  for(let i=0;i<60;i++){
    const appear=cue(t,13+(i%10)*.045+Math.floor(i/10)*.11,13.5+(i%10)*.045+Math.floor(i/10)*.11);
    grid+=group(rect(1140+(i%10)*24,720+Math.floor(i/10)*18,17,11,C.mint),'',appear);
  }
  return `${folio('03 / MEKANISME KONSTITUSI')}${mast('PASAL 8 AYAT (2)','Jika terjadi kekosongan Wapres.','Bagan ilustratif · urutan mekanisme, bukan dokumentasi peristiwa')}
    ${institution(335,445,'PRESIDEN')}
    ${path('M488 498H716',C.amber,4,nominate,'marker-end="url(#arrow)"')}
    ${group(`${candidate(845,475,'CALON 1')}${candidate(1035,475,'CALON 2')}`,'',nomineeAlpha)}
    ${group(`${center('Dua calon diusulkan',940,687,25,C.mint)}${center('oleh Presiden',940,723,25,C.mint)}`,'',nomineeAlpha)}
    ${path('M1150 498H1375',C.amber,4,elect,'marker-end="url(#arrow)"')}
    ${group(institution(1560,445,'MPR MEMILIH'),'',cue(t,7.5,8.5))}
    ${group(`${line(1120,680,1670,680,C.edge,1)}${text('Paling lambat',1428,752,22,C.dim)}${text('60 hari',1425,811,51,C.paper,'font-weight="700"')}${text('untuk bersidang',1428,845,21,C.dim)}`,'',gridAlpha)}${grid}
    ${group(`${rect(80,916,1760,100,C.bg)}${text('Mekanisme tetap berjalan.',88,984,46,C.mint,'font-weight="600"')}`,'',conclusion)}
    ${group(foot('Presiden mengusulkan dua calon. MPR bersidang untuk memilih.'),'',1-conclusion)}`;
}

function wheel(x,y,rotation){
  return group(`<circle r="67" fill="#07151c" stroke="#658e8e" stroke-width="6"/><circle r="39" fill="#1c3c46" stroke="#b9d2bf" stroke-width="3"/>${[0,60,120].map(a=>group(line(-32,0,32,0,C.dim,5),`rotate(${a})`)).join('')}${dot(0,0,9,C.amber)}`,`translate(${x} ${y}) rotate(${f(rotation)})`);
}
function car(t){
  const swap=cue(t,2,5), travel=cue(t,5.8,8.3), reveal=cue(t,8.8,10.5), heat=cue(t,11,16), repair=cue(t,16.2,18.2);
  const zoom=1+reveal*.23, pan=-reveal*100;
  const oldPart=group(`${rect(1270,476,70,76,C.red,C.paper,5)}${line(1285,492,1325,536,C.paper,3)}`,`translate(0 ${f(-swap*175)})`,1-swap);
  const newPart=group(`${rect(1270,476,70,76,C.mint,C.paper,5)}${line(1285,515,1297,529,C.ink,3)}${line(1297,529,1326,498,C.ink,3)}`,`translate(0 ${f(-175*(1-swap))})`,swap);
  const gaugeColor=heat>.55?C.red:C.amber;
  let body=`<path d="M370 568L446 430Q468 400 510 400H1030L1170 478H1430Q1490 478 1510 538L1545 630V696H355V609Q355 580 370 568Z" fill="#173b46" stroke="#82b4ad" stroke-width="4"/>
    <path d="M510 426H994L1092 486H473Z" fill="#0a212c" stroke="#597d82" stroke-width="3"/>
    ${line(740,425,740,680,C.edge,3)}${line(1022,502,1022,679,C.edge,3)}${rect(790,521,44,6,C.mint)}
    ${wheel(560,690,travel*160)}${wheel(1320,690,travel*160)}${line(320,765,1590,765,C.edge,2)}`;
  const under=`${rect(1110,488,338,145,'#0a202a',C.edge,12)}${rect(1129,512,105,98,'#24414b',C.mint,6)}
    ${[0,1,2,3,4,5].map(i=>line(1143+i*15,522,1143+i*15,600,C.dim,2)).join('')}
    ${path('M1235 530H1260V577H1400V530H1350',heat>.6?C.red:C.mint,7,1)}
    ${rect(1357,565,27,24,C.bg)}${line(1360,570,1381,585,C.red,4)}${line(1360,585,1381,570,C.red,4)}
    ${oldPart}${newPart}
    ${path('M1236 530H1260V577H1335',C.amber,5,cue(t,10.8,12.6),'marker-end="url(#arrow)"')}
    ${group(`${path('M1140 489Q1154 457 1140 430',C.red,3,heat)}${path('M1167 489Q1181 457 1167 430',C.red,3,heat)}${path('M1195 489Q1209 457 1195 430',C.red,3,heat)}`,'',heat)}`;
  body+=group(under,'',cue(t,.5,1.4));
  const tip=t<5.8?'SATU KOMPONEN DIGANTI':t<10.5?'MOBIL BISA BERJALAN LAGI':t<16?'TETAPI ALIRAN PENDINGIN MASIH TERPUTUS':'PERIKSA AKAR MASALAHNYA';
  return `${folio('04 / ANALOGI SISTEM')}${mast('MENGGANTI ≠ MEMPERBAIKI','Komponen baru. Gangguan yang sama?')}
    ${group(body,`translate(${f(pan)} ${f(-reveal*5)}) translate(960 540) scale(${f(zoom)}) translate(-960 -540)`)}
    ${group(`${line(790,837,1070,837,C.edge,8)}${line(790,837,790+280*heat,837,gaugeColor,8)}${text('TEMPERATUR',790,884,19,C.dim,'letter-spacing="3"')}${text('ALIRAN TERPUTUS',1680,884,21,C.red,'text-anchor="end"')}${path('M1645 845V625H1390',C.red,2,heat)}`,'',reveal)}
    ${group(`${text('Penggantian tidak membuka jalur yang tersumbat.',88,318,25,C.mint)}`,'',repair)}
    ${foot(tip)}`;
}

const stage=document.querySelector('#stage');
const draw={2:pillars,3:loads,14:constitution,18:car};
window.film={duration:durations[n],width:1920,height:1080,frame(t){
  t=Math.max(0,Math.min(durations[n],t));
  stage.innerHTML=bg()+draw[n](t);
}};
// Initial meaningful picture for a plain web page; Studio owns all subsequent time.
window.film.frame(0);
