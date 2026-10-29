export const notificationCopy = {
  title: "Benachrichtigungen",
  badge: (count: number) =>
    count === 1
      ? "1 ungelesene Benachrichtigung"
      : `${count} ungelesene Benachrichtigungen`,
  filters: {
    all: "Alle",
    unread: "Ungelesen",
    VIEWING: "Besichtigungen",
    DOCUMENTS: "Unterlagen",
    APPLICATION: "Bewerbungen",
  },
  markRead: "Als gelesen markieren",
  markAll: "Alle als gelesen",
  loadMore: "Weitere laden",
  loading: "Benachrichtigungen werden geladen",
  emptyAll: "Keine Benachrichtigungen",
  emptyCategory: "Keine Benachrichtigungen in dieser Auswahl",
  emptyUnread: "Keine ungelesenen Benachrichtigungen",
  listError: "Benachrichtigungen konnten nicht geladen werden",
  retry: "Erneut versuchen",
  actionError: "Das hat nicht geklappt. Der Stand wird neu geladen.",
} as const;
