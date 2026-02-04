export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mem.now";

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
