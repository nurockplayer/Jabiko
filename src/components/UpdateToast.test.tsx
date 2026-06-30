import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UpdateToast } from "./UpdateToast";

describe("UpdateToast", () => {
  it("renders a polite status with an update action", () => {
    render(<UpdateToast label="有新版本，點此更新" onUpdate={vi.fn()} />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("button", { name: "有新版本，點此更新" })).toBeInTheDocument();
  });

  it("calls onUpdate when clicked", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(<UpdateToast label="有新版本，點此更新" onUpdate={onUpdate} />);

    await user.click(screen.getByRole("button", { name: "有新版本，點此更新" }));
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});
