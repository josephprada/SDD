import { Modal } from "@app/components/ui/Modal";
import {
	cursorRemoteSnippet,
	stdioSnippet,
} from "@app/lib/mcp/connectionSnippets";
import { Button } from "@jp-ds";
import { useState } from "react";

type TokenSecretOnceDialogProps = {
	open: boolean;
	tokenPlaintext: string;
	onClose: () => void;
};

export function TokenSecretOnceDialog({
	open,
	tokenPlaintext,
	onClose,
}: TokenSecretOnceDialogProps) {
	const [copied, setCopied] = useState<"token" | "remote" | "stdio" | null>(
		null,
	);

	const copy = async (kind: "token" | "remote" | "stdio", text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(kind);
			window.setTimeout(() => setCopied(null), 2000);
		} catch {
			setCopied(null);
		}
	};

	return (
		<Modal open={open} title="Guarda tu token" onClose={onClose}>
			<div className="api-token-secret">
				<p className="api-token-secret__warn">
					Este secreto solo se muestra <strong>una vez</strong>. Cópialo ahora;
					si lo pierdes tendrás que revocar y crear otro.
				</p>
				<code className="api-token-secret__value">{tokenPlaintext}</code>
				<Button fullWidth onClick={() => void copy("token", tokenPlaintext)}>
					{copied === "token" ? "Copiado" : "Copiar token"}
				</Button>

				<details className="api-token-secret__details">
					<summary>Config MCP remoto (Cursor / Claude)</summary>
					<pre className="api-token-secret__pre">
						{cursorRemoteSnippet(tokenPlaintext)}
					</pre>
					<Button
						variant="secondary"
						fullWidth
						onClick={() =>
							void copy("remote", cursorRemoteSnippet(tokenPlaintext))
						}
					>
						{copied === "remote" ? "Copiado" : "Copiar snippet remoto"}
					</Button>
				</details>

				<details className="api-token-secret__details">
					<summary>Config MCP local (stdio)</summary>
					<pre className="api-token-secret__pre">
						{stdioSnippet(tokenPlaintext)}
					</pre>
					<Button
						variant="secondary"
						fullWidth
						onClick={() => void copy("stdio", stdioSnippet(tokenPlaintext))}
					>
						{copied === "stdio" ? "Copiado" : "Copiar snippet stdio"}
					</Button>
				</details>

				<Button variant="secondary" fullWidth onClick={onClose}>
					Ya lo guardé
				</Button>
			</div>
		</Modal>
	);
}
