export function relevantStatements<T extends {text:string}>(rows:T[], question:string, limit=20):T[] {
  const words=[...new Set(question.toLocaleLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [])];
  const scored=rows.map((row,index)=>({row,index,score:words.reduce((sum,word)=>sum+(row.text.toLocaleLowerCase().includes(word)?1:0),0)}));
  const relevant=scored.filter(r=>r.score>0).sort((a,b)=>b.score-a.score || a.index-b.index).slice(0,10);
  const seen=new Set(relevant.map(r=>r.index));
  return [...relevant,...scored.filter(r=>!seen.has(r.index))].slice(0,limit).map(r=>r.row);
}