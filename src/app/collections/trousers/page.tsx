// Redirect: /collections/trousers → /collections/sweatpants
// This preserves any existing links/bookmarks while routing to the new Sweatpants collection.
import { redirect } from "next/navigation";

export default function TrousersRedirect() {
  redirect("/collections/sweatpants");
}
