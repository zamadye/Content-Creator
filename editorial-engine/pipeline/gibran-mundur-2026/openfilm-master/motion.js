// Full editorial master: original layered vector actions, state depends only on t.
const C={bg:'#081e26',ink:'#102e37',edge:'#31545b',mint:'#abe1c7',paper:'#fff3d9',amber:'#f2c473',red:'#d97c69',dim:'#87a2a5'};
const n=Number(document.body.dataset.scene);
const durations={1:9,2:16,3:30,4:16,5:13,6:14,7:16,8:14,9:17,10:12,11:28,12:15,13:9,14:24,15:14,16:21,17:23,18:20,19:12,20:23,21:25,22:8,23:24,24:31.991};
const clamp=x=>Math.min(1,Math.max(0,x));
const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10)};
const cue=(t,a,b)=>ease((t-a)/(b-a));
const lerp=(a,b,p)=>a+(b-a)*p;
const f=x=>Number(x.toFixed(3));
const group=(content,transform='',opacity=1)=>`<g transform="${transform}" opacity="${f(clamp(opacity))}">${content}</g>`;
const line=(x1,y1,x2,y2,color=C.edge,width=3)=>`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const path=(d,color=C.mint,width=5,progress=1,more='')=>`<path d="${d}" fill="none" opacity="${progress<=0?0:1}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${f(1-clamp(progress))}" ${progress<.999?more.replace(/marker-end="[^"]*"/g,''):more}/>`;
const text=(s,x,y,size=30,color=C.paper,more='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${more}>${s}</text>`;
const center=(s,x,y,size=30,color=C.paper,more='')=>text(s,x,y,size,color,`text-anchor="middle" ${more}`);
const label=(s,x,y,color=C.dim)=>text(s,x,y,18,color,'letter-spacing="3" font-weight="600"');
const rect=(x,y,w,h,fill=C.ink,stroke='none',r=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,r=6,fill=C.mint)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
const defs=`<defs><linearGradient id="stone" x1="0" x2="1"><stop stop-color="#367174"/><stop offset=".28" stop-color="#84b6aa"/><stop offset=".32" stop-color="#93c3b3"/><stop offset="1" stop-color="#447a7b"/></linearGradient><linearGradient id="cap" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d8dbbf"/><stop offset="1" stop-color="#799f95"/></linearGradient><radialGradient id="light"><stop stop-color="#20505b" stop-opacity=".55"/><stop offset="1" stop-color="#081e26" stop-opacity="0"/></radialGradient><pattern id="blueprint" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" stroke="#a1cfc4" stroke-opacity=".035" fill="none"/></pattern><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L9 5 1 9" fill="none" stroke="context-stroke" stroke-width="1.6"/></marker></defs>`;
const bg=()=>`${defs}${rect(0,0,1920,1080,C.bg)}<ellipse cx="980" cy="490" rx="950" ry="620" fill="url(#light)"/>${rect(0,0,1920,1080,'url(#blueprint)')}`;
const folio=(section)=>`${label('KNOT THEORY',88,68)}${text(document.body.dataset.hook==='true'?section.replace(/^\d+ \/ /,''):section,1832,68,18,C.dim,'text-anchor="end" letter-spacing="2"')}`;
const mast=(small,big,sub='')=>`${label(small,88,135,C.mint)}${text(big,84,205,59,C.paper,'font-weight="700" letter-spacing="-2"')}${sub?text(sub,88,251,24,C.dim):''}`;
const foot=(s,opacity=1)=>group(`${line(88,937,1832,937,C.edge,1)}${text(s,88,988,28,C.paper)}`,'',opacity);
const xs=[460,710,960,1210,1460];

function column(x,missing=0,stress=0){
  const y=missing*325;
  const ramp=clamp((stress-.3)/.7),blend=(a,b)=>Math.round(lerp(a,b,ramp));
  const material=stress>0?`rgb(${blend(90,217)} ${blend(147,124)} ${blend(143,105)})`:'url(#stone)';
  return `<g data-role="column" data-x="${x}" data-missing="${f(missing)}">${group(`<path d="M-45 410H45L35 745H-35Z" fill="${material}" stroke="#a7c7b6" stroke-width="2"/>${rect(-60,392,120,23,'url(#cap)')}${rect(-56,742,112,22,'url(#cap)')}${line(-22,430,-18,727,'#b1d8c4',3)}${line(13,430,11,727,'#315e63',2)}`,
    `translate(${x} ${f(y)}) rotate(${f(missing*6)} 0 500)`,1-missing)}</g>`;
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
    grid+=`<g data-role="calendar-cell">${group(rect(1140+(i%10)*24,720+Math.floor(i/10)*18,17,11,C.mint),'',appear)}</g>`;
  }
  return `${folio('03 / MEKANISME KONSTITUSI')}${mast('PASAL 8 AYAT (2)','Jika terjadi kekosongan Wapres.','Bagan ilustratif · urutan mekanisme, bukan dokumentasi peristiwa')}
    ${institution(335,445,'PRESIDEN')}
    ${path('M488 498H716',C.amber,4,nominate,'marker-end="url(#arrow)"')}
    ${group(`<g data-role="candidate">${candidate(845,475,'CALON 1')}</g><g data-role="candidate">${candidate(1035,475,'CALON 2')}</g>`,'',nomineeAlpha)}
    ${group(`${center('Dua calon diusulkan',940,687,25,C.mint)}${center('oleh Presiden',940,723,25,C.mint)}`,'',nomineeAlpha)}
    ${path('M1150 498H1375',C.amber,4,elect,'marker-end="url(#arrow)"')}
    ${group(institution(1560,445,'MPR MEMILIH'),'',cue(t,7.5,8.5))}
    ${group(`${line(1120,680,1670,680,C.edge,1)}${text('Paling lambat',1428,752,22,C.dim)}${text('60 hari',1425,811,51,C.paper,'font-weight="700"')}${text('untuk bersidang',1428,845,21,C.dim)}`,'',gridAlpha)}${grid}
    ${group(`${text('Mekanisme tetap berjalan.',88,984,46,C.mint,'font-weight="600"')}`,'',cue(t,20.2,21.2))}
    ${group(foot('Presiden mengusulkan dua calon. MPR bersidang untuk memilih.'),'',1-cue(t,19.4,20))}`;
}

function wheel(x,y,rotation){
  return group(`<circle r="67" fill="#07151c" stroke="#658e8e" stroke-width="6"/><circle r="39" fill="#1c3c46" stroke="#b9d2bf" stroke-width="3"/>${[0,60,120].map(a=>group(line(-32,0,32,0,C.dim,5),`rotate(${a})`)).join('')}${dot(0,0,9,C.amber)}`,`translate(${x} ${y}) rotate(${f(rotation)})`);
}
function car(t){
  // The source transcript changes to the cooling fault at exactly 4:58 (local 7).
  const swap=cue(t,1.6,4.5), travel=cue(t,4.8,6.8), reveal=cue(t,7,8.5), heat=cue(t,8.5,14), repair=cue(t,15,18);
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
    ${path('M1236 530H1260V577H1335',C.amber,5,cue(t,8.2,10.4),'marker-end="url(#arrow)"')}
    ${group(`${path('M1140 489Q1154 457 1140 430',C.red,3,heat)}${path('M1167 489Q1181 457 1167 430',C.red,3,heat)}${path('M1195 489Q1209 457 1195 430',C.red,3,heat)}`,'',heat)}`;
  body+=`<g data-role="engine-component">${group(oldPart+newPart,'',cue(t,.3,.9)*(1-cue(t,7,7.6)))}</g>`;
  body+=`<g data-role="cooling-system" opacity="${f(reveal)}">${under}</g>`;
  const tip=t<4.8?'SATU KOMPONEN DIGANTI':t<7?'MOBIL BISA BERJALAN LAGI':t<15?'TETAPI ALIRAN PENDINGIN MASIH TERPUTUS':'PERIKSA AKAR MASALAHNYA';
  return `${folio('04 / ANALOGI SISTEM')}${mast('MENGGANTI ≠ MEMPERBAIKI','Komponen baru. Gangguan yang sama?')}
    ${group(body,`translate(${f(pan)} ${f(-reveal*5)}) translate(960 540) scale(${f(zoom)}) translate(-960 -540)`)}
    ${group(`${line(790,837,1070,837,C.edge,8)}${line(790,837,790+280*heat,837,gaugeColor,8)}${text('TEMPERATUR',790,884,19,C.dim,'letter-spacing="3"')}${text('ALIRAN TERPUTUS',1680,884,21,C.red,'text-anchor="end"')}${path('M1645 845V625H1390',C.red,2,heat)}`,'',reveal)}
    ${group(`${text('Penggantian tidak membuka jalur yang tersumbat.',88,318,25,C.mint)}`,'',repair)}
    ${foot(tip)}`;
}

// Layout and animation always occupy distinct groups. A moving document can
// never replace its position/rotation transform, the clipping bug in v3.
function paper(x,y,{scale=1,rotate=0,dy=0,alpha=1,blank=false,heading='ILUSTRASI'}={}){
  const body=`${rect(-150,-190,300,380,C.paper,'none',4)}${label(heading,-118,-147,C.ink)}
    ${[0,1,2,3].map(i=>rect(-115,-93+i*36,i===2?172:225,5,'#92aaa0')).join('')}
    ${blank?rect(-116,82,232,60,'none',C.amber,3):rect(-115,85,225,5,'#92aaa0')}`;
  return `<g data-role="document" transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})">${group(body,`translate(0 ${f(dy)})`,alpha)}</g>`;
}
function envelope(x,y,p=1){
  return group(`${rect(-62,-39,124,78,C.paper,C.mint,4)}${path('M-62-39L0 5 62-39',C.ink,3)}${path('M-62 39L-17 0M62 39L17 0',C.edge,2)}`,`translate(${f(x)} ${f(y)})`,p);
}
function seat(x,y,s=1,dx=0){
  return group(`${rect(-83,-142,166,158,'#28505a',C.mint,13)}${rect(-98,9,196,37,C.amber,'none',6)}${line(-65,47,-72,128,C.paper,7)}${line(65,47,72,128,C.paper,7)}`,`translate(${x} ${y}) scale(${s}) translate(${f(dx)} 0)`);
}
function book(x,y,s=1){
  return group(`<path d="M0-80Q-65-118-140-92V100Q-60 74 0 112Q60 74 140 100V-92Q65-118 0-80Z" fill="#23464e" stroke="#a7c4b2" stroke-width="4"/>${line(0,-80,0,112,C.amber,4)}${[-46,-16,14,44].map(y=>line(-116,y,-25,y,C.dim,3)+line(25,y,116,y,C.dim,3)).join('')}`,`translate(${x} ${y}) scale(${s})`);
}
function tick(x,y,p=1,color=C.mint){return path(`M${x-12} ${y}l9 10 23-29`,color,5,p)}
const panelTitle=(section,kicker,title)=>folio(section)+mast(kicker,title);

