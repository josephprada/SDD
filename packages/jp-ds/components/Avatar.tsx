import { useEffect, useState } from "react";
import "./components.css";

export interface AvatarProps {
	src?: string;
	alt?: string;
	name?: string;
}

export function Avatar({ src, alt, name }: AvatarProps) {
	const [imageFailed, setImageFailed] = useState(false);
	const initial = name?.charAt(0).toUpperCase() ?? "?";
	const imageSrc = src?.trim();
	const showImage = Boolean(imageSrc) && !imageFailed;

	useEffect(() => {
		setImageFailed(false);
	}, [imageSrc]);

	return (
		<div className="jp-avatar">
			{showImage ? (
				<img
					src={imageSrc}
					alt={alt ?? name ?? "Avatar"}
					referrerPolicy="no-referrer"
					onError={() => setImageFailed(true)}
				/>
			) : (
				<span className="jp-avatar__initial" aria-hidden={!name}>
					{initial}
				</span>
			)}
		</div>
	);
}
