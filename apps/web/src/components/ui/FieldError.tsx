type FieldErrorProps = {
	id?: string;
	message?: string;
};

export function FieldError({ id, message }: FieldErrorProps) {
	if (!message) return null;
	return (
		<span id={id} className="field-error" role="alert">
			{message}
		</span>
	);
}
