type AvatarProps = {
  url?: string | null;
  color?: string;
  name?: string | null;
  className: string;
  style?: React.CSSProperties;
};

// Renders a profile photo when one is set, falling back to the existing
// colored-circle-with-initial look otherwise. `className` must be one of
// the avatar CSS classes (.avatar, .profile-avatar, .review-avatar, ...)
// that already define width/height/border-radius.
export default function Avatar({ url, color, name, className, style }: AvatarProps) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ? `${name}'s photo` : "Profile photo"}
        className={className}
        style={{ ...style, objectFit: "cover", display: "block" }}
      />
    );
  }
  return (
    <div className={className} style={{ ...style, background: color }}>
      {name?.charAt(0) ?? "?"}
    </div>
  );
}
