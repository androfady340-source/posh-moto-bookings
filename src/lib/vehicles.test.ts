import { describe, it, expect } from "vitest";
import { depositFor, whatsappLink } from "./vehicles";

describe("booking rules", () => {
  it("deposit is 5% of price in EGP", () => {
    expect(depositFor(45_000_000)).toBe(2_250_000);
  });
  it("WhatsApp link converts Egyptian numbers", () => {
    expect(whatsappLink("01208744830")).toBe("https://wa.me/201208744830");
  });
});
