export const load = async ({ url }) => {
  // Hide navigation on the root route (landing page)
  const isRootRoute = url.pathname === '/';
  
  return {
    hideNav: isRootRoute
  };
}; 