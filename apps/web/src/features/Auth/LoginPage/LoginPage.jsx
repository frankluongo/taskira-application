import { useState } from "react";
import { Navigate } from "react-router";
import { useAuth } from "@/services/auth";
import { supabase } from "@/services/supabase";
import { Button, Form, Input } from "@taskira/ui";
import css from "./LoginPage.module.css";

export function LoginPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  return (
    <div className={css.wrapper}>
      <div className={css.card}>
        <h1 className={css.title}>Taskira</h1>

        <Form onSubmit={handleSubmit}>
          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className={css.error}>{error}</p>}

          <Button type="submit" disabled={loading} variant="primary">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </Form>
      </div>
    </div>
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }
}
