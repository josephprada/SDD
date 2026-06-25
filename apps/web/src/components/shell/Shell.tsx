import { Outlet, useLocation } from "react-router";
import { SkipToContent } from "./SkipToContent";
import { Header } from "./Header";
import { NavMobile } from "./NavMobile";
import { NavDesktop } from "./NavDesktop";

export function Shell() {
  const location = useLocation();

  return (
    <div className="shell shell-bg">
      <SkipToContent />
      <NavDesktop />
      <div className="shell-content">
        <Header />
        <main id="main-content" className="shell__main">
          <div key={location.pathname} className="page-content animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <NavMobile />
    </div>
  );
}
