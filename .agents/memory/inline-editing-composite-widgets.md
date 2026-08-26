---
name: Inline editing in composite widgets
description: Keyboard interaction rules for text inputs nested inside composite navigation widgets.
---

Inline text editors inside a radiogroup or similar composite widget must stop their key events from reaching the parent navigation handler. Parent Arrow, Home, and End handling otherwise breaks caret movement and can trigger unintended blur commits.

**Why:** A rename editor initially passed functional tests but parent radiogroup navigation intercepted standard text-editing keys. Preventing Tab also forced users to press it twice to move forward.

**How to apply:** Stop editor key events from bubbling to the composite widget. Let Tab keep its native behavior and commit through blur; handle Enter and Escape explicitly.