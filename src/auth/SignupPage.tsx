import { Link } from "react-router";
import { SignupForm } from "wasp/client/auth";
import { AuthLayout } from "./AuthLayout";

export function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm
        additionalFields={[
          {
            name: "username",
            type: "input",
            label: "Display Name",
            validations: {
              required: "Display name is required",
            },
          },
        ]}
      />
      <br />
      <span className="text-sm font-medium text-neutral-900">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold underline">
          Go to login
        </Link>
        .
      </span>
    </AuthLayout>
  );
}
