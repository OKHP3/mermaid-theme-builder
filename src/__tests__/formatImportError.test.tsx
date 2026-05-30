// @vitest-environment happy-dom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatImportError } from "@/lib/importErrorFormat";

describe("formatImportError", () => {
  it("wraps the field name in a code element for a Field-must-be-string message", () => {
    const node = formatImportError("Field 'version' must be a string, got number.");
    const { container } = render(<>{node}</>);
    const code = container.querySelector("code");
    expect(code).not.toBeNull();
    expect(code!.textContent).toBe("version");
    expect(container.textContent).toContain("must be a string, got number.");
  });

  it("preserves the surrounding prefix when the message has one", () => {
    const node = formatImportError("Import failed: Field 'name' must be a string, got boolean.");
    const { container } = render(<>{node}</>);
    const code = container.querySelector("code");
    expect(code).not.toBeNull();
    expect(code!.textContent).toBe("name");
    expect(container.textContent).toContain("Import failed: Field '");
    expect(container.textContent).toContain("' must be a string, got boolean.");
  });

  it("returns the original string for an unrecognized error pattern", () => {
    const result = formatImportError("Unexpected token at position 0.");
    expect(result).toBe("Unexpected token at position 0.");
  });

  it("returns the original string for a bundle-level error that has no field pattern", () => {
    const result = formatImportError("Bundle import failed: Expected type 'mtb-palette-bundle'.");
    expect(result).toBe("Bundle import failed: Expected type 'mtb-palette-bundle'.");
  });

  it("highlights different type suffixes (object, boolean)", () => {
    for (const got of ["object", "boolean"]) {
      const node = formatImportError(`Field 'id' must be a string, got ${got}.`);
      const { container } = render(<>{node}</>);
      const code = container.querySelector("code");
      expect(code).not.toBeNull();
      expect(code!.textContent).toBe("id");
      expect(container.textContent).toContain(`got ${got}.`);
    }
  });
});