function dispatch(t){
  const second=n===5, unknown=n===6;
  if(unknown){
    const empty=cue(t,1,3), question=cue(t,4,5), rewind=cue(t,9,12);
    return `${panelTitle('06 / INFORMASI TERSEDIA','ALASAN SPESIFIK','Ada bagian yang belum terjawab.')}
      ${paper(780,565,{scale:1.24,dy:lerp(35,0,cue(t,0,1.2)),blank:true})}
      ${group(`${path('M925 690H1140V565',C.amber,3,empty)}${text('ALASAN SPESIFIK',1170,549,22,C.dim)}${text('Tidak dijelaskan',1170,599,34,C.paper)}`,'',empty)}
      ${group(center('?',1120,760,96,C.amber),'',question*(1-rewind))}
      ${group(`${path('M1570 810H1040',C.mint,5,rewind,'marker-end="url(#arrow)"')}${text('KEMBALI KE KONTEKS',1160,862,22,C.mint,'letter-spacing="2"')}`,'',rewind)}
      ${foot(t<9?'Kolom kosong adalah ilustrasi, bukan reproduksi surat.':'Untuk memahami persoalan, telusuri konteks sebelumnya.')}`;
  }
  const send=cue(t,second?1.2:4,second?4.2:8.8), settle=cue(t,second?4.3:9,second?5.3:10);
  const targetX=second?1420:1420;
  const px=lerp(640,targetX,send), py=lerp(520,520,send)-Math.sin(send*Math.PI)*100;
  return `${panelTitle(second?'05 / TUJUAN SURAT':'04 / PERISTIWA','PENGUNDURAN DIRI',second?'Surat juga disampaikan ke Presiden.':'Surat disampaikan kepada MPR.')}
    ${group(paper(415,550,{scale:1.05,rotate:-3}),'',1-cue(t,second?7:12,second?9:14)*.3)}
    ${text('12 NOVEMBER 2026',250,830,24,C.mint,'letter-spacing="2"')}
    ${path('M655 520H1190',C.amber,4,send,'marker-end="url(#arrow)"')}
    ${envelope(px,py,1-settle)}${institution(1420,450,second?'PRESIDEN':'MPR',1.3)}
    ${group(`${tick(1420,730,settle)}${center('DISAMPAIKAN',1420,802,22,C.mint,'letter-spacing="2"')}`,'',settle)}
    ${second?group(`${line(745,762,1040,762,C.edge,2)}${text('ALASAN UMUM',745,814,19,C.dim,'letter-spacing="2"')}${text('Kepentingan bangsa',745,856,30,C.paper)}`,'',cue(t,6,8)):''}
    ${foot('Visual ilustratif · bukan dokumen atau rekaman penyerahan asli.')}`;
}

