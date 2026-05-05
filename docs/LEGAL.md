# Legal Notes — Color, Palette, and Brand Policy

**Owner:** OverKill Hill P³ / Jamie Hill  
**Status:** Internal reference — plain-language summary, not legal advice

This document explains why Mermaid Theme Builder ships only original/personal brand palettes, why certain corporate color values are excluded, and the legal framework behind those choices.

---

## Disclaimer

This document is a plain-language summary of publicly available legal information for the purpose of internal project governance. It is not legal advice. If you need legal advice, consult a licensed attorney.

---

## 1. Are hex codes copyrightable?

**No.** A specific hex color value like `#c46a2c` is a factual numeric representation of a point in a color space. Under U.S. copyright law, raw facts are not copyrightable. The U.S. Copyright Office makes this clear in **Circular 33** ("Works Not Protected by Copyright"):

> "Works consisting entirely of information that is common property and containing no original authorship — for example: standard calendars, height and weight charts, tape measures and rulers, schedules of sporting events, and lists or tables taken from public documents or other common sources."

A color value — even one used by a brand — is not a creative work eligible for copyright protection under this framework. The *combination* of colors in a design might be protectable as part of a larger creative work, but the values themselves are not.

**Implication for Mermaid Theme Builder:** Shipping hex values that happen to match a company's brand colors is not copyright infringement. The values themselves are unprotectable facts.

---

## 2. What about trademark and trade dress?

While hex codes can't be copyrighted, colors *can* function as trademarks under certain conditions. Two U.S. Supreme Court cases are directly relevant:

### Qualitex Co. v. Jacobson Products Co. (1995)

**Citation:** 514 U.S. 159 (1995)  
**Holding:** A color alone can serve as a trademark if it has acquired "secondary meaning" — that is, if consumers have come to identify the color specifically with a single source of goods or services, and there is no "functional" reason the competitor must use that color.

The Court held that a gold-green press pad color used by Qualitex had acquired secondary meaning in the dry-cleaning supply market and was thus protectable.

**Key limits:**
- The color must be *registered* or have established trade dress status
- The color must have acquired secondary meaning specifically for the goods/services in question
- A color is not protectable if it is "functional" (i.e., if having to avoid it would put competitors at a significant disadvantage)

### Two Pesos, Inc. v. Taco Cabana, Inc. (1992)

**Citation:** 505 U.S. 763 (1992)  
**Holding:** Trade dress (the overall visual appearance of a product or service) is protectable if it is either inherently distinctive or has acquired secondary meaning. Taco Cabana's festive, colorful restaurant decor was found to be inherently distinctive trade dress.

**Relevance:** This case affirms that a *combination* of visual elements used in a brand's presentation can be protected trade dress, even without separate registration for each element.

---

## 3. What this means in practice

For Mermaid Theme Builder to create risk under trademark/trade dress law, a user would need to:

1. Use the tool to produce diagrams that closely replicate a recognizable third-party brand's color trade dress
2. Use those diagrams in a commercial context in which viewers would be confused about the source or affiliation
3. Do so in a way that actually causes consumer confusion or dilution

This is a very high bar. A developer applying a palette resembling a corporate brand's internal documentation colors to personal diagrams is not the scenario these doctrines target.

**That said:** The OKHP3 project takes a conservative, risk-management approach:

---

## 4. OKHP3's risk management approach

### 4.1 No named corporate brand palettes

Mermaid Theme Builder does not ship palettes named after companies ("Walmart Blue", "Apple Silver", "Home Depot Orange"). Generic palette names like "Ocean Depth" or "Forest Sage" do not create consumer confusion about brand affiliation.

### 4.2 No prohibited hex values

The following hex values are excluded from this codebase because they are associated with identifiable third-party corporate trade dress. Including them by name would create an unnecessary association risk:

| Value | Excluded because |
|-------|-----------------|
| `#00205B` | Associated with third-party corporate brand |
| `#003087` | Associated with third-party corporate brand |
| `#002F86` | Associated with third-party corporate brand |
| `#B3C1DB` | Associated with third-party corporate brand |
| `#D6E5F9` | Associated with third-party corporate brand |
| `#D0D0CE` | Associated with third-party corporate brand |
| `#C8102E` | Associated with third-party corporate brand |

These values may not appear in any built-in palette, classDef default, or example file. See `AGENTS.md` and `.github/copilot-instructions.md` for enforcement.

### 4.3 OKHP3-only brand presets

The only named brand presets in the tool are OKHP3-owned properties: OverKill Hill P³, AskJamie, and Glee-fully. These are original brands created by and exclusively owned by Jamie Hill. There is no risk of trade dress confusion with third-party companies.

### 4.4 Personal project disclaimer

The tool's disclaimer states it is a personal project "not affiliated with Builders FirstSource, Mermaid, Mermaid Chart, or Mermaid.ai." This is not a legal shield but a factual statement that helps users understand the context.

---

## 5. User-entered content

Users may paste any Mermaid diagram code and any hex values into the tool. Mermaid Theme Builder does not inspect user-entered values for brand association — that is the user's responsibility.

The tool's own built-in palette system is the scope of the policy above. What users do with the tool's output is their own legal responsibility.

---

## 6. Mermaid.js licensing

Mermaid Theme Builder uses [Mermaid.js](https://github.com/mermaid-js/mermaid) as an npm dependency. Mermaid.js is licensed under the **MIT License**. Use as an npm dependency (not forked, not redistributed in modified form) is fully permitted by the MIT License.

See [Mermaid's LICENSE](https://github.com/mermaid-js/mermaid/blob/develop/LICENSE) for the full text.

---

## 7. Summary

| Question | Answer |
|----------|--------|
| Are hex codes copyrightable? | No — factual matter per Copyright Circular 33 |
| Can colors be trademarked? | Yes, under *Qualitex* — if they've acquired secondary meaning for specific goods |
| Does shipping a hex value infringe a color trademark? | Extremely unlikely on its own — requires consumer confusion in commerce |
| Why exclude specific corporate hex values? | Risk management and clear brand separation, not legal requirement |
| Why no named corporate brand palettes? | Avoids consumer confusion and establishes clean provenance |
| Is user-entered content covered by this policy? | No — users are responsible for their own use of the tool |

---

*This document is maintained by OverKill Hill P³ and reviewed periodically.*
*Not legal advice. Consult a licensed attorney for legal guidance.*
