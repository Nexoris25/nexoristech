/**
 * Limits the editor shows and the generator writes to, in one place.
 *
 * The excerpt counter read "/200" while Oge was writing up to 280 characters into the field, so an
 * editor watching it saw "255/200" — a number over its own stated maximum, which says either the
 * limit is wrong or the text is invalid, and gives no way to tell which. The field's maxLength only
 * governs typing, so generated text went straight past it.
 *
 * Client-safe on purpose: the forms are client components, and the module that holds the generator
 * reaches the database, so a constant shared from there would pull the database client into the
 * browser bundle.
 */

/**
 * The longest an excerpt may be.
 *
 * Three sentences, matching the three lines a card shows before it clips. Both the gateway prompt and
 * the deterministic fallback build to this number, so the field has to state the same one.
 */
export const EXCERPT_MAX = 280;
