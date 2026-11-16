import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";

const mocks = vi.hoisted(() => ({ signup: vi.fn(), signin: vi.fn(), navigate: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signUp: mocks.signup, signInWithPassword: mocks.signin } } }));
vi.mock("@/lib/auth", () => ({ useMe: () => ({ data: null }) }));
vi.mock("@/lib/i18n", () => ({ useT: () => (_zh: string, en: string) => en }));
vi.mock("@/components/Brand", () => ({ Brand: () => null }));
vi.mock("@/components/SettingsControl", () => ({ SettingsControl: () => null }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: object) => ({ options }),
  useNavigate: () => mocks.navigate,
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Navigate: () => null,
}));
import { Route } from "@/routes/auth";
const Page = Route.options.component as ComponentType;
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("Restored account registration", () => {
  it("keeps an unconfirmed signup outside the workspace and reuses display-name profiles", async () => {
    mocks.signup.mockResolvedValue({ data: { session: null }, error: null });
    render(<Page />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test farmer" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "farmer@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password" } });
    fireEvent.click(screen.getByRole("button", { name: /^Create account$/ }));
    await waitFor(() => expect(mocks.signup).toHaveBeenCalledWith({ email: "farmer@example.com", password: "test-password", options: { data: { display_name: "Test farmer" }, emailRedirectTo: window.location.origin } }));
    await screen.findByRole("status");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it("restores existing-account sign-in", async () => {
    mocks.signin.mockResolvedValue({ data: {}, error: null });
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: "Already have an account? Sign in" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "farmer@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password" } });
    fireEvent.click(screen.getByRole("button", { name: /^Sign in$/ }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: "/demo", replace: true }));
    expect(mocks.signup).not.toHaveBeenCalled();
  });
});