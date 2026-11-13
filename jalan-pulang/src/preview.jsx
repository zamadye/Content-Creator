import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {ForestTest} from './forest';
import {PhoneCallTest} from './phone';
import {RideTest} from './ride';
import {WarungWithVO, WarungFigureWithVO} from './vo-scene';
import './preview.css';
const shots = {
  forest:{label:'01 · Hutan PBR',component:ForestTest,duration:300,subtitle:'Blok adegan · 2.5D / Three.js'},
  ride:{label:'02 · Motor di hutan',component:RideTest,duration:300,subtitle:'Aksi berkendara · prototipe'},
  warung:{label:'03 · Warung pertama',component:RideTest,duration:270,props:{showWarung:true},subtitle:'Adegan 02:25–02:34 · blockout'},
  warungvo:{label:'04 · Warung + VO',component:WarungWithVO,duration:270,subtitle:'02:25–02:34 · VO asli'},
  lit:{label:'05 · Warung menyala',component:RideTest,duration:180,props:{warungScene:'lit'},subtitle:'03:47–03:53 · blockout'},
  figure:{label:'06 · Sosok di warung + VO',component:WarungFigureWithVO,duration:300,subtitle:'04:00–04:10 · material dan karakter diperbarui'},
  phone:{label:'07 · UI Ponsel',component:PhoneCallTest,duration:120,subtitle:'Insert antarmuka · panggilan Ibu'},
};
function Preview(){
 const [shot,setShot]=useState('forest');const s=shots[shot];
 return <div className="shell"><header><div className="mark">LS</div><div><small>THE LAST SIGNAL / PRA-PRODUKSI</small><h1>Jalan Pulang <span>Scene Preview</span></h1></div><div className="badge"><i/> PROTOTIPE</div></header>
 <main><aside><div className="side-title">DAFTAR ADEGAN <span>07</span></div>{Object.entries(shots).map(([id,entry])=><button className={'item '+(id===shot?'active':'')} onClick={()=>setShot(id)} key={id}><span>{entry.label}</span><small>{entry.subtitle}</small></button>)}<div className="divider"/><p className="hint">Preview untuk pemeriksaan gerak dan tampilan. Penyuntingan serta render tetap berbasis kode Remotion.</p></aside>
 <section><div className="topline"><div><div className="eyebrow">KOMPOSISI AKTIF</div><h2>{s.label}</h2></div><span>16:9 &nbsp; · &nbsp; 30 FPS</span></div><div className="stage"><Player key={shot} component={s.component} inputProps={s.props || {}} durationInFrames={s.duration} compositionWidth={1920} compositionHeight={1080} fps={30} controls style={{width:'100%',aspectRatio:'16 / 9'}} /></div><div className="info"><div><strong>Uji teknis, bukan visual final</strong><p>{shot==='forest'?'Mesh prosedural, material PBR, animasi karakter Kenney dan kamera. Karakter belum merepresentasikan Dimas.':(['ride','warung','warungvo','lit','figure'].includes(shot))?'Prototipe motor dan pengendara prosedural; belum menjadi model Dimas dan Supra final.':'UI panggilan sebagai elemen cerita; belum terintegrasi ke adegan atau audio.'}</p></div><span>● &nbsp; READY FOR REVIEW</span></div></section></main></div>
}
createRoot(document.getElementById('root')).render(<Preview/>);
