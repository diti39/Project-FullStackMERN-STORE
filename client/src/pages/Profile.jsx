import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { getErrorMessage } from "../api/axios";
import FormInput from "../components/common/FormInput";
import ErrorMessage from "../components/common/ErrorMessage";

const submitClass =
  "rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60";

function Success({ children }) {
  if (!children) return null;
  return (
    <div
      className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
      role="status"
    >
      {children}
    </div>
  );
}

export default function Profile() {
  const { user, updateProfile } = useAuth();

  // --- details form ---
  const [details, setDetails] = useState({
    name: user.name,
    email: user.email,
  });
  const [detailsMsg, setDetailsMsg] = useState({ error: "", success: "" });
  const [savingDetails, setSavingDetails] = useState(false);

  const saveDetails = async (e) => {
    e.preventDefault();
    setDetailsMsg({ error: "", success: "" });
    setSavingDetails(true);
    try {
      await updateProfile(details);
      setDetailsMsg({ error: "", success: "Profile updated." });
    } catch (err) {
      setDetailsMsg({ error: getErrorMessage(err), success: "" });
    } finally {
      setSavingDetails(false);
    }
  };

  // --- password form ---
  const emptyPw = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [pw, setPw] = useState(emptyPw);
  const [pwMsg, setPwMsg] = useState({ error: "", success: "" });
  const [savingPw, setSavingPw] = useState(false);

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ error: "", success: "" });

    if (pw.newPassword !== pw.confirmPassword) {
      setPwMsg({ error: "New passwords do not match", success: "" });
      return;
    }

    setSavingPw(true);
    try {
      await updateProfile({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw(emptyPw);
      setPwMsg({ error: "", success: "Password changed." });
    } catch (err) {
      setPwMsg({ error: getErrorMessage(err), success: "" });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-bold">My profile</h1>

      <form
        onSubmit={saveDetails}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-lg font-semibold">Account details</h2>
        <ErrorMessage>{detailsMsg.error}</ErrorMessage>
        <Success>{detailsMsg.success}</Success>
        <FormInput
          label="Name"
          id="name"
          required
          value={details.name}
          onChange={(e) => setDetails({ ...details, name: e.target.value })}
          autoComplete="name"
        />
        <FormInput
          label="Email"
          id="email"
          type="email"
          required
          value={details.email}
          onChange={(e) => setDetails({ ...details, email: e.target.value })}
          autoComplete="email"
        />
        <button type="submit" disabled={savingDetails} className={submitClass}>
          {savingDetails ? "Saving..." : "Save changes"}
        </button>
      </form>

      <form
        onSubmit={savePassword}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-lg font-semibold">Change password</h2>
        <ErrorMessage>{pwMsg.error}</ErrorMessage>
        <Success>{pwMsg.success}</Success>
        <FormInput
          label="Current password"
          id="currentPassword"
          type="password"
          required
          value={pw.currentPassword}
          onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
          autoComplete="current-password"
        />
        <FormInput
          label="New password"
          id="newPassword"
          type="password"
          required
          minLength={6}
          value={pw.newPassword}
          onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
          autoComplete="new-password"
        />
        <FormInput
          label="Confirm new password"
          id="confirmPassword"
          type="password"
          required
          minLength={6}
          value={pw.confirmPassword}
          onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })}
          autoComplete="new-password"
        />
        <button type="submit" disabled={savingPw} className={submitClass}>
          {savingPw ? "Changing..." : "Change password"}
        </button>
      </form>
    </div>
  );
}
