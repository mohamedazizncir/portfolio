import { loadContactDetail } from "@/lib/actions/contact";
import { HomeChat } from "@/components/chat/HomeChat";

/**
 * Server shell around the chat client component. Its only job is to read
 * the contact details from knowledge/contact.md on the server and hand
 * them to the landing screen, so the "get in touch" row uses the same
 * single source as the chat's SHOW_CONTACT card rather than a second,
 * hard-coded copy. Everything interactive lives in HomeChat.
 */
export default async function Home() {
  const contact = await loadContactDetail();
  return <HomeChat contact={contact} />;
}
