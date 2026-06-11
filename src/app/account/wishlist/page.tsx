import { redirect } from "next/navigation";

export default function AccountWishlistPage() {
  redirect("/account?tab=wishlist");
}
