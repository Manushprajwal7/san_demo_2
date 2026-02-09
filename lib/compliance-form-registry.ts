/**
 * Single source of truth: form type id → template filename.
 * Used for dynamic form generation. No hard-coded form logic.
 * To add a new form: add an entry here and place the .docx in /forms.
 */
export const COMPLIANCE_FORM_REGISTRY: Record<string, string> = {
  '1': 'form_1.docx',
  '2': 'form_2.docx',
  '4': 'form_4.docx',
  '5': 'form_5.docx',
  '7': 'form_7.docx',
  '8': 'form_8.docx',
  'A': 'form_A.docx',
  'B': 'form_B.docx',
  'D': 'form_D.docx',
  'F': 'form_F.docx',
  'H': 'form_H.docx',
  'P': 'form_P.docx',
  'Q': 'form_Q.docx',
  'R': 'form_R.docx',
  'T': 'form_T.docx',
};

export function getTemplateFileName(formId: string): string | null {
  const normalized = String(formId).trim().toUpperCase();
  return COMPLIANCE_FORM_REGISTRY[normalized] ?? COMPLIANCE_FORM_REGISTRY[formId] ?? null;
}

export function getRegisteredFormIds(): string[] {
  return Object.keys(COMPLIANCE_FORM_REGISTRY);
}

export function isRegisteredForm(formId: string): boolean {
  return getTemplateFileName(formId) != null;
}
