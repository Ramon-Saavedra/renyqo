import type { ApplicantWorkflowModel } from "../workflow-model";
import { useOptionalWorkflowSession } from "../workflow-session";
export function ApplicantReplyPermission({
  model,
}: {
  readonly model: ApplicantWorkflowModel;
}) {
  const session = useOptionalWorkflowSession();
  if (!session) return null;
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-caption">
        <input
          type="checkbox"
          checked={model.applicantRepliesEnabled}
          disabled={
            !model.canManageApplicantReplies ||
            session.replyPermission.pending ||
            session.acting
          }
          onChange={(event) =>
            void session.replyPermission.setEnabled(event.target.checked)
          }
        />
        Antworten erlauben
      </label>
      {session.replyPermission.error ? (
        <p role="alert" className="text-caption">
          {session.replyPermission.error}
        </p>
      ) : null}
    </div>
  );
}
