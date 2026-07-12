/** Filtro SVG para warp sutil durante la animación genie. Montar una vez en la app. */
export function GenieModalSvgDefs() {
	return (
		<svg
			className="genie-modal-svg-defs"
			aria-hidden
			focusable="false"
			width="0"
			height="0"
		>
			<defs>
				<filter
					id="genie-warp"
					x="-12%"
					y="-12%"
					width="124%"
					height="124%"
					colorInterpolationFilters="sRGB"
				>
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.014 0.045"
						numOctaves="2"
						seed="4"
						result="noise"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="noise"
						scale="var(--genie-warp, 0)"
						xChannelSelector="R"
						yChannelSelector="G"
					/>
				</filter>
			</defs>
		</svg>
	);
}
