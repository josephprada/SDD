import { z } from "zod";

export type JsonSchemaProperty = Record<string, unknown>;

export interface JsonSchemaObject {
	type: "object";
	properties: Record<string, JsonSchemaProperty>;
	required: string[];
}

function isOptionalZodType(schema: z.ZodTypeAny): boolean {
	return (
		schema instanceof z.ZodOptional ||
		schema instanceof z.ZodDefault ||
		schema.isOptional()
	);
}

function withDescription(
	schema: z.ZodTypeAny,
	base: JsonSchemaProperty,
): JsonSchemaProperty {
	return schema.description
		? { ...base, description: schema.description }
		: base;
}

/** Convierte un tipo Zod individual a un fragmento de JSON Schema (subset pragmático). */
export function zodTypeToJsonSchema(schema: z.ZodTypeAny): JsonSchemaProperty {
	if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
		return zodTypeToJsonSchema(schema.unwrap());
	}
	if (schema instanceof z.ZodDefault) {
		return {
			...zodTypeToJsonSchema(schema.removeDefault()),
			default: schema._def.defaultValue(),
		};
	}
	if (schema instanceof z.ZodString) {
		return withDescription(schema, { type: "string" });
	}
	if (schema instanceof z.ZodNumber) {
		return withDescription(schema, { type: "number" });
	}
	if (schema instanceof z.ZodBoolean) {
		return withDescription(schema, { type: "boolean" });
	}
	if (schema instanceof z.ZodEnum) {
		return withDescription(schema, { type: "string", enum: schema.options });
	}
	if (schema instanceof z.ZodLiteral) {
		return { const: schema.value };
	}
	if (schema instanceof z.ZodArray) {
		return withDescription(schema, {
			type: "array",
			items: zodTypeToJsonSchema(schema.element),
		});
	}
	if (schema instanceof z.ZodObject) {
		return { type: "object", ...zodShapeToJsonSchema(schema.shape) };
	}
	if (schema instanceof z.ZodRecord) {
		return {
			type: "object",
			additionalProperties: zodTypeToJsonSchema(schema.valueSchema),
		};
	}
	if (schema instanceof z.ZodUnion) {
		const options = schema.options as z.ZodTypeAny[];
		return { anyOf: options.map((option) => zodTypeToJsonSchema(option)) };
	}
	return {};
}

/** Convierte una `ZodRawShape` (usada por `server.tool`) a un JSON Schema de tipo objeto. */
export function zodShapeToJsonSchema(
	shape: z.ZodRawShape,
): Omit<JsonSchemaObject, "type"> {
	const properties: Record<string, JsonSchemaProperty> = {};
	const required: string[] = [];

	for (const [key, value] of Object.entries(shape)) {
		properties[key] = zodTypeToJsonSchema(value);
		if (!isOptionalZodType(value)) {
			required.push(key);
		}
	}

	return { properties, required };
}

export function zodShapeToInputSchema(shape: z.ZodRawShape): JsonSchemaObject {
	return { type: "object", ...zodShapeToJsonSchema(shape) };
}
