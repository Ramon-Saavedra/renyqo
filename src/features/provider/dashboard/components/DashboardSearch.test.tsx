import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardSearch } from "./DashboardSearch";

const onChange = vi.fn();

function renderSearch(value = "") {
  render(
    <DashboardSearch
      value={value}
      onChange={onChange}
      placeholder="Objekte filtern"
      ariaLabel="Objekte durchsuchen"
      clearLabel="Suche leeren"
    />,
  );
}

function SearchHarness() {
  const [value, setValue] = useState("");

  return (
    <DashboardSearch
      value={value}
      onChange={(nextValue) => {
        onChange(nextValue);
        setValue(nextValue);
      }}
      placeholder="Objekte filtern"
      ariaLabel="Objekte durchsuchen"
      clearLabel="Suche leeren"
    />
  );
}

describe("DashboardSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits typed search values", async () => {
    const user = userEvent.setup();
    render(<SearchHarness />);

    await user.type(
      screen.getByRole("searchbox", { name: "Objekte durchsuchen" }),
      "Berlin",
    );

    expect(onChange).toHaveBeenLastCalledWith("Berlin");
  });

  it("renders a clear button only when a value exists", async () => {
    const user = userEvent.setup();
    renderSearch("Berlin");

    await user.click(screen.getByRole("button", { name: "Suche leeren" }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("does not render the clear button for empty values", () => {
    renderSearch();

    expect(screen.queryByRole("button", { name: "Suche leeren" })).toBeNull();
  });
});
