export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");

    // Root cause of the intermittent Gemini ConnectTimeoutError: Node's
    // default DNS result order is "verbatim" (as returned by the DNS
    // server), and some networks — VPN adapters in particular — advertise
    // an IPv6 route that doesn't actually work while IPv4 is fine. When
    // the IPv6 address happens to be tried first, the connection hangs
    // until the connect timeout fires instead of falling back to IPv4.
    // Preferring IPv4 avoids that class of failure entirely, for every
    // outbound fetch in this app (Gemini embeddings, Gemini/Groq chat).
    dns.setDefaultResultOrder("ipv4first");
  }
}
