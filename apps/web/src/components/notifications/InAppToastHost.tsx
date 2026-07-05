import { useToastStore } from "@app/stores/toast";
import { Link } from "react-router";

export function InAppToastHost() {
	const toasts = useToastStore((s) => s.toasts);
	const dismiss = useToastStore((s) => s.dismiss);

	if (toasts.length === 0) return null;

	return (
		<div className="toast-host" aria-live="polite">
			{toasts.map((t) => (
				<div key={t.id} className="toast glass">
					<div className="toast__content">
						<strong className="toast__title">{t.title}</strong>
						<p>{t.body}</p>
						{t.url ? (
							<Link to={t.url} onClick={() => dismiss(t.id)}>
								Ver
							</Link>
						) : null}
					</div>
					<button
						type="button"
						className="toast__close"
						onClick={() => dismiss(t.id)}
						aria-label="Cerrar"
					>
						×
					</button>
				</div>
			))}
		</div>
	);
}
