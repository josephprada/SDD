import { useEffect, useRef } from "react";
import { createGalaxyEngine } from "./galaxyEngine";

export function AuroraOrbs() {
	const layerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const layer = layerRef.current;
		const canvas = canvasRef.current;
		if (!layer || !canvas) {
			return;
		}

		const reducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		const galaxy = createGalaxyEngine(canvas, { reducedMotion });

		let frame = 0;
		let targetX = 0;
		let targetY = 0;
		let currentX = 0;
		let currentY = 0;

		const applyPointer = () => {
			currentX += (targetX - currentX) * 0.08;
			currentY += (targetY - currentY) * 0.08;
			layer.style.setProperty("--pointer-x", currentX.toFixed(4));
			layer.style.setProperty("--pointer-y", currentY.toFixed(4));
			galaxy.setPointer(currentX, currentY);

			if (
				Math.abs(targetX - currentX) > 0.001 ||
				Math.abs(targetY - currentY) > 0.001
			) {
				frame = requestAnimationFrame(applyPointer);
			} else {
				frame = 0;
			}
		};

		const scheduleUpdate = () => {
			if (!frame) {
				frame = requestAnimationFrame(applyPointer);
			}
		};

		const handlePointer = (clientX: number, clientY: number) => {
			targetX = clientX / window.innerWidth - 0.5;
			targetY = clientY / window.innerHeight - 0.5;
			scheduleUpdate();
		};

		const onMouseMove = (event: MouseEvent) => {
			handlePointer(event.clientX, event.clientY);
		};

		const onTouchMove = (event: TouchEvent) => {
			const touch = event.touches[0];
			if (touch) {
				handlePointer(touch.clientX, touch.clientY);
			}
		};

		if (!reducedMotion) {
			window.addEventListener("mousemove", onMouseMove, { passive: true });
			window.addEventListener("touchmove", onTouchMove, { passive: true });
		}

		return () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("touchmove", onTouchMove);
			if (frame) {
				cancelAnimationFrame(frame);
			}
			galaxy.destroy();
		};
	}, []);

	return (
		<div ref={layerRef} className="aurora-orbs" aria-hidden>
			<canvas ref={canvasRef} className="galaxy-canvas" />

			<div className="aurora-orb-wrap aurora-orb-wrap--1">
				<span className="aurora-orb aurora-orb--1" />
			</div>
			<div className="aurora-orb-wrap aurora-orb-wrap--2">
				<span className="aurora-orb aurora-orb--2" />
			</div>
			<div className="aurora-orb-wrap aurora-orb-wrap--3">
				<span className="aurora-orb aurora-orb--3" />
			</div>
			<div className="aurora-orb-wrap aurora-orb-wrap--4">
				<span className="aurora-orb aurora-orb--4" />
			</div>
			<div className="aurora-orb-wrap aurora-orb-wrap--5">
				<span className="aurora-orb aurora-orb--5" />
			</div>
		</div>
	);
}
