/**
 * Cliente HTTP hacia el gateway de agentes de Convex.
 * Ver contrato: changes/mcp-access/contracts/agent-gateway.md
 */

export type RpcErrorCode =
	| "unauthorized"
	| "forbidden"
	| "validation"
	| "not_found"
	| "confirmation_required"
	| "rate_limited"
	| "conflict"
	| "internal";

export type RpcResult =
	| { ok: true; tool: string; data: unknown }
	| { ok: false; error: { code: string; message: string } };

export interface CallAgentRpcOptions {
	siteUrl: string;
	token: string;
	tool: string;
	args: Record<string, unknown>;
	confirm?: boolean;
}

function httpStatusToErrorCode(status: number): RpcErrorCode {
	switch (status) {
		case 401:
			return "unauthorized";
		case 403:
			return "forbidden";
		case 400:
			return "validation";
		case 404:
			return "not_found";
		case 409:
			return "conflict";
		case 428:
			return "confirmation_required";
		case 429:
			return "rate_limited";
		default:
			return "internal";
	}
}

/**
 * Llama a `POST {siteUrl}/agent/v1/rpc` reenviando el Bearer del usuario.
 * Nunca lanza: siempre resuelve un `RpcResult`, incluso ante fallas de red.
 */
export async function callAgentRpc(
	opts: CallAgentRpcOptions,
): Promise<RpcResult> {
	const url = `${opts.siteUrl.replace(/\/$/, "")}/agent/v1/rpc`;

	let response: Response;
	try {
		response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${opts.token}`,
			},
			body: JSON.stringify({
				tool: opts.tool,
				args: opts.args ?? {},
				confirm: opts.confirm ?? false,
			}),
		});
	} catch (err) {
		return {
			ok: false,
			error: {
				code: "internal",
				message:
					err instanceof Error
						? `No se pudo contactar el gateway de JP-WALLET: ${err.message}`
						: "No se pudo contactar el gateway de JP-WALLET.",
			},
		};
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch {
		body = null;
	}

	if (body && typeof body === "object" && "ok" in body) {
		return body as RpcResult;
	}

	return {
		ok: false,
		error: {
			code: httpStatusToErrorCode(response.status),
			message: `El gateway respondió ${response.status} con un cuerpo inesperado.`,
		},
	};
}
