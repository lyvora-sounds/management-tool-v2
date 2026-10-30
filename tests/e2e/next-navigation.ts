export function useRouter() {
  return {
    replace(href: string) {
      window.dispatchEvent(new CustomEvent("app:replace", { detail: href }));
    },
    push(href: string) {
      window.dispatchEvent(new CustomEvent("app:replace", { detail: href }));
    },
    refresh() {},
    back() {},
    forward() {},
    prefetch() {},
  };
}

export function usePathname() {
  return "/dashboard";
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function redirect(href: string): never {
  throw new Error(href);
}
