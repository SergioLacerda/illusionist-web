/**
 * Joins the site base and a path. `import.meta.env.BASE_URL` ends with a slash
 * for a base declared as "/providence/" and without one for "/providence", so
 * plain string concatenation is wrong for the second form.
 */
export function withBase(path = '', base: string = import.meta.env.BASE_URL): string {
  const root = base.replace(/\/+$/, '');
  const rest = path.replace(/^\/+/, '');
  return rest === '' ? `${root}/` : `${root}/${rest}`;
}
