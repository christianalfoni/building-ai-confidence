export default defineEventHandler((event) => {
  const clientId = process.env.GITHUB_CLIENT_ID!;
  const redirectUri = `${process.env.APP_URL ?? 'http://localhost:5173'}/auth/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user`;
  return sendRedirect(event, url);
});
