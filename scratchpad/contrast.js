// WCAG contrast of the pale ink at a given alpha over the app's ground.
const ink=[243,226,198], ground=[15,13,11];
const lin=c=>{c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);};
const L=r=>.2126*lin(r[0])+.7152*lin(r[1])+.0722*lin(r[2]);
const over=a=>ground.map((g,i)=>g+a*(ink[i]-g));
const ratio=a=>{const l1=L(over(a)),l2=L(ground);return ((Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05));};
for (const a of [0.30,0.36,0.42,0.48,0.52,0.55,0.62,0.72,1])
  console.log('alpha '+a.toFixed(2)+'  ->  '+ratio(a).toFixed(2)+':1');
