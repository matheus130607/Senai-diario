import React, { useRef, useEffect } from 'react';

const TechBackground = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const config = {
    whiteParticlesCount: 70,
    redPointsCount: 28,
    connectionDistance: 160,
    parallaxStrength: 0.015,
  };

  class WhiteParticle {
    constructor(width, height) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.radius = Math.random() * 2 + 0.8;
      this.speedX = (Math.random() - 0.5) * 0.9;
      this.speedY = (Math.random() - 0.5) * 0.8;
      this.alpha = Math.random() * 0.4 + 0.2;
    }
    update(width, height, mouseX, mouseY) {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
      this.x += mouseX * config.parallaxStrength * 0.8;
      this.y += mouseY * config.parallaxStrength * 0.8;
    }
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.fill();
    }
  }

  class RedPoint {
    constructor(width, height) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      // Velocidades para movimento (valores suaves, mas perceptíveis)
      this.speedX = (Math.random() - 0.5) * 1.7;   // mesma base das partículas brancas
      this.speedY = (Math.random() - 0.5) * 1.8;
      this.baseRadius = Math.random() * 2.5 + 1.8;
      this.pulseSpeed = 0.04 + Math.random() * 0.08;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }
    update(width, height, mouseX, mouseY) {
      // Movimento
      this.x += this.speedX;
      this.y += this.speedY;
      // Atravessar bordas
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
      // Pequeno parallax do mouse
      this.x += mouseX * config.parallaxStrength * 0.5;
      this.y += mouseY * config.parallaxStrength * 0.5;
    }
    getRadius(time) {
      const pulse = Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.6;
      return Math.max(1.2, this.baseRadius + pulse);
    }
    draw(ctx, time, withGlow = true) {
      const radius = this.getRadius(time);
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      if (withGlow) {
        ctx.shadowColor = 'rgba(255, 50, 50, 0.7)';
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = '#ff4d4d';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let whiteParticles = [];
    let redPoints = [];
    let animationTime = 0;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      whiteParticles = [];
      for (let i = 0; i < config.whiteParticlesCount; i++) {
        whiteParticles.push(new WhiteParticle(width, height));
      }
      redPoints = [];
      for (let i = 0; i < config.redPointsCount; i++) {
        redPoints.push(new RedPoint(width, height));
      }
    };

    const animate = () => {
      if (!ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      animationTime += 0.05;

      // Fundo gradiente
      const grad = ctx.createLinearGradient(0, 0, width * 0.7, height);
      grad.addColorStop(0, '#05050A');
      grad.addColorStop(0.6, '#0C0C14');
      grad.addColorStop(1, '#12121C');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const radGrad = ctx.createRadialGradient(width / 2, height * 0.15, 0, width / 2, height * 0.15, width * 0.5);
      radGrad.addColorStop(0, 'rgba(80, 80, 100, 0.12)');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      // Atualiza partículas brancas
      for (let p of whiteParticles) {
        p.update(width, height, mouseX, mouseY);
        p.draw(ctx);
      }

      // Atualiza pontos vermelhos (agora com movimento)
      for (let p of redPoints) {
        p.update(width, height, mouseX, mouseY);
      }

      // Conexões entre pontos vermelhos (desenha após a atualização de posições)
      for (let i = 0; i < redPoints.length; i++) {
        for (let j = i + 1; j < redPoints.length; j++) {
          const dx = redPoints[i].x - redPoints[j].x;
          const dy = redPoints[i].y - redPoints[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < config.connectionDistance) {
            const intensity = (1 - dist / config.connectionDistance) * 0.35;
            const alpha = intensity ;
            ctx.beginPath();
            ctx.moveTo(redPoints[i].x, redPoints[i].y);
            ctx.lineTo(redPoints[j].x, redPoints[j].y);
            ctx.strokeStyle = `rgba(220, 60, 60, ${alpha * 3})`;
            ctx.lineWidth = 2.4;
            ctx.stroke();
          }
        }
      }

      // Desenha os pontos vermelhos por cima das conexões
      for (let p of redPoints) {
        p.draw(ctx, animationTime, true);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default TechBackground;