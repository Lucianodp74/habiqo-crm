"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { acceptInvitation } from "@/lib/actions/invitations";

interface Props {
  token: string;
  email: string;
}

export function AcceptInviteForm({ token, email }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!fullName.trim() || !password) {
      toast.error("Compila tutti i campi");
      return;
    }

    setLoading(true);
    const result = await acceptInvitation({ token, fullName, password });
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Account creato! Benvenuto in HABIQUO 🎉");
    router.push("/dashboard");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    borderRadius: "6px",
    border: "1px solid var(--color-onyx-200, #e5e7eb)",
    fontSize: "0.875rem",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.375rem",
            color: "var(--color-onyx-700, #374151)",
          }}
        >
          Email
        </label>
        <input
          type="email"
          value={email}
          disabled
          style={{
            ...inputStyle,
            background: "var(--color-onyx-50, #f9fafb)",
            color: "var(--color-onyx-400, #9ca3af)",
          }}
        />
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.375rem",
            color: "var(--color-onyx-700, #374151)",
          }}
        >
          Nome completo
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Es. Flavia Mele"
          style={inputStyle}
        />
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.375rem",
            color: "var(--color-onyx-700, #374151)",
          }}
        >
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimo 8 caratteri"
          style={inputStyle}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "6px",
          background: loading
            ? "var(--color-onyx-300, #d1d5db)"
            : "var(--color-onyx-900, #111)",
          color: "white",
          fontWeight: 600,
          fontSize: "0.875rem",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          marginTop: "0.5rem",
          fontFamily: "inherit",
          transition: "background 0.15s",
        }}
      >
        {loading ? "Creazione account..." : "Crea account e unisciti"}
      </button>
    </div>
  );
}
