import { useState } from "react";
import { api, ApiError } from "../../lib/api";

type Props = {
  jobId: string;
  onSubmitted?: () => void;
};

/** Basit 1–5 yıldız seçici ve opsiyonel yorum alanı. */
export default function ReviewForm({ jobId, onSubmitted }: Props) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (rating < 1) {
      setErr("Lütfen 1 ile 5 arasında bir puan seçin.");
      return;
    }
    setErr(null);
    setSubmitting(true);
    try {
      await api(`/jobs/${jobId}/review`, {
        method: "POST",
        json: { rating, comment: comment.trim() || null },
      });
      setDone(true);
      onSubmitted?.();
    } catch (e) {
      if (e instanceof ApiError && e.code === "ALREADY_REVIEWED") {
        setDone(true);
        return;
      }
      setErr(e instanceof Error ? e.message : "Gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ padding: 12, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
        <p style={{ margin: 0, fontWeight: 600, color: "#166534" }}>Teşekkürler, değerlendirmeniz kaydedildi.</p>
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: "1.05rem" }}>Çekiciyi değerlendirin</h3>
      <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
        Deneyiminiz diğer müşterilere yol gösterir.
      </p>

      <div role="radiogroup" aria-label="Puan" style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontSize: "2rem",
              lineHeight: 1,
              color: n <= shown ? "#f59e0b" : "#d1d5db",
              transition: "transform 0.1s",
              transform: hover === n ? "scale(1.1)" : "scale(1)",
            }}
            aria-label={`${n} yıldız`}
          >
            ★
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="review-comment" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          Yorum (opsiyonel)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Deneyiminizi kısaca paylaşın…"
          style={{ width: "100%", resize: "vertical" }}
        />
        <div className="muted" style={{ fontSize: "0.75rem", textAlign: "right" }}>
          {comment.length}/500
        </div>
      </div>

      {err ? <div className="error" style={{ marginTop: 8 }}>{err}</div> : null}

      <button
        type="button"
        className="btn btn-primary"
        disabled={submitting || rating < 1}
        onClick={submit}
        style={{ marginTop: 8 }}
      >
        {submitting ? "Gönderiliyor…" : "Gönder"}
      </button>
    </div>
  );
}
