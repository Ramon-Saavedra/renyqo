import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderWorkspaceBoundary } from "./ProviderWorkspaceBoundary";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useProviderWorkspace } from "./scope-context";
import { discoverWorkspaces, readCurrentWorkspace } from "./api";
import {
  current,
  discovery,
  deferred,
  workspaceA,
  workspaceB,
} from "./testing/workspace-fixture";
vi.mock("./api", () => ({
  discoverWorkspaces: vi.fn(),
  readCurrentWorkspace: vi.fn(),
}));
const { router } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => window.location.pathname,
}));
function navigate(href: string) {
  window.history.pushState(null, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
function OperationalView() {
  const { current, key } = useProviderWorkspace();
  return (
    <>
      <WorkspaceSwitcher />
      <p>{current.workspace.displayName}</p>
      <output data-testid="scope">{key}</output>
    </>
  );
}
beforeEach(() => {
  vi.mocked(discoverWorkspaces)
    .mockReset()
    .mockResolvedValue([discovery(), discovery(workspaceB)]);
  vi.mocked(readCurrentWorkspace)
    .mockReset()
    .mockImplementation((options) =>
      Promise.resolve(
        current(new Headers(options.headers).get("x-workspace-id")!),
      ),
    );
  router.push.mockReset().mockImplementation(navigate);
  router.replace.mockReset().mockImplementation(navigate);
  window.history.replaceState(null, "", "/provider/dashboard");
});
describe("provider workspace boundary", () => {
  it("keeps operational content unmounted until explicit multi-workspace selection", async () => {
    render(
      <ProviderWorkspaceBoundary>
        <OperationalView />
      </ProviderWorkspaceBoundary>,
    );
    expect(screen.queryByTestId("scope")).toBeNull();
    const select = await screen.findByRole("combobox", {
      name: "Arbeitsbereich",
    });
    fireEvent.change(select, { target: { value: workspaceA } });
    await waitFor(() => expect(screen.getByTestId("scope")).toBeTruthy());
    expect(window.location.search).toBe("?workspaceId=" + workspaceA);
  });
  it("writes automatic single-workspace selection to URL without showing a selector", async () => {
    vi.mocked(discoverWorkspaces).mockResolvedValue([discovery()]);
    render(
      <ProviderWorkspaceBoundary>
        <OperationalView />
      </ProviderWorkspaceBoundary>,
    );
    await waitFor(() =>
      expect(window.location.search).toBe("?workspaceId=" + workspaceA),
    );
    await waitFor(() => expect(screen.getByTestId("scope")).toBeTruthy());
    expect(screen.queryByRole("combobox")).toBeNull();
  });
  it("clears resource URL state and hides old operations during a switch and browser navigation", async () => {
    window.history.replaceState(
      null,
      "",
      "/provider/dashboard?workspaceId=" +
        workspaceA +
        "&listingId=old&applicationId=old",
    );
    render(
      <ProviderWorkspaceBoundary>
        <OperationalView />
      </ProviderWorkspaceBoundary>,
    );
    await screen.findByTestId("scope");
    const old = screen.getByTestId("scope").textContent;
    const pending = deferred<ReturnType<typeof current>>();
    vi.mocked(readCurrentWorkspace).mockReturnValueOnce(pending.promise);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: workspaceB },
    });
    expect(screen.queryByTestId("scope")).toBeNull();
    expect(window.location.search).toBe("?workspaceId=" + workspaceB);
    await waitFor(() => expect(readCurrentWorkspace).toHaveBeenCalledTimes(2));
    await act(async () => pending.resolve(current(workspaceB)));
    await waitFor(() =>
      expect(screen.getByTestId("scope").textContent).not.toBe(old),
    );
    act(() => window.history.back());
    await waitFor(() => expect(window.location.search).toContain(workspaceA));
    await waitFor(() =>
      expect(screen.getByTestId("scope").textContent).toContain(workspaceA),
    );
  });
  it("leaves applicant/public children outside the provider boundary", () => {
    window.history.replaceState(null, "", "/applicant/applications");
    render(
      <ProviderWorkspaceBoundary>
        <p>Applicant content</p>
      </ProviderWorkspaceBoundary>,
    );
    expect(screen.getByText("Applicant content")).toBeTruthy();
    expect(discoverWorkspaces).not.toHaveBeenCalled();
  });
});
