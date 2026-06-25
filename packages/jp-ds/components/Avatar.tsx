import "./components.css";

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
}

export function Avatar({ src, alt, name }: AvatarProps) {
  if (src) {
    return (
      <div className="jp-avatar">
        <img src={src} alt={alt ?? name ?? "Avatar"} />
      </div>
    );
  }

  const initial = name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div
      className="jp-avatar"
      aria-hidden={!name}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-text-primary)",
        fontWeight: 600,
      }}
    >
      {initial}
    </div>
  );
}
