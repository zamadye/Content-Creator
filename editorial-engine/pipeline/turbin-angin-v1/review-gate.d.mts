export function sha256(b:Buffer):string;
export function checkHumanReview(approval:unknown,scriptBytes:Buffer,auditBytes:Buffer,planBytes:Buffer):{allowed:boolean;issues:string[]};
