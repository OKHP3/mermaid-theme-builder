---
name: Skill directory submission quirks
description: Current verification constraints for the external AgenticSkills and agentskills.my submission forms.
---

Do not treat a browser success message as proof that an external skill-directory submission was created. At the time of verification, agentskills.my's form only logged the payload locally and made no network request. AgenticSkills' official endpoint later accepted a submission and returned a review URL, but the linked GitHub repository was not publicly resolvable when checked.

**Why:** A false confirmation would make the distribution log claim a listing or review record that does not exist.

**How to apply:** Require a returned review-issue URL, listing URL, or equivalent server-side confirmation before recording a submission date, and separately verify that the returned confirmation remains reachable before claiming a public listing. Keep unresolved review links marked pending rather than treating them as approval.