export interface GalaxyEngine {
  setPointer: (x: number, y: number) => void;
  destroy: () => void;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
  brightness: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  life: number;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function createGalaxyEngine(
  canvas: HTMLCanvasElement,
  options: { reducedMotion?: boolean } = {},
): GalaxyEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { setPointer: () => {}, destroy: () => {} };
  }

  const reducedMotion = options.reducedMotion ?? false;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let pointerX = 0;
  let pointerY = 0;
  let animationId = 0;
  let lastSpawn = 0;
  let nextSpawnIn = 1800;

  const stars: Star[] = [];
  const meteors: Meteor[] = [];

  const resize = () => {
    const parent = canvas.parentElement;
    width = parent?.clientWidth ?? window.innerWidth;
    height = parent?.clientHeight ?? window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const seedStars = () => {
    stars.length = 0;
    const count = Math.floor((width * height) / 9000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() > 0.92 ? 1.4 : Math.random() * 0.9 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: randomBetween(0.4, 1.4),
        brightness: randomBetween(0.35, 1),
      });
    }
  };

  const spawnMeteor = (time: number) => {
    if (meteors.length >= 4) {
      return;
    }

    const angle = randomBetween(-0.95, -0.55);
    const speed = randomBetween(7, 14);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const margin = 120;
    const startTop = Math.random() > 0.35;

    let x: number;
    let y: number;

    if (startTop) {
      x = randomBetween(-margin, width + margin);
      y = randomBetween(-margin, height * 0.45);
    } else {
      x = randomBetween(-margin, width * 0.55);
      y = randomBetween(-margin, height * 0.35);
    }

    meteors.push({
      x,
      y,
      vx,
      vy,
      length: randomBetween(90, 180),
      opacity: randomBetween(0.55, 0.95),
      life: 1,
    });

    lastSpawn = time;
    nextSpawnIn = randomBetween(1200, 3800);
  };

  const drawStars = (time: number) => {
    const parallaxX = pointerX * 18;
    const parallaxY = pointerY * 14;

    for (const star of stars) {
      const twinkle = reducedMotion
        ? star.brightness * 0.7
        : star.brightness * (0.45 + 0.55 * Math.sin(time * 0.0012 * star.speed + star.phase));

      const x = star.x + parallaxX * (star.radius * 0.6);
      const y = star.y + parallaxY * (star.radius * 0.6);

      const isAccent = star.radius > 1.1 && star.brightness > 0.75;
      ctx.fillStyle = isAccent
        ? `rgba(7, 251, 162, ${twinkle * 0.85})`
        : `rgba(240, 248, 255, ${twinkle})`;

      ctx.beginPath();
      ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      ctx.fill();

      if (!reducedMotion && star.brightness > 0.8 && twinkle > 0.7) {
        ctx.fillStyle = `rgba(7, 251, 162, ${twinkle * 0.15})`;
        ctx.beginPath();
        ctx.arc(x, y, star.radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawMeteors = () => {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const meteor = meteors[i];
      const tailX = meteor.x - meteor.vx * (meteor.length / 12);
      const tailY = meteor.y - meteor.vy * (meteor.length / 12);

      const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.opacity})`);
      gradient.addColorStop(0.15, `rgba(180, 255, 230, ${meteor.opacity * 0.85})`);
      gradient.addColorStop(0.45, `rgba(7, 251, 162, ${meteor.opacity * 0.45})`);
      gradient.addColorStop(1, "rgba(7, 251, 162, 0)");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(meteor.x, meteor.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, ${meteor.opacity})`;
      ctx.shadowColor = "rgba(7, 251, 162, 0.9)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(meteor.x, meteor.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      meteor.x += meteor.vx;
      meteor.y += meteor.vy;
      meteor.life -= 0.008;
      meteor.opacity *= 0.992;

      const outOfBounds =
        meteor.x < -200 || meteor.x > width + 200 || meteor.y < -200 || meteor.y > height + 200;

      if (outOfBounds || meteor.life <= 0 || meteor.opacity < 0.05) {
        meteors.splice(i, 1);
      }
    }
  };

  const render = (time: number) => {
    ctx.clearRect(0, 0, width, height);

    drawStars(time);

    if (!reducedMotion) {
      if (time - lastSpawn > nextSpawnIn) {
        spawnMeteor(time);
      }
      drawMeteors();
    }

    animationId = requestAnimationFrame(render);
  };

  const onResize = () => {
    resize();
    seedStars();
  };

  resize();
  seedStars();
  animationId = requestAnimationFrame(render);
  window.addEventListener("resize", onResize);

  return {
    setPointer(x, y) {
      pointerX = x;
      pointerY = y;
    },
    destroy() {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      meteors.length = 0;
      stars.length = 0;
    },
  };
}
