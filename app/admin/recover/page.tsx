import RecoverForm from "@/components/admin/RecoverForm";

export const metadata = { title: "Admin · Recover" };

// Emergency path when no passkey device is available: the recovery code
// (ADMIN_RECOVERY_CODE) unlocks enrolling one new passkey — nothing else.
export default function AdminRecover() {
  return (
    <div className="max-w-sm mx-auto w-full flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Recover access</h1>
      <p className="text-[0.8rem] text-muted">
        Enter your recovery code to enroll a passkey on this device, then sign
        in with it.
      </p>
      <RecoverForm />
    </div>
  );
}
