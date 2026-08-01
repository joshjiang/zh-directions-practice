/**
 * Allow-list sanitizer for the grader's feedback HTML.
 *
 * The feedback string is rendered with dangerouslySetInnerHTML so that the
 * error/correction/annotation spans can be styled. It is model-generated and
 * quotes the student's own input verbatim, so it must never be trusted: a
 * student could type `<img src=x onerror=...>` and have the model echo it back.
 */

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'SPAN', 'STRONG', 'EM', 'B', 'I', 'UL', 'OL', 'LI', 'DIV',
]);

const ALLOWED_SPAN_CLASSES = new Set(['error', 'correction', 'annotation']);

/** Tags whose text content is code, not prose - dropped wholesale. */
const DROP_WITH_CONTENT = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'IFRAME', 'OBJECT', 'EMBED']);

/**
 * @param {string} html - Untrusted HTML from the grading service.
 * @returns {string} HTML containing only allow-listed tags, with all
 *   attributes stripped except a whitelisted `class` on `<span>`.
 */
export const sanitizeFeedback = (html) => {
  if (typeof html !== 'string' || !html) return '';

  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const root = doc.getElementById('root');
  if (!root) return '';

  const walk = (node) => {
    // Iterate over a copy: unwrapping mutates the live child list.
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) continue;

      if (child.nodeType === Node.ELEMENT_NODE && DROP_WITH_CONTENT.has(child.tagName)) {
        child.remove();
        continue;
      }

      if (child.nodeType !== Node.ELEMENT_NODE || !ALLOWED_TAGS.has(child.tagName)) {
        // Keep the readable text, drop the element (and anything a script,
        // style, or event-handler-bearing tag would have carried with it).
        const text = doc.createTextNode(child.textContent || '');
        child.replaceWith(text);
        continue;
      }

      const keepClass =
        child.tagName === 'SPAN' && ALLOWED_SPAN_CLASSES.has(child.getAttribute('class'))
          ? child.getAttribute('class')
          : null;

      for (const attr of [...child.attributes]) {
        child.removeAttribute(attr.name);
      }
      if (keepClass) child.setAttribute('class', keepClass);

      walk(child);
    }
  };

  walk(root);
  return root.innerHTML;
};