function courtContext(t){
  const separate=n===8;
  if(!separate){
    const a=cue(t,1,2.5), b=cue(t,4,5.5), link=cue(t,8,10.5);
    return `${panelTitle('07 / KONTEKS PERKARA','DUA KONTEKS','Bedakan jenis perkaranya.')}
      ${group(`${paper(555,555,{scale:1.12,heading:'MK · PHPU'})}${center('MAHKAMAH KONSTITUSI',555,840,25,C.mint)}`,'',a)}
      ${group(`${paper(1365,555,{scale:1.12,heading:'MA · TUN'})}${center('MAHKAMAH AGUNG',1365,840,25,C.mint)}`,'',b)}
      ${path('M820 400V760',C.edge,2,link)}${path('M1100 400V760',C.edge,2,link)}
      ${group(`${center('BEDA',960,535,25,C.dim)}${center('PERKARA',960,578,25,C.dim)}`,'',link)}
      ${foot('Dua dokumen ilustratif, bukan kutipan atau salinan putusan.')}`;
  }
  const extract=cue(t,1.5,4), extra=cue(t,5.5,8), stop=cue(t,9,11);
  return `${panelTitle('08 / BATAS PERNYATAAN','MEMBACA PUTUSAN','Jangan menambahkan kesimpulan.')}
    ${paper(465,545,{scale:1.25,heading:'ILUSTRASI'})}
    ${path('M665 525H900',C.mint,4,extract,'marker-end="url(#arrow)"')}
    ${group(`${rect(948,400,590,178,'#12333b',C.mint,3)}${text('YANG DINYATAKAN',983,456,22,C.mint,'letter-spacing="2"')}${text('Isi dan batas putusan',983,522,35,C.paper)}`,'',extract)}
    ${group(`${text('KLAIM TAMBAHAN',983,706,24,C.dim,'letter-spacing="2"')}${path('M983 732H1530',C.red,4,stop)}${text('Tidak otomatis mengikuti.',983,786,30,C.paper)}`,'',extra)}
    ${foot('Sorot pernyataan yang ada; jangan mengisi bagian yang tidak dinyatakan.')}`;
}

