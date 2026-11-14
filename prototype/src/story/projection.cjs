// Row-major homographies. Photo, mounted screen and UI anchors share this camera.
const multiply = (a,b) => Array.from({length:9},(_,i) => {
  const row=Math.floor(i/3),col=i%3
  return a[row*3]*b[col]+a[row*3+1]*b[col+3]+a[row*3+2]*b[col+6]
})
const project = (h,[x,y]) => {
  const z=h[6]*x+h[7]*y+h[8]
  return [(h[0]*x+h[1]*y+h[2])/z,(h[3]*x+h[4]*y+h[5])/z]
}
function homography(source,target) {
  const rows=[]
  source.forEach(([x,y],i)=>{const [u,v]=target[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v])})
  for(let col=0;col<8;col++){
    let pivot=col
    for(let r=col+1;r<8;r++)if(Math.abs(rows[r][col])>Math.abs(rows[pivot][col]))pivot=r
    ;[rows[col],rows[pivot]]=[rows[pivot],rows[col]]
    const scale=rows[col][col]
    if(Math.abs(scale)<1e-12)throw Error('Degenerate story camera')
    for(let j=col;j<9;j++)rows[col][j]/=scale
    for(let r=0;r<8;r++)if(r!==col){const n=rows[r][col];for(let j=col;j<9;j++)rows[r][j]-=n*rows[col][j]}
  }
  return rows.map(r=>r[8]).concat(1)
}
const corners=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]
const matrix3d=h=>`matrix3d(${[h[0],h[3],0,h[6],h[1],h[4],0,h[7],0,0,1,0,h[2],h[5],0,h[8]].join(',')})`
function plane(quad,localW,localH,radius=0){
  const xs=quad.map(p=>p[0]),ys=quad.map(p=>p[1])
  return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),localW,localH,radius,roll:0,quad,matrix:homography(corners(0,0,localW,localH),quad)}
}
module.exports={multiply,project,homography,corners,matrix3d,plane}
