import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ platform: string; name: string; tag: string }>;
}) {
  const { platform, name, tag } = await params;

  return (
    <ProfileClient
      platform={decodeURIComponent(platform)}
      name={decodeURIComponent(name)}
      tag={decodeURIComponent(tag)}
    />
  );
}