function inference(t){
  const divide=cue(t,2,4), reveal=cue(t,9,11), keep=cue(t,12,14.5);
  return `${panelTitle('09 / BATAS KESIMPULAN','DUA HAL BERBEDA','Mundur ≠ mengakui kesalahan.')}
    ${group(`${center('MUNDUR',550,450,47,C.paper,'font-weight="700"')}${center('MENGAKUI KESALAHAN',1360,450,40,C.paper,'font-weight="700"')}
      ${line(725,440,1190,440,C.edge,3)}${rect(903,392,114,94,C.bg)}${center('≠',960,467,74,C.amber)}`,'',divide)}
    ${group(seat(960,720,1),`translate(0 ${f(40*(1-reveal))})`,reveal)}
    ${group(`${path('M800 720H560M1120 720H1360',C.mint,3,keep)}${dot(530,720,12)}${dot(1390,720,12)}${center('POSISI KOSONG',960,905,21,C.dim,'letter-spacing="3"')}`,'',keep)}
    ${foot(t<9?'Jangan menghubungkan dua kesimpulan secara otomatis.':'Yang perlu dilihat berikutnya: bagaimana sistem menghadapi kekosongan.')}`;
}

function replacement(t){
  const lift=cue(t,1,2), install=cue(t,2.2,6.5), foundation=cue(t,8,10.5);
  const y=-90*(1-install), x=620*(1-install);
  return `${panelTitle('10 / KOMPONEN PENGGANTI','KEMBALI KE GEDUNG','Cukup memasang pilar baru?')}
    ${structure({missing:1,load:0})}
    ${group(column(960),`translate(${f(x)} ${f(y)})`,lift)}
    ${group(`${line(1090,270,1090,375,C.amber,5)}${line(1090,270,960+x,270,C.amber,5)}${line(960+x,270,960+x,370+y,C.dim,3)}`,'',1-cue(t,7,8))}
    ${path('M780 813L825 795 870 820 910 800 965 823 1020 800 1080 819',C.red,5,foundation)}
    ${group(`${center('BAGAIMANA DENGAN FONDASINYA?',960,885,23,C.amber,'letter-spacing="2"')}`,'',foundation)}
    ${foot('Komponen kembali terpasang. Sumber gangguan tetap perlu diperiksa.')}`;
}

