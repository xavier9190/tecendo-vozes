import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ThreeDotsMenu } from "./ThreeDotsMenu";

afterEach(cleanup);

function ControlledMenuHarness({
  initialOpen = false,
  hideTriggerOnMobile = false,
}: {
  initialOpen?: boolean;
  hideTriggerOnMobile?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  return (
    <ThreeDotsMenu
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      hideTriggerOnMobile={hideTriggerOnMobile}
    />
  );
}

describe("ThreeDotsMenu", () => {
  it("renders bottom-right trigger with >= 44x44 touch target and hides on mobile when requested", () => {
    const { rerender } = render(<ControlledMenuHarness />);
    const trigger = screen.getByRole("button", {
      name: "Abrir menu de informações e denúncia",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger.className).toContain("min-h-11");
    expect(trigger.className).toContain("min-w-11");
    expect(trigger.className).toContain("bottom-3");
    expect(trigger.className).toContain("right-3");
    expect(trigger.className).not.toContain("hidden md:flex");

    rerender(<ControlledMenuHarness hideTriggerOnMobile={true} />);
    const hiddenOnMobileTrigger = screen.getByRole("button", {
      name: "Abrir menu de informações e denúncia",
    });
    expect(hiddenOnMobileTrigger.className).toContain("hidden");
    expect(hiddenOnMobileTrigger.className).toContain("md:flex");
  });

  it("opens a blurred overlay with exactly 2 primary buttons ('Sobre nós' and 'Denuncie')", () => {
    render(<ControlledMenuHarness />);
    const trigger = screen.getByRole("button", {
      name: "Abrir menu de informações e denúncia",
    });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const backdrop = screen.getByTestId("three-dots-backdrop");
    expect(backdrop.className).toContain("backdrop-blur-md");
    expect(backdrop.className).toContain("bg-tv-purple-deep/45");
    expect(backdrop.className).toContain("items-end");
    expect(backdrop.className).toContain("justify-end");
    expect(trigger.className).toContain("z-[60]");

    const dialog = screen.getByRole("dialog", {
      name: /menu de informações e denúncia/i,
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const buttons = within(dialog).getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAccessibleName(/sobre nós/i);
    expect(buttons[1]).toHaveAccessibleName(/denuncie/i);
    expect(buttons[0].className).toContain("min-h-11");
    expect(buttons[1].className).toContain("min-h-11");
  });

  it("reveals 'Sobre nós' project/LGPD info and legal links, with a back button", () => {
    render(<ControlledMenuHarness />);
    fireEvent.click(
      screen.getByRole("button", { name: "Abrir menu de informações e denúncia" }),
    );

    fireEvent.click(screen.getByRole("button", { name: /sobre nós/i }));

    const backdrop = screen.getByTestId("three-dots-backdrop");
    expect(backdrop.className).toContain("items-center");
    expect(backdrop.className).toContain("justify-center");

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(/tecendo vozes/i);
    expect(dialog).toHaveTextContent(/belo jardim/i);
    expect(dialog).toHaveTextContent(/pedro xavier/i);
    expect(dialog).toHaveTextContent(/zero cookies/i);

    expect(screen.getByRole("link", { name: /política de privacidade/i })).toHaveAttribute(
      "href",
      "/privacidade",
    );
    expect(screen.getByRole("link", { name: /termos de uso/i })).toHaveAttribute(
      "href",
      "/termos",
    );

    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(within(screen.getByRole("dialog")).getAllByRole("button")).toHaveLength(2);
  });

  it("reveals 'Denuncie' emergency channels, tel: links, WhatsApp 180, and disclaimer", () => {
    render(<ControlledMenuHarness />);
    fireEvent.click(
      screen.getByRole("button", { name: "Abrir menu de informações e denúncia" }),
    );

    fireEvent.click(screen.getByRole("button", { name: /denuncie/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(
      "Este site não é um canal oficial de atendimento ou de denúncia. Em emergência, ligue 180, 190 ou 192.",
    );

    for (const num of ["180", "190", "192", "197", "100"]) {
      const link = within(dialog).getByRole("link", {
        name: new RegExp(`ligar para ${num}`, "i"),
      });
      expect(link).toHaveAttribute("href", `tel:${num}`);
      expect(link.className).toContain("min-h-11");
    }

    const whatsapp = within(dialog).getByRole("link", { name: /whatsapp.*180/i });
    expect(whatsapp).toHaveAttribute("href", "https://wa.me/556196100180");

    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(within(screen.getByRole("dialog")).getAllByRole("button")).toHaveLength(2);
  });

  it("closes on backdrop click or Escape and restores focus to the trigger button", () => {
    render(<ControlledMenuHarness />);
    const trigger = screen.getByRole("button", {
      name: "Abrir menu de informações e denúncia",
    });

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("three-dots-backdrop"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
