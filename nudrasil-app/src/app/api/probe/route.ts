// Simple route boards can use to check WiFi connectivity

export function GET() {
  return new Response("ok", { status: 200 });
}
