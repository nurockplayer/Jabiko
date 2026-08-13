import { type MouseEvent } from "react";
import { serializeRoute, type AppRoute } from "../domain/routes";
import { shouldInterceptCrumbClick, type BreadcrumbModel } from "../domain/breadcrumbs";

/**
 * Shared route-aware breadcrumb (#729). Rendered only for nested routes with a
 * real parent hierarchy (see buildBreadcrumbs in domain/breadcrumbs); parent
 * crumbs are real anchors with canonical `serializeRoute()` hrefs so direct
 * loads and in-app navigation produce identical output, and the current crumb
 * is a non-clickable element carrying `aria-current="page"`.
 */
export function AppBreadcrumbs({
  model,
  onNavigate
}: {
  model: BreadcrumbModel;
  onNavigate: (route: AppRoute) => void;
}) {
  return (
    <nav className="app-breadcrumbs" aria-label={model.label}>
      <ol className="app-breadcrumbs-list">
        {model.crumbs.map((crumb, index) => {
          const target = crumb.route;
          return (
            <li key={index} className="app-breadcrumbs-item">
              {index > 0 ? (
                <span className="app-breadcrumbs-sep" aria-hidden="true">
                  ›
                </span>
              ) : null}
              {target === null ? (
                <span className="app-breadcrumbs-current" aria-current="page" lang={crumb.lang}>
                  {crumb.label}
                </span>
              ) : (
                <a
                  className="app-breadcrumbs-link"
                  href={serializeRoute(target)}
                  lang={crumb.lang}
                  onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                    if (shouldInterceptCrumbClick(event)) {
                      event.preventDefault();
                      onNavigate(target);
                    }
                  }}
                >
                  {crumb.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
