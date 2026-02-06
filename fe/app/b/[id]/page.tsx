import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Short URL alias for bout pages.
 * /b/:id redirects to /bout/:id
 * 
 * This enables short share URLs like thepit.cloud/b/abc123
 * while keeping the canonical bout page at /bout/[id].
 */
export default async function ShortBoutRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/bout/${id}`);
}