function diagnostics(t){
  const design=cue(t,1.3,4.5), inspect=cue(t,7,10), distribute=cue(t,12.5,16), compare=cue(t,20,24);
  let plan=rect(385,348,1160,422,'none',C.edge);
  [485,735,985,1235,1485].forEach((x,i)=>{plan+=rect(x-25,430,50,270,'#2b5961',C.mint,2)+line(x,330,x,760,C.edge,1)});
  plan+=path('M405 415H1525M405 716H1525',C.mint,3,design);
  plan+=path('M460 790H720V820H1000V790H1290V820H1500',C.red,4,design);
  const scanX=lerp(420,1500,inspect);
  plan+=group(`${rect(scanX,365,55,355,'#abe1c722')}${line(scanX+28,350,scanX+28,730,C.amber,3)}`,'',cue(t,7,8)*(1-cue(t,11,12)));
  plan+=path('M985 382Q985 485 735 485V550M985 382Q985 485 1235 485V550',C.amber,5,distribute,'marker-end="url(#arrow)"');
  return `${panelTitle('11 / DIAGNOSE SISTEM','DESAIN · PEMERIKSAAN · BEBAN','Masalahnya ada di bagian mana?')}
    ${group(plan,`translate(960 570) scale(${f(1-compare*.12)}) translate(-960 -570)`)}
    ${group(text('DESAIN',390,315,21,C.mint,'letter-spacing="3"'),'',design)}
    ${group(text('PEMERIKSAAN',825,315,21,C.amber,'letter-spacing="3"'),'',inspect)}
    ${group(text('DISTRIBUSI BEBAN',1270,315,21,C.mint,'letter-spacing="3"'),'',distribute)}
    ${group(`${center('MEMPERBAIKI BAGIAN',580,877,26,C.dim)}${center('≠',960,883,58,C.amber)}${center('MEMPERBAIKI PENYEBAB',1370,877,26,C.mint)}`,'',compare)}
    ${foot('Tiga pemeriksaan berbeda; penggantian satu bagian belum menjawab semuanya.')}`;
}

const entities=[['PRESIDEN',500,390],['WAPRES',960,345],['DPR',1420,390],['MPR',1560,650],['PENGADILAN',1170,790],['LEMBAGA NEGARA',700,790],['MASYARAKAT',360,650]];
function stateNetwork(t,complete=false){
  let graph='';
  entities.forEach(([name,x,y],i)=>{
    const appear=complete?1:cue(t,.35+i*1.3,1.25+i*1.3);
    const next=entities[(i+1)%7];
    const join=complete?1:cue(t,2+i*1.25,3+i*1.25);
    graph+=path(`M${x} ${y}L${next[1]} ${next[2]}`,C.edge,3,join);
    graph+=`<g data-role="institution-node" data-name="${name}">${group(`${dot(x,y,62,C.ink)}<circle cx="${x}" cy="${y}" r="62" fill="none" stroke="${C.mint}" stroke-width="3"/>${center(name,x,y+7,name.length>12?14:19,C.paper,'font-weight="600"')}`,'',appear)}</g>`;
    if(complete)graph+=path(`M${x-72} ${y}A72 72 0 0 1 ${x+72} ${y}`,C.amber,2,cue(t,1+i*.25,2+i*.25));
  });
  if(complete){
    graph+=`<g data-role="constitution-ring">${path('M960 260a760 330 0 1 1 0 660a760 330 0 1 1 0-660',C.mint,3,cue(t,3.5,6.7))}</g>`;
    graph+=group(center('KONSTITUSI',960,591,40,C.paper,'font-weight="600" letter-spacing="4"'),'',cue(t,5.8,7));
  }else graph+=group(`${center('SALING TERHUBUNG',960,566,25,C.dim)}${center('DALAM SATU SISTEM',960,603,25,C.dim)}`,'',cue(t,10,12));
  return `${panelTitle(complete?'13 / BATAS KEWENANGAN':'12 / JARINGAN INSTITUSI',complete?'KEWENANGAN DAN BATAS':'TUJUH ENTITAS',complete?'Terhubung, sekaligus dibatasi.':'Negara lebih besar dari dua jabatan.')}${graph}
    ${foot(complete?'Kewenangan dan batas berada dalam satu kerangka konstitusi.':'Diagram hubungan konseptual · bukan bagan hierarki lembaga.')}`;
}

function perspectives(t){
  const branch=cue(t,2,5), separate=cue(t,6,8.5), focus=cue(t,10,12);
  return `${panelTitle('15 / DUA SUDUT PANDANG','MEKANISME TERSEDIA','Apakah semua persoalan selesai?')}
    ${group(`${rect(875,335,170,170,'none',C.mint,3)}${line(960,337,960,505,C.edge,2)}${center('?',960,449,74,C.amber)}`,`translate(0 ${f(-separate*35)})`)}
    ${path('M960 530V600Q960 625 600 680',C.mint,5,branch,'marker-end="url(#arrow)"')}
    ${path('M960 530V600Q960 625 1320 680',C.mint,5,branch,'marker-end="url(#arrow)"')}
    ${group(`${center('A',540,739,70,C.amber)}${center('MEREDAKAN KONFLIK',540,811,29,C.paper)}${center('B',1380,739,70,C.amber)}${center('MENGEVALUASI AKAR MASALAH',1380,811,27,C.paper)}`,'',separate)}
    ${group(`${line(960,650,960,864,C.edge,1)}${center('DUA PERSPEKTIF',960,901,20,C.dim,'letter-spacing="3"')}`,'',focus)}
    ${foot('Keduanya perlu didengar sebelum menarik kesimpulan.')}`;
}

