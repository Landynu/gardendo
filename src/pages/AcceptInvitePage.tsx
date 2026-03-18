import { acceptInvitation } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { Leaf, CheckCircle, XCircle, LogIn } from "lucide-react";

export function AcceptInvitePage() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token" | "need-login">("loading");
  const [propertyName, setPropertyName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    if (authLoading) return;

    if (!user) {
      setStatus("need-login");
      return;
    }

    // Accept the invitation
    acceptInvitation({ token })
      .then((result) => {
        setPropertyName(result.propertyName);
        setStatus("success");
      })
      .catch((err) => {
        setErrorMessage(err.message || "Failed to accept invitation");
        setStatus("error");
      });
  }, [token, user, authLoading]);

  if (status === "loading" || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Leaf className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (status === "no-token") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card max-w-md p-8 text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h1 className="mb-2 text-lg font-semibold text-neutral-900">Invalid Invitation</h1>
          <p className="text-sm text-neutral-500">This invitation link is missing or invalid.</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (status === "need-login") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card max-w-md p-8 text-center">
          <LogIn className="mx-auto mb-4 h-12 w-12 text-primary-400" />
          <h1 className="mb-2 text-lg font-semibold text-neutral-900">Sign in to Accept</h1>
          <p className="mb-6 text-sm text-neutral-500">
            You need to sign in or create an account to accept this invitation.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
              className="btn-primary"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
            <Link
              to={`/signup?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
              className="btn-secondary"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card max-w-md p-8 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h1 className="mb-2 text-lg font-semibold text-neutral-900">Welcome!</h1>
          <p className="text-sm text-neutral-500">
            You've joined <strong>{propertyName}</strong>.
          </p>
          <Link to="/" className="btn-primary mt-6 inline-flex">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Error
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card max-w-md p-8 text-center">
        <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h1 className="mb-2 text-lg font-semibold text-neutral-900">Invitation Failed</h1>
        <p className="text-sm text-neutral-500">{errorMessage}</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
