<template>
  <canvas ref="canvasRef" class="absolute inset-0 w-full h-full pointer-events-none" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import type { Phase } from "../composables/useBreathingEngine.js";

const props = defineProps<{
  phase: Phase;
  phaseProgress: number;
}>();

interface Particle {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  baseSpeed: number;
  size: number;
  opacity: number;
  hue: number;
  trail: { x: number; y: number }[];
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animationId = 0;
let particles: Particle[] = [];

const PARTICLE_COUNT = 40;
const TRAIL_LENGTH = 6;

function createParticles(width: number, height: number): Particle[] {
  const minR = 60;
  const maxR = Math.min(width, height) * 0.4;

  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const seed = i * 137.5; // golden angle for even distribution
    const t = (i / PARTICLE_COUNT);
    return {
      angle: (seed * Math.PI) / 180,
      radius: minR + t * (maxR - minR),
      baseRadius: minR + t * (maxR - minR),
      speed: 0.003 + (i % 5) * 0.001,
      baseSpeed: 0.003 + (i % 5) * 0.001,
      size: 2 + (i % 3),
      opacity: 0.4 + (i % 4) * 0.1,
      hue: 200 + (i % 8) * 10,
      trail: [],
    };
  });
}

function getPhaseParams(phase: Phase) {
  switch (phase) {
    case "inhale":
      return { speedMult: 2.0, radiusTarget: 0.3, opacityMult: 1.2, hueShift: 10 };
    case "hold":
      return { speedMult: 0.3, radiusTarget: 1.0, opacityMult: 0.9, hueShift: 30 };
    case "exhale":
      return { speedMult: 0.5, radiusTarget: 1.5, opacityMult: 0.7, hueShift: 50 };
    case "holdAfterExhale":
      return { speedMult: 0.1, radiusTarget: 1.5, opacityMult: 0.3, hueShift: 50 };
    default:
      return { speedMult: 0, radiusTarget: 1.0, opacityMult: 0, hueShift: 0 };
  }
}

function draw() {
  if (!ctx || !canvasRef.value) return;
  const canvas = canvasRef.value;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (props.phase === "idle") {
    animationId = requestAnimationFrame(draw);
    return;
  }

  const params = getPhaseParams(props.phase);

  for (const p of particles) {
    p.angle += p.speed;

    const targetRadius = p.baseRadius * params.radiusTarget;
    p.radius += (targetRadius - p.radius) * 0.02;

    const targetSpeed = p.baseSpeed * params.speedMult;
    p.speed += (targetSpeed - p.speed) * 0.03;

    const x = cx + Math.cos(p.angle) * p.radius;
    const y = cy + Math.sin(p.angle) * p.radius;

    p.trail.push({ x, y });
    if (p.trail.length > TRAIL_LENGTH) p.trail.shift();

    // Draw trail
    if (p.trail.length > 1) {
      for (let i = 0; i < p.trail.length - 1; i++) {
        const t = i / p.trail.length;
        ctx.beginPath();
        ctx.moveTo(p.trail[i].x * dpr, p.trail[i].y * dpr);
        ctx.lineTo(p.trail[i + 1].x * dpr, p.trail[i + 1].y * dpr);
        ctx.strokeStyle = `hsla(${p.hue + params.hueShift}, 80%, 70%, ${t * p.opacity * params.opacityMult * 0.4})`;
        ctx.lineWidth = p.size * t * dpr;
        ctx.stroke();
      }
    }

    // Draw particle
    const px = x * dpr;
    const py = y * dpr;
    const pr = p.size * 2 * dpr;
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, pr);
    gradient.addColorStop(0, `hsla(${p.hue + params.hueShift}, 80%, 80%, ${p.opacity * params.opacityMult})`);
    gradient.addColorStop(1, `hsla(${p.hue + params.hueShift}, 80%, 70%, 0)`);

    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  animationId = requestAnimationFrame(draw);
}

function resize() {
  if (!canvasRef.value) return;
  const canvas = canvasRef.value;
  const parent = canvas.parentElement;
  if (!parent) return;
  const dpr = window.devicePixelRatio || 1;
  const w = parent.clientWidth;
  const h = parent.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  particles = createParticles(w, h);
}

onMounted(() => {
  if (!canvasRef.value) return;
  ctx = canvasRef.value.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
  animationId = requestAnimationFrame(draw);
});

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener("resize", resize);
});

watch(() => props.phase, () => {
  // Phase change — particle params update naturally via getPhaseParams on next frame
});
</script>
