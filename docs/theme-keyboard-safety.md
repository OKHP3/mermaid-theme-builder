# Theme keyboard safety

Increment 5 is a focused repair for repeated theme-management work, packaged as
version 0.11.1. It does not redesign the workspace or change saved themes.

## Behavior

- Arrow keys, Home, and End navigate and select themes while a theme radio has
  focus. Navigation still wraps across the visible theme choices.
- Those keys do not switch themes while a management button has focus. Rename
  fields and theme search retain their own keyboard behavior.
- Modified navigation shortcuts are not consumed by the theme selector.
- Canceling deletion returns focus to the initiating button. If removal fails
  or is still pending, the theme and its control remain in place.
- After confirmed removal, lost focus returns to the selected visible theme,
  or the first visible theme choice when the selected one is filtered out.
  Another control already focused by the user is left alone.

The implementation follows the focus ownership described by the W3C
[radio pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) and
[modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Preservation and verification

Only the shared theme-selector component changes behavior. There are no storage
schema changes, dependency changes, or changes to diagram input, exports,
renderer defaults, saved theme contents, or Forge styling.

Unit coverage checks action-key combinations, modified shortcuts, normal theme
navigation, delayed removal, unsuccessful removal, and focus ownership. Browser
coverage checks real keyboard deletion of active, inactive, and final saved
themes, cancellation, unchanged legacy data, surviving saved themes, and diagram
source preservation. Existing application and accessibility suites remain gates.

These checks do not establish full WCAG compliance. Broader screen-reader,
zoom, high-contrast, and manual accessibility review remain open. Historical
roadmap items and held Replit task statuses are not automatically completed by
this repair.
