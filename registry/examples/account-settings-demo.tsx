"use client";

import { useState } from "react";

import { AccountSettings, type AccountNotification } from "@rhs-ui/application/account-settings";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
] as const;

export default function Demo(): React.JSX.Element {
  const [notifications, setNotifications] = useState<AccountNotification[]>([
    { key: "mentions", title: "Mentions", description: "When someone asks for your review.", enabled: true },
    { key: "digest", title: "Daily digest", description: "One email at 9:00 with what moved.", enabled: true },
    { key: "product", title: "Product news", description: "New features, once a month at most.", enabled: false },
  ]);
  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    return (
      <p role="status" className="py-24 text-center text-sm text-muted-foreground">
        The account would be deleted now. This is a preview, so nothing happened.
      </p>
    );
  }

  return (
    <div className="flex justify-center py-6">
      <AccountSettings
        profile={{ name: "Lotte de Vries", email: "lotte@fieldwork.studio", language: "en" }}
        languages={LANGUAGES}
        notifications={notifications}
        onSaveProfile={async (profile) => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          if (!profile.email.includes("@")) return "That email address is missing an @.";
        }}
        onNotificationChange={(key, enabled) => setNotifications((items) => items.map((item) => (item.key === key ? { ...item, enabled } : item)))}
        onDeleteAccount={async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setDeleted(true);
        }}
      />
    </div>
  );
}
