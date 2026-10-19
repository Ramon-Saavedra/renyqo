import { render, screen } from "@testing-library/react";
import { MessageSquare } from "lucide-react";
import { describe, expect, it } from "vitest";
import { attentionCopy } from "@/lib/attention/copy";
import { AttentionChip, AttentionIconBadge } from "./AttentionChip";

describe("AttentionChip message styling", () => {
  it("uses the shared message chip class for unread messages", () => {
    const { container } = render(
      <AttentionChip
        chip={{
          kind: "messages",
          label: attentionCopy.unreadMessages(1),
          icon: MessageSquare,
          count: 1,
          emphasis: false,
        }}
      />,
    );

    expect(
      container.querySelector(".rq-attention-message-chip"),
    ).not.toBeNull();
  });

  it("uses the message icon tone on compact listing indicators", () => {
    const { container } = render(
      <AttentionIconBadge
        icon={MessageSquare}
        label={attentionCopy.unreadMessages(2)}
        count={2}
        variant="minimal"
        tone="message"
      />,
    );

    expect(
      container.querySelector(".rq-attention-message-icon-minimal"),
    ).not.toBeNull();
    expect(container.querySelector(".rq-attention-count-badge")).not.toBeNull();
    expect(screen.getByRole("img", { name: /ungelesene/ })).toBeTruthy();
  });
});
