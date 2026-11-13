import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
// Diegetic interface element: not a conventional HUD and not an editing GUI.
export const PhoneCallTest = () => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig();
  const pulse=interpolate(Math.sin(f/fps*3),[-1,1],[0.88,1]);
  return <AbsoluteFill style={{background:'radial-gradient(ellipse at center, #233c3e, #071116)',justifyContent:'center',alignItems:'center',fontFamily:'Arial, sans-serif'}}>
    <div style={{width:360,height:680,borderRadius:48,border:'12px solid #171d20',background:'linear-gradient(160deg,#1a323b,#081417)',boxShadow:'0 35px 90px #000a, inset 0 0 3px #a9c3c6',color:'#e8f3ee',position:'relative',textAlign:'center'}}>
      <div style={{position:'absolute',top:18,right:26,fontSize:16,color:'#c5ddd6'}}>▂ 1 bar</div>
      <div style={{paddingTop:145,fontSize:21,color:'#a5beb9'}}>Panggilan keluar</div>
      <div style={{fontSize:52,fontWeight:600,marginTop:18}}>Ibu</div>
      <div style={{fontSize:20,color:'#a5beb9',marginTop:20}}>Menghubungkan...</div>
      <div style={{margin:'145px auto 0',width:72,height:72,borderRadius:'50%',background:'#a52831',display:'grid',placeItems:'center',fontSize:28,transform:`scale(${pulse})`}}>✕</div>
    </div>
  </AbsoluteFill>;
};