function calm(t){
  const settle=cue(t,5,14), cooperate=cue(t,14,18.5), amp=lerp(52,4,settle);
  let d='';
  for(let x=360;x<=1560;x+=10){const y=390+Math.sin((x-360)/62)*amp;d+=`${x===360?'M':'L'}${x} ${f(y)}`;}
  const table=`<path d="M520 560H1400L1470 750H450Z" fill="#24434a" stroke="#8eb3a7" stroke-width="3"/>${[570,830,1090,1350].map(x=>`${rect(x-47,782,94,67,C.ink,C.edge,7)}${rect(x-47,474,94,47,C.ink,C.edge,7)}`).join('')}${paper(950,640,{scale:.31,rotate:-6})}`;
  return `${panelTitle('16 / PERSPEKTIF A','MEREDAKAN KONFLIK','Memberi ruang untuk bekerja kembali.')}
    ${path(d,settle>.8?C.mint:C.amber,4)}${group(center('GANGGUAN MEREDA',960,300,21,C.dim,'letter-spacing="3"'),'',settle)}
    ${group(table,`translate(0 ${f(25*(1-cue(t,.2,1.5)))})`)}
    ${path('M610 660H1320',C.mint,4,cooperate,'marker-end="url(#arrow)"')}
    ${group(center('RUANG KERJA LEBIH STABIL',960,871,26,C.mint),'',cooperate)}
    ${foot('Satu sudut pandang: pengunduran diri dapat meredakan gangguan politik.')}`;
}

function remainingFiles(t){
  const departure=cue(t,3,6), files=cue(t,7,10), checklist=cue(t,12,16), unresolved=cue(t,17,20);
  return `${panelTitle('17 / PERSPEKTIF B','PROSEDUR TETAP ADA','Yang ditinggalkan belum tentu selesai.')}
    ${group(seat(415,605,1.25),`translate(${f(-departure*130)} 0)`,1-departure*.65)}
    ${rect(680,702,860,24,'#48716f')}${line(740,728,740,843,C.edge,8)}${line(1480,728,1480,843,C.edge,8)}
    ${paper(890,546,{scale:.65,rotate:-6})}${paper(1090,546,{scale:.65,rotate:5})}
    ${group(`${path('M815 356H1210',C.amber,3,files)}${center('BERKAS TETAP DI MEJA',1020,310,26,C.mint)}`,'',files)}
    ${group(`${rect(1410,399,45,45,'none',C.mint,2)}${tick(1431,420,checklist)}${text('Pemeriksaan',1490,430,23,C.dim)}
      ${rect(1410,493,45,45,'none',C.amber,2)}${text('Evaluasi',1490,524,23,C.paper)}`,'',checklist)}
    ${group(`${path('M1430 553V630H1280',C.amber,3,unresolved,'marker-end="url(#arrow)"')}${text('BELUM SELESAI',1240,891,23,C.amber,'letter-spacing="2"')}`,'',unresolved)}
    ${foot('Pergantian pejabat tidak otomatis menutup persoalan prosedur.')}`;
}

function gear(x,y,r,angle,color=C.mint){
  const teeth=Array.from({length:12},(_,i)=>group(rect(-r*.1,-r-8,r*.2,24,color,'none',2),`rotate(${i*30})`)).join('');
  return group(`${teeth}<circle r="${r}" fill="${C.ink}" stroke="${color}" stroke-width="5"/><circle r="${r*.48}" fill="none" stroke="${color}" stroke-width="4"/>${dot(0,0,r*.12,C.amber)}`,`translate(${x} ${y}) rotate(${f(angle)})`);
}
function institutionMechanism(t){
  const morph=cue(t,.4,3.2), replace=cue(t,3.6,6), inspect=cue(t,7,10);
  const turn=cue(t,1,4)*50;
  return `${panelTitle('19 / MEKANISME DI BALIKNYA','DARI MOBIL KE INSTITUSI','Pergantian orang bukan perbaikan otomatis.')}
    ${group(`${rect(365,470,1165,270,'none',C.edge,8)}${wheel(540,743,turn)}${wheel(1320,743,turn)}`,'',1-morph)}
    ${group(institution(960,340,'INSTITUSI',.85),'',morph)}
    ${gear(620,641,92,turn)}${gear(830,641,92,-turn)}${gear(1040,641,92,turn,C.amber)}${gear(1250,641,92,-turn,C.red)}
    ${group(seat(520,530,.55),`translate(${f(-replace*230)} 0)`,1-replace)}
    ${group(seat(520,530,.55),`translate(${f(230*(1-replace))} 0)`,replace)}
    ${path('M1290 585L1326 615 1289 645 1326 675',C.red,7,1)}
    ${group(`${path('M1245 780V830H1520',C.amber,3,inspect)}${text('TITIK MACET TETAP ADA',1160,884,24,C.amber)}`,'',inspect)}
    ${foot('Periksa mekanisme yang menghasilkan masalah, bukan hanya komponen yang berganti.')}`;
}

