import ThemeToggle from "@/components/ui/theme-toggle/ThemeToggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex w-full justify-end p-4">
        <ThemeToggle />
      </div>
      {children}
    </>
  );
}
