/** Warp SVG: scale se sincroniza por JS desde --genie-warp (SVG no acepta var() fiable). */
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
					x="-20%"
					y="-20%"
					width="140%"
					height="140%"
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
						id="genie-displacement-map"
						in="SourceGraphic"
						in2="noise"
						scale="0"
						xChannelSelector="R"
						yChannelSelector="G"
					/>
				</filter>
			</defs>
		</svg>
	);
}
