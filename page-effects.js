(function(){
  function initParticles(){
    const canvas = document.getElementById('particles');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize(){
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const particles = Array.from({length:45}, () => ({
      x:Math.random() * canvas.width,
      y:Math.random() * canvas.height,
      r:Math.random() * 1.4 + 0.5,
      dx:(Math.random() - 0.5) * 0.25,
      dy:(Math.random() - 0.5) * 0.25
    }));

    function frame(){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for(const p of particles){
        p.x = (p.x + p.dx + canvas.width) % canvas.width;
        p.y = (p.y + p.dy + canvas.height) % canvas.height;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(124,242,255,0.06)';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    frame();
  }

  initParticles();
})();