function resilient(t){
  const shock=cue(t,1,3), detect=cue(t,5,8), fix=cue(t,9,13), prevent=cue(t,14,18), recover=cue(t,18,21);
  const nodes=[[400,570,'GANGGUAN'],[770,390,'DETEKSI'],[1150,570,'PERBAIKAN'],[1515,390,'PENCEGAHAN']];
  let d=nodes.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ');
  let out=path(d,C.edge,4);
  const progress=[shock,detect,fix,prevent];
  nodes.forEach(([x,y,name],i)=>{
    out+=dot(x,y,55,C.ink)+`<circle cx="${x}" cy="${y}" r="55" fill="none" stroke="${progress[i]>.9?C.mint:C.edge}" stroke-width="3"/>`;
    out+=center(name,x,y+110,22,C.dim,'letter-spacing="1"');
    if(i)out+=path(`M${nodes[i-1][0]} ${nodes[i-1][1]}L${x} ${y}`,C.mint,4,progress[i]);
  });
  const phase=t<5?0:t<9?1:t<14?2:3;
  const from=nodes[Math.max(0,phase-1)],to=nodes[phase],p=progress[phase];
  out+=`<g data-role="signal">${dot(lerp(from[0],to[0],p),lerp(from[1],to[1],p),10,C.amber)}</g>`;
  out+=path('M375 535L395 570 380 590 415 610',C.red,5,shock*(1-fix));
  out+=group(tick(1150,570,fix),'',fix);
  out+=group(`${rect(1500,370,30,35,'none',C.mint,4)}${path('M1503 370V360a12 12 0 0 1 24 0v10',C.mint,4,prevent)}`,'',prevent);
  return `${panelTitle('20 / RESILIENCE','GANGGUAN → TINDAKAN → PENCEGAHAN','Kuat berarti mampu memperbaiki diri.')}${out}
    ${group(`${path('M1515 505V790H400V685',C.mint,4,recover,'marker-end="url(#arrow)"')}${center('KEMBALI BERFUNGSI',960,858,32,C.mint,'font-weight="600"')}`,'',recover)}
    ${foot('Indikator pulih baru muncul setelah deteksi, perbaikan, dan pencegahan.')}`;
}

function twoOutcomes(t){
  const split=cue(t,.4,2), changes=cue(t,4,10), difference=cue(t,10,15), wide=cue(t,17,22);
  const a=group(`${gear(570,510,85,changes*50)}${gear(755,510,85,-changes*50)}${tick(660,710,difference)}${center('SISTEM DIPERBAIKI',660,810,25,C.mint)}`,'',split);
  const b=group(`${gear(1190,510,85,changes*50)}${gear(1375,510,85,-changes*50,C.red)}${path('M1375 650V720',C.red,5,difference)}${center('KOMPONEN SAJA DIGANTI',1290,810,25,C.amber)}`,'',split);
  return `${panelTitle('21 / DUA KEMUNGKINAN','APA YANG BERUBAH?','Sistem membaik, atau sekadar berganti bagian?')}
    ${group(a+b,'',1-wide)}${group(structure({missing:0}),`translate(960 530) scale(.9) translate(-960 -530)`,wide)}
    ${group(center('PILAR BUKAN PEMILIK GEDUNG',960,889,29,C.mint,'font-weight="600"'),' ',wide)}
    ${foot(t<17?'Bandingkan hasil pada keseluruhan mekanisme.':'Pilar menopang struktur, bukan memiliki seluruh bangunan.')}`;
}

function key(x,y,s=1){return group(`<circle cx="0" cy="0" r="20" fill="none" stroke="${C.amber}" stroke-width="8"/>${line(20,0,100,0,C.amber,9)}${line(72,0,72,21,C.amber,8)}${line(95,0,95,21,C.amber,8)}`,`translate(${f(x)} ${f(y)}) scale(${s})`)}
function publicMandate(t){
  const landed=cue(t,.6,2.3), returnToRule=cue(t,3.1,6.1);
  return `${panelTitle('22 / MANDAT PUBLIK','JABATAN','Bukan milik pribadi.')}
    ${seat(655,590,1.75)}${key(610,lerp(320,610,landed),1.3)}
    ${path('M860 640H1180',C.mint,5,returnToRule,'marker-end="url(#arrow)"')}
    ${group(`${book(1390,565,1.05)}${center('MANDAT PUBLIK',1390,797,27,C.mint)}`,'',returnToRule)}
    ${foot('Kekuasaan terikat pada aturan, bukan kepemilikan kursi.')}`;
}

