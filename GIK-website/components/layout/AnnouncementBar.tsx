interface AnnouncementBarProps {
  message: string;
  show: boolean;
}

export function AnnouncementBar({ message, show }: AnnouncementBarProps) {
  if (!show) return null;

  return (
    <div className="bg-gik-void py-2 text-center text-xs tracking-wider text-gik-canvas">
      {message}
    </div>
  );
}
