/* Decorative transparent raster animation. No dependencies. */
class CypressTree extends HTMLElement {
  connectedCallback() {
    if (this.canvas) return;
    this.style.display = 'block';
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display:block;width:100%;height:auto';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.append(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.image = new Image();
    this.image.onload = () => {
      this.w = this.image.naturalWidth; this.h = this.image.naturalHeight;
      this.canvas.width = this.w + 40; this.canvas.height = this.h + 24;
      this.layer = document.createElement('canvas');
      this.layer.width = this.w; this.layer.height = this.h;
      this.mask = document.createElement('canvas');
      this.mask.width = this.w; this.mask.height = this.h;
      this.replay(this.getAttribute('mode') || 'both');
    };
    this.image.src = this.getAttribute('src');
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotion = () => this.replay(this.mode);
    this.motion.addEventListener('change', this.onMotion);
  }
  disconnectedCallback() { cancelAnimationFrame(this.frame); this.motion?.removeEventListener('change', this.onMotion); }
  replay(mode = 'both') {
    if (!this.image?.complete || !this.layer) return;
    cancelAnimationFrame(this.frame); this.mode = mode; this.start = performance.now();
    this.tick(this.start);
  }
  tick(now) {
    const t = (now - this.start) / 1000;
    const reduced = this.motion.matches;
    const progress = reduced || this.mode === 'wind' || this.mode === 'still' ? 1 : Math.min(t / 2.4, 1);
    const wind = !reduced && (this.mode === 'wind' || this.mode === 'both');
    this.render(progress, wind ? t : 0, wind);
    if (this.isConnected && !reduced && (wind || progress < 1)) this.frame = requestAnimationFrame(n => this.tick(n));
  }
  render(p, time, wind) {
    const {w,h} = this, l = this.layer.getContext('2d'), m = this.mask.getContext('2d');
    l.clearRect(0,0,w,h); l.drawImage(this.image,0,0);
    if (p < 1) {
      this.ctx.clearRect(0,0,w+40,h+24);
      const traces=window.CYPRESS_TRACES?.[this.getAttribute('side')||'left']||[];
      // Every mark has its own advancing pen tip. No bitmap reveal masks.
      const drawProgress=Math.min(1,p/.88), total=traces.length*drawProgress;
      this.ctx.save();this.ctx.translate(20,12);
      this.ctx.lineWidth=.65;this.ctx.lineCap='round';this.ctx.lineJoin='round';
      for(let i=0;i<Math.ceil(total);i++){
        const trace=traces[i];if(!trace)break;
        const q=Math.min(1,total-i),points=trace.p;
        const end=q*(points.length-1),n=Math.floor(end);
        this.ctx.strokeStyle=trace.shade<125?'#303030':'#686868';
        this.ctx.beginPath();this.ctx.moveTo(points[0][0]*w,points[0][1]*h);
        for(let j=1;j<=n;j++)this.ctx.lineTo(points[j][0]*w,points[j][1]*h);
        if(n<points.length-1){const f=end-n;this.ctx.lineTo((points[n][0]+(points[n+1][0]-points[n][0])*f)*w,(points[n][1]+(points[n+1][1]-points[n][1])*f)*h)}
        this.ctx.stroke();
      }
      // Only after the line drawing finishes, resolve the photographic texture.
      if(p>.88){this.ctx.globalAlpha=(p-.88)/.12;this.ctx.drawImage(this.image,0,0)}
      this.ctx.restore();return;
    }
    this.ctx.clearRect(0,0,w+40,h+24);
    if(!wind) {this.ctx.drawImage(this.layer,20,12);return;}
    // Deform only foliage / outer branch regions. The trunk and roots
    // have exactly zero displacement, including the trunk through the canopy.
    const fade=this.mode==='both'?Math.min(1,Math.max(0,(time-2.4)/1.2)):1;
    const right=this.getAttribute('side')==='right';
    // A fine continuous mesh samples the raster without moving rigid wood.
    const step=32;
    // Each canopy tier bends around a branch attachment, with increasing
    // flexibility toward its tip. Shared gusts propagate with a short lag.
    const branches=[
      {root:[.27,.34],tip:[.13,.12],radius:.17},
      {root:[.31,.30],tip:[.51,.10],radius:.17},
      {root:[.29,.36],tip:[.78,.24],radius:.16},
      {root:[.23,.43],tip:[.95,.39],radius:.105},
      {root:[.21,.49],tip:[.71,.48],radius:.095},
      {root:[.20,.56],tip:[.48,.61],radius:.08},
      {root:[.22,.39],tip:[.07,.28],radius:.12}
    ];
    const displacement=(x,y)=>{
      const nx=right?1-x/w:x/w,ny=y/h;
      if(ny>=.70)return [0,0];
      const trunkX=.18+Math.max(0,.57-ny)*.43;
      const trunkProtect=Math.max(0,Math.min(1,(Math.abs(nx-trunkX)-.075)/.075));
      if(!trunkProtect)return [0,0];
      let dx=0,dy=0,sum=0;
      for(let i=0;i<branches.length;i++){
        const {root,tip,radius}=branches[i];
        const vx=tip[0]-root[0],vy=tip[1]-root[1],len=vx*vx+vy*vy;
        const u=Math.max(0,Math.min(1.25,((nx-root[0])*vx+(ny-root[1])*vy)/len));
        const distance=Math.hypot(nx-root[0]-vx*u,ny-root[1]-vy*u);
        const weight=Math.exp(-3*(distance/radius)**2);
        const lag=u*.38+i*.035;
        const gust=.65*Math.sin((time-lag)*1.35)+.25*Math.sin((time-lag)*2.13)+.10*Math.sin((time-lag)*3.1);
        const angle=fade*(.014*gust*u*u+.0015*Math.sin(time*5.2-i+u*3)*u*u*u);
        const rx=(nx-root[0])*w,ry=(ny-root[1])*h;
        dx+=weight*(rx*(Math.cos(angle)-1)-ry*Math.sin(angle));
        dy+=weight*(rx*Math.sin(angle)+ry*(Math.cos(angle)-1));sum+=weight;
      }
      const influence=trunkProtect*Math.min(1,sum);
      return sum?[(right?-1:1)*dx/sum*influence,dy/sum*influence]:[0,0];
    };
    // Piecewise affine triangles share vertices, so motion does not tear.
    const triangle=(src,dst)=>{
      const [a,b,c]=src,[d,e,f]=dst;
      const det=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);
      const A=((e[0]-d[0])*(c[1]-a[1])-(f[0]-d[0])*(b[1]-a[1]))/det;
      const C=((f[0]-d[0])*(b[0]-a[0])-(e[0]-d[0])*(c[0]-a[0]))/det;
      const B=((e[1]-d[1])*(c[1]-a[1])-(f[1]-d[1])*(b[1]-a[1]))/det;
      const D=((f[1]-d[1])*(b[0]-a[0])-(e[1]-d[1])*(c[0]-a[0]))/det;
      // [site patch] Grow the clip triangle ~1px about its centroid so
      // neighbouring triangles overlap; otherwise anti-aliased clip edges
      // leave hairline seams across the canopy while the wind runs.
      const gx=(d[0]+e[0]+f[0])/3,gy=(d[1]+e[1]+f[1])/3;
      const grow=v=>{const vx=v[0]-gx,vy=v[1]-gy,l=Math.hypot(vx,vy)||1;return [v[0]+vx/l*1.1,v[1]+vy/l*1.1]};
      const [D2,E2,F2]=[grow(d),grow(e),grow(f)];
      const ctx=this.ctx;ctx.save();ctx.beginPath();ctx.moveTo(D2[0]+20,D2[1]+12);ctx.lineTo(E2[0]+20,E2[1]+12);ctx.lineTo(F2[0]+20,F2[1]+12);ctx.closePath();ctx.clip();
      ctx.setTransform(A,B,C,D,d[0]-A*a[0]-C*a[1]+20,d[1]-B*a[0]-D*a[1]+12);const sx=Math.min(a[0],b[0],c[0]),sy=Math.min(a[1],b[1],c[1]),sw=Math.max(a[0],b[0],c[0])-sx,sh=Math.max(a[1],b[1],c[1])-sy;ctx.drawImage(this.layer,sx,sy,sw,sh,sx,sy,sw,sh);ctx.restore();
    };
    // Keep the entire lower tree a direct, unchanged draw.
    const boundary=Math.ceil(h*.70/step)*step;
    this.ctx.drawImage(this.layer,0,boundary,w,h-boundary,20,12+boundary,w,h-boundary);
    for(let y=0;y<boundary;y+=step)for(let x=0;x<w;x+=step){
      const x2=Math.min(w,x+step),y2=Math.min(boundary,y+step);
      const src=[[x,y],[x2,y],[x2,y2],[x,y2]];
      const dst=src.map(([a,b])=>{const [dx,dy]=displacement(a,b);return [a+dx,b+dy]});
      if(src.every((v,i)=>v[0]===dst[i][0]&&v[1]===dst[i][1])){this.ctx.drawImage(this.layer,x,y,x2-x,y2-y,20+x,12+y,x2-x,y2-y);continue;}
      triangle([src[0],src[1],src[2]],[dst[0],dst[1],dst[2]]);
      triangle([src[0],src[2],src[3]],[dst[0],dst[2],dst[3]]);
    }
  }
}
customElements.define('cypress-tree', CypressTree);