function equalRules(t){
  const rule=cue(t,1,3), align=cue(t,10,16), bookIn=cue(t,17,21);
  const names=['SATU NAMA','SATU KELUARGA','SATU KELOMPOK'];
  let objects='';
  names.forEach((name,i)=>{
    const x=505+i*455, appear=cue(t,3+i*1.8,4.4+i*1.8), y=lerp(625+(i-1)*65,650,align);
    objects+=group(`${candidate(x,y,'')}${center(name,x,815,24,C.dim)}`,'',appear);
    objects+=path(`M${x} 530V443`,C.mint,3,align);
  });
  return `${panelTitle('23 / ATURAN YANG SAMA','SIAPA PUN YANG BERKUASA','Tunduk pada kerangka yang sama.')}
    ${path('M320 440H1600',C.amber,5,rule)}${group(center('ATURAN',960,385,29,C.amber,'letter-spacing="4"'),'',rule)}${objects}
    ${group(book(1690,660,.55),'',bookIn)}
    ${foot('Entitas berbeda, posisi setara di bawah satu garis aturan.')}`;
}

function conclusion(t){
  const options=cue(t,.7,2), a=cue(t,2.5,6), b=cue(t,7,11), comment=cue(t,12,14), reflection=cue(t,17,20), end=cue(t,26.2,28.5);
  let first=`${center('A',560,372,57,C.amber)}${gear(560,536,85,a*60)}${center('GANTI KOMPONEN',560,723,29,C.paper)}
    ${center('B',1360,372,57,C.amber)}${gear(1260,536,70,-b*50)}${gear(1420,536,70,b*50)}${tick(1350,666,b)}${center('EVALUASI SISTEM',1360,748,29,C.paper)}`;
  return `${folio('24 / PERTANYAAN PENUTUP')}
    ${group(mast('MENURUT LO','Mana yang lebih penting?')+group(first,'',options)+group(center('TULIS PENDAPAT LO DI KOMENTAR',960,879,27,C.mint,'letter-spacing="2"'),'',comment),'',1-reflection)}
    ${group(`${center('Bukan hanya siapa yang meninggalkan kursi.',960,449,43,C.paper)}${center('Apakah sistemnya sudah bekerja dengan benar?',960,532,40,C.mint)}`,'',reflection*(1-cue(t,25,26)))}
    ${group(`${center('KNOT THEORY',960,468,76,C.paper,'font-weight="700" letter-spacing="7"')}${center('Memahami dunia',960,563,33,C.mint)}${center('melalui cara berpikir yang berbeda.',960,616,33,C.mint)}`,'',end)}
    ${group(foot('Pertanyaan tentang mekanisme yang bekerja dan persoalan yang tertinggal.'),'',1-end)}`;
}

const stage=document.querySelector('#stage'),plate=document.querySelector('#plate');
const draw={2:pillars,3:loads,4:dispatch,5:dispatch,6:dispatch,7:courtContext,8:courtContext,9:inference,10:replacement,11:diagnostics,12:t=>stateNetwork(t),13:t=>stateNetwork(t,true),14:constitution,15:perspectives,16:calm,17:remainingFiles,18:car,19:institutionMechanism,20:resilient,21:twoOutcomes,22:publicMandate,23:equalRules,24:conclusion};
const ready=n===1?new Promise((resolve,reject)=>{
  plate.addEventListener('loadedmetadata',resolve,{once:true});
  plate.addEventListener('error',()=>reject(new Error('Opening plate could not load')),{once:true});
  plate.src='assets/SC01.mp4';plate.load();
}):Promise.resolve();
window.film={duration:durations[n],width:1920,height:1080,ready,async frame(t){
  t=Math.max(0,Math.min(durations[n],t));
  if(n===1){
    await ready;
    const target=clamp(t/9)*Math.max(0,Math.min(plate.duration,5.95)-.04);
    if(Math.abs(plate.currentTime-target)>.025)await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{cleanup();reject(new Error('Opening video seek timed out'))},5000);
      const cleanup=()=>{clearTimeout(timer);plate.removeEventListener('seeked',done)};
      const done=()=>{cleanup();resolve()};plate.addEventListener('seeked',done,{once:true});plate.currentTime=target;
    });
    const reveal=cue(t,7.5,9);
    stage.innerHTML=defs+group(rect(0,0,1920,1080,C.bg)+structure({missing:0}),'',reveal)+text('ILUSTRASI',1815,1010,18,C.paper,'text-anchor="end" letter-spacing="2"');
  }else stage.innerHTML=bg()+draw[n](t);
}};
if(n!==1)window.film.frame(0);

