'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 粒子系统
    class Particle {
      x: number;
      y: number;
      radius: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
      canvasWidth: number;
      canvasHeight: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.radius = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
        const colors = [
          'rgba(59, 130, 246, ', // blue
          'rgba(34, 197, 94, ', // green
          'rgba(147, 51, 234, ', // purple
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > this.canvasWidth) this.speedX *= -1;
        if (this.y < 0 || this.y > this.canvasHeight) this.speedY *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color + this.opacity + ')';
        ctx.fill();
      }
    }

    // 创建粒子
    const particles: Particle[] = [];
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }

    // 网格线
    const gridSize = 100;
    let gridOffset = 0;

    // 光晕效果
    const glows: Array<{
      x: number;
      y: number;
      radius: number;
      opacity: number;
      speed: number;
    }> = [];

    // 创建初始光晕
    for (let i = 0; i < 3; i++) {
      glows.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 200 + 100,
        opacity: Math.random() * 0.3 + 0.1,
        speed: Math.random() * 0.5 + 0.2,
      });
    }

    // 动画循环
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制渐变背景（更深的深蓝色）
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height)
      );
      gradient.addColorStop(0, 'rgba(8, 12, 28, 0.8)');
      gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.9)');
      gradient.addColorStop(1, 'rgba(8, 12, 28, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制网格（更柔和的网格线）
      gridOffset += 0.5;
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.lineWidth = 0.5;

      // 垂直线
      for (let x = -gridOffset % gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // 水平线
      for (let y = -gridOffset % gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 绘制光晕
      glows.forEach((glow, index) => {
        glow.x += Math.sin(Date.now() * 0.001 + index) * glow.speed;
        glow.y += Math.cos(Date.now() * 0.001 + index) * glow.speed;
        glow.opacity += Math.sin(Date.now() * 0.002 + index) * 0.01;

        if (glow.x < 0) glow.x = canvas.width;
        if (glow.x > canvas.width) glow.x = 0;
        if (glow.y < 0) glow.y = canvas.height;
        if (glow.y > canvas.height) glow.y = 0;

        const glowGradient = ctx.createRadialGradient(
          glow.x,
          glow.y,
          0,
          glow.x,
          glow.y,
          glow.radius
        );
        // 柔和的蓝色和青色光晕
        glowGradient.addColorStop(0, `rgba(96, 165, 250, ${glow.opacity * 0.6})`);
        glowGradient.addColorStop(0.3, `rgba(34, 211, 238, ${glow.opacity * 0.4})`);
        glowGradient.addColorStop(0.6, `rgba(34, 197, 94, ${glow.opacity * 0.2})`);
        glowGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.fillStyle = glowGradient;
        ctx.fillRect(
          glow.x - glow.radius,
          glow.y - glow.radius,
          glow.radius * 2,
          glow.radius * 2
        );
      });

      // 绘制粒子
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      // 连接附近的粒子（更柔和的连接线）
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * (1 - distance / 150)})`;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}
