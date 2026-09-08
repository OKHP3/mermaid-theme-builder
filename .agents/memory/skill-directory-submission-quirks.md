---
name: Skill directory submission quirks
description: Current verification constraints for the external AgenticSkills and agentskills.my submission forms.
---

Do not treat a browser success message as proof that an external skill-directory submission was created. At the time of verification, agentskills.my's form only logged the payload locally and made no network request. AgenticSkills' official endpoint later accepted a submission and returned a review URL, but the linked GitHub repository was not publicly resolvable when checked.

**Why:** A false confirmation would make the distribution log claim a listing or review record that does not exist.

**How to apply:** Require a returned review-issue URL, listing URL, or equivalent server-side confirmation before recording a submission date, and separately verify that the returned confirmation remains reachable before claiming a public listing. Keep unresolved review links marked pending rather than treating them as approval.

For Awesome Diagramming, treat `shubhamgrg04/awesome-diagramming` as the canonical upstream. The `demian0311` fork has issues disabled; upstream has no `CONTRIBUTING.md` but uses open suggestion issues as the maintainer-intake path.

**Why:** A closed PR on the fork is not evidence that the upstream maintainer reviewed or rejected the listing, and duplicating it in the fork bypasses the active contribution channel.

**How to apply:** Propose entries in an upstream issue first, wait for maintainer direction, and only then open one fresh PR if the maintainer confirms the format.