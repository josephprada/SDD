import { useState } from "react";
import { useNavigate } from "react-router";
import { Avatar } from "@jp-ds/index";
import { useAuth } from "@app/lib/auth/useAuth";

export function UserMenu() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!session) {
    return null;
  }

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-menu__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar src={session.picture} name={session.name} alt={session.name} />
        <span className="settings-row__title">{session.name}</span>
      </button>
      {open ? (
        <div className="user-menu__dropdown glass animate-menu-in" role="menu">
          <button
            type="button"
            className="user-menu__item"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              navigate("/login", { replace: true });
            }}
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
