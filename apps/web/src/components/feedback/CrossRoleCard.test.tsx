import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CrossRoleCard from "./CrossRoleCard";

function renderAt(ui: ReactElement) {
  return render(<MemoryRouter initialEntries={["/"]}>{ui}</MemoryRouter>);
}

describe("<CrossRoleCard />", () => {
  it("operatör oturumunda uygun metin ve hedef bağlantı gösterir", () => {
    renderAt(
      <CrossRoleCard
        sessionRole="operator"
        suggestedPath="/operator"
        suggestedLabel="Çekici paneline git"
      />
    );
    expect(screen.getByText(/bu panel bu hesap için değil/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /çekici paneline git/i });
    expect(link).toHaveAttribute("href", "/operator");
  });

  it("çıkış butonu tıklandığında oturum anahtarlarını temizler", async () => {
    localStorage.setItem("towit_access", "a");
    localStorage.setItem("towit_role", "customer");

    renderAt(
      <CrossRoleCard
        sessionRole="customer"
        suggestedPath="/customer"
        suggestedLabel="Müşteri paneline git"
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /çıkış/i }));
    expect(localStorage.getItem("towit_access")).toBeNull();
    expect(localStorage.getItem("towit_role")).toBeNull();
  });
});
