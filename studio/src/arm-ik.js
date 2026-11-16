import * as THREE from 'three';

// Short CCD solve from a known pose. Target is in world coordinates. Reinitialise
// the arm before calling: it must give the same answer on arbitrary frame seeks.
export function solveArm(entity,side,target,weight=1){
 const b=entity.bones,root=entity.mesh,upper=b[`upperarm01.${side}`],lower=b[`lowerarm01.${side}`],end=b[`wrist.${side}`];
 const q0=upper.quaternion.clone(),q1=lower.quaternion.clone();
 const origin=new THREE.Vector3(),effector=new THREE.Vector3(),parentQ=new THREE.Quaternion(),delta=new THREE.Quaternion();
 for(let pass=0;pass<16;pass++)for(const joint of [lower,upper]){
  root.updateWorldMatrix(true,true);joint.getWorldPosition(origin);end.getWorldPosition(effector);
  const a=effector.sub(origin),c=target.clone().sub(origin);if(a.lengthSq()<1e-10||c.lengthSq()<1e-10)continue;
  delta.setFromUnitVectors(a.normalize(),c.normalize());joint.parent.getWorldQuaternion(parentQ);
  joint.quaternion.premultiply(parentQ.clone().invert().multiply(delta).multiply(parentQ)).normalize();
 }
 // Blend back to the caller's initial pose for the dismount transition.
 const resolvedUpper=upper.quaternion.clone(),resolvedLower=lower.quaternion.clone();
 upper.quaternion.copy(q0).slerp(resolvedUpper,weight);lower.quaternion.copy(q1).slerp(resolvedLower,weight);
 root.updateWorldMatrix(true,true);
 return end.getWorldPosition(effector).distanceTo(target);
}

export function holdMotorcycleGrips(entity,model,weight=1){
 // Generator's scooter handlebar (wheelbase 1.10, wheelR .42), in model coordinates.
 model.updateWorldMatrix(true,false);
 for(const [side,z] of [['L',-.26],['R',.26]]){
  entity.bones[`lowerarm01.${side}`].rotation.set(0,0,0);
  const target=model.localToWorld(new THREE.Vector3(.45,1.2944,z));
  solveArm(entity,side,target,weight);
 }
}
