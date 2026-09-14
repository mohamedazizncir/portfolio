import { loadContactDetail } from "@/lib/actions/contact";
import { loadProjectCatalogue } from "@/lib/actions/resolve";
import { HomeChat } from "@/components/chat/HomeChat";

/**
 * Server shell around the chat client component. Its only job is to read
 * the knowledge files the client needs up front on the server: the contact
 * details from knowledge/contact.md, so the "get in touch" row uses the same
 * single source as the chat's SHOW_CONTACT card rather than a second,
 * hard-coded copy, and every project in knowledge/projects/ for the details
 * panel's project browser. Everything interactive lives in HomeChat.
 */
export default async function Home() {
  const [contact, projects] = await Promise.all([
    loadContactDetail(),
    loadProjectCatalogue(),
  ]);
  return <HomeChat contact={contact} projects={projects} />;
}
