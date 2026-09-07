# Contact, delivery and editorial refinement

- Added an initially unchecked, required contact-enquiry consent checkbox with a Privacy Policy link. Both submit buttons use native form validation; the submit handler also checks validity. The server rejects missing, false or string-valued consent on contact enquiries before forwarding and records the accepted consent text with a server timestamp in the lead message. Existing Oge chat and newsletter intake contracts are preserved separately.
- How We Work now has a concise hero, a process anchor, and six numbered editorial stages instead of repetitive cards. Removed the redundant introductory band and refined engagement and audience sections while preserving their content.
- Industry cards have a restrained hover lift/border/shadow and keyboard focus-within treatment, with reduced-motion support.
- Article H2s use 24–28px with 32px above and 12px below; H3s use 20–23px with 24px above and 10px below. Smaller headings and adjacent-heading gaps are also standardized.
- Tables use native content-driven automatic layout. Removed fixed cell minimum widths, including mobile first-column floors. Long tables scroll within their existing frame; short tables can fit their content. At desktop, the sample ranking table allocates about 60px to Rank and 335px to Best For. At 280px those columns use about 56px and 123px, with scrolling contained inside the table frame.

## Checks

222 tests pass, including six mocked endpoint tests for consent rejection, recording and existing Oge/newsletter contracts. No live enquiry was sent. Browser verified checkbox starts unchecked/required and responds to selection. Native validation applies to both submit buttons.

All 51 currently published routes pass a 280px layout check without page-level horizontal overflow. These checks used inert SSR copies with actual CSS/fonts, then removed the temporary files. Desktop screenshots cover the delivery sequence and table proportions. This is not exhaustive testing of every interactive state or unpublished CMS detail page.

ESLint, production build and 51-route HTTP/SEO checks pass. Existing homepage imagery, CMS case studies and job listings remain unchanged.
