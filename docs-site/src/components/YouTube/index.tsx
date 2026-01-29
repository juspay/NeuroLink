import styles from "./YouTube.module.css";

interface YouTubeProps {
  id: string;
  title?: string;
}

export function YouTube({ id, title = "YouTube video" }: YouTubeProps) {
  return (
    <div className={styles.wrapper}>
      <iframe
        className={styles.iframe}
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
