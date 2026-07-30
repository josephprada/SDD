import { CreateApiTokenDialog } from "@app/components/settings/CreateApiTokenDialog";
import { TokenSecretOnceDialog } from "@app/components/settings/TokenSecretOnceDialog";
import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";
import { FieldError } from "@app/components/ui/FieldError";
import { formatConvexError } from "@app/lib/convex/formatError";
import {
	cursorRemoteSnippet,
	stdioSnippet,
} from "@app/lib/mcp/connectionSnippets";
import { type ApiScope, SCOPE_LABELS_ES } from "@app/lib/mcp/types";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@jp-ds";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

const STATUS_LABEL: Record<string, string> = {
	active: "Activo",
	expired: "Caducado",
	revoked: "Revocado",
};

function formatWhen(ts?: number): string {
	if (!ts) return "—";
	return new Date(ts).toLocaleString("es-CO", {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function summarizeScopes(scopes: string[]): string {
	const reads = scopes.filter((s) => s.startsWith("read:")).length;
	const writes = scopes.filter((s) => s.startsWith("write:")).length;
	const destructive = scopes.includes("destructive");
	const parts = [`${reads} lectura`];
	if (writes) parts.push(`${writes} escritura`);
	if (destructive) parts.push("borrar");
	return parts.join(" · ");
}

export function ApiAccessSection() {
	const tokens = useQuery(api.apiTokens.list);
	const audit = useQuery(api.apiAudit.listRecent, { limit: 15 });
	const createToken = useMutation(api.apiTokens.create);
	const revokeToken = useMutation(api.apiTokens.revoke);

	const [createOpen, setCreateOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [plaintext, setPlaintext] = useState<string | null>(null);
	const [revokeId, setRevokeId] = useState<Id<"apiTokens"> | null>(null);
	const [helpOpen, setHelpOpen] = useState(false);
	const [copiedHelp, setCopiedHelp] = useState<"remote" | "stdio" | null>(null);

	const handleCreate = async (input: {
		name: string;
		scopes: ApiScope[];
		expiresAt?: number;
	}) => {
		setBusy(true);
		setError("");
		try {
			const result = await createToken(input);
			setCreateOpen(false);
			setPlaintext(result.tokenPlaintext);
		} catch (e) {
			setError(formatConvexError(e, "No se pudo crear el token"));
			throw e;
		} finally {
			setBusy(false);
		}
	};

	const handleRevoke = async () => {
		if (!revokeId) return;
		setBusy(true);
		setError("");
		try {
			await revokeToken({ tokenId: revokeId });
			setRevokeId(null);
		} catch (e) {
			setError(formatConvexError(e, "No se pudo revocar el token"));
		} finally {
			setBusy(false);
		}
	};

	const copyHelp = async (kind: "remote" | "stdio", text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedHelp(kind);
			window.setTimeout(() => setCopiedHelp(null), 2000);
		} catch {
			setCopiedHelp(null);
		}
	};

	return (
		<section className="settings-section">
			<h2 className="settings-section__title">Acceso para agentes / MCP</h2>
			<div className="settings-card glass api-access">
				<p className="api-access__intro">
					Genera tokens para conectar Claude, Cursor, Gemini u otros agentes MCP
					a tus finanzas. Por defecto solo lectura; revoca en cualquier momento.
				</p>

				<div className="api-access__actions">
					<Button onClick={() => setCreateOpen(true)}>Nuevo token</Button>
					<Button variant="secondary" onClick={() => setHelpOpen((v) => !v)}>
						{helpOpen ? "Ocultar conexión" : "Cómo conectar"}
					</Button>
				</div>

				{helpOpen ? (
					<div className="api-access__help">
						<p>
							1. Crea un token y copia el secreto. 2. Pega la config en tu
							cliente MCP. 3. Pregunta por tus finanzas en lenguaje natural.
						</p>
						<p className="api-access__help-note">
							URL remota por defecto:{" "}
							<code>https://mcp.wallet.lavalex.co/mcp</code> (local:{" "}
							<code>http://127.0.0.1:3100/mcp</code>). Sustituye{" "}
							<code>jpw_TU_TOKEN</code> tras crear uno.
						</p>
						<pre className="api-token-secret__pre">
							{cursorRemoteSnippet("jpw_TU_TOKEN")}
						</pre>
						<Button
							variant="secondary"
							fullWidth
							onClick={() =>
								void copyHelp("remote", cursorRemoteSnippet("jpw_TU_TOKEN"))
							}
						>
							{copiedHelp === "remote" ? "Copiado" : "Copiar plantilla remota"}
						</Button>
						<pre className="api-token-secret__pre">
							{stdioSnippet("jpw_TU_TOKEN")}
						</pre>
						<Button
							variant="secondary"
							fullWidth
							onClick={() =>
								void copyHelp("stdio", stdioSnippet("jpw_TU_TOKEN"))
							}
						>
							{copiedHelp === "stdio" ? "Copiado" : "Copiar plantilla stdio"}
						</Button>
					</div>
				) : null}

				{error ? <FieldError message={error} /> : null}

				{tokens === undefined ? (
					<p className="api-access__empty">Cargando tokens…</p>
				) : tokens.length === 0 ? (
					<p className="api-access__empty">
						Aún no tienes tokens. Crea uno para conectar un agente.
					</p>
				) : (
					<ul className="api-access__list">
						{tokens.map((token) => (
							<li key={token._id} className="api-access__item">
								<div className="api-access__item-main">
									<strong>{token.name}</strong>
									<span className="api-access__meta">
										<code>{token.tokenPrefix}…</code>
										{" · "}
										{STATUS_LABEL[token.status] ?? token.status}
									</span>
									<span className="api-access__meta">
										{summarizeScopes(token.scopes)}
									</span>
									<span className="api-access__meta">
										Creado {formatWhen(token.createdAt)}
										{token.lastUsedAt
											? ` · Último uso ${formatWhen(token.lastUsedAt)}`
											: ""}
										{token.expiresAt
											? ` · Caduca ${formatWhen(token.expiresAt)}`
											: " · Sin caducidad"}
									</span>
									<details className="api-access__scopes">
										<summary>Ver permisos</summary>
										<ul>
											{token.scopes.map((scope) => (
												<li key={scope}>
													{SCOPE_LABELS_ES[scope as ApiScope] ?? scope}
												</li>
											))}
										</ul>
									</details>
								</div>
								{token.status === "active" ? (
									<Button
										variant="secondary"
										onClick={() => setRevokeId(token._id)}
										disabled={busy}
									>
										Revocar
									</Button>
								) : null}
							</li>
						))}
					</ul>
				)}

				<div className="api-access__audit">
					<h3 className="api-access__audit-title">Actividad reciente</h3>
					{audit === undefined ? (
						<p className="api-access__empty">Cargando…</p>
					) : audit.length === 0 ? (
						<p className="api-access__empty">Sin eventos todavía.</p>
					) : (
						<ul className="api-access__audit-list">
							{audit.map((row) => (
								<li key={row._id}>
									<span
										className={
											row.success ? "api-access__ok" : "api-access__fail"
										}
									>
										{row.success ? "OK" : "ERR"}
									</span>{" "}
									<code>{row.action}</code>
									{row.tokenPrefix ? ` · ${row.tokenPrefix}…` : ""}
									{" · "}
									{formatWhen(row.createdAt)}
									{row.errorCode ? ` · ${row.errorCode}` : ""}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			<CreateApiTokenDialog
				open={createOpen}
				busy={busy}
				error={error}
				onClose={() => {
					setCreateOpen(false);
					setError("");
				}}
				onSubmit={handleCreate}
			/>

			<TokenSecretOnceDialog
				open={plaintext !== null}
				tokenPlaintext={plaintext ?? ""}
				onClose={() => setPlaintext(null)}
			/>

			<ConfirmDialog
				open={revokeId !== null}
				title="Revocar token"
				description="El agente dejará de poder usar este token de inmediato. No se puede deshacer; crea uno nuevo si lo necesitas."
				confirmLabel="Revocar"
				cancelLabel="Cancelar"
				variant="danger"
				onConfirm={() => void handleRevoke()}
				onCancel={() => setRevokeId(null)}
			/>
		</section>
	);
}
