import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * Validates an object against a JSON Schema
 * @param data The JSON object to validate
 * @param schema The JSON Schema definition
 */
export function validateSchema(data: unknown, schema: object): void {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    const errors = validate.errors?.map((e: { instancePath?: string; message?: string }) => `${e.instancePath} ${e.message}`).join(', ');
    throw new Error(`Schema validation failed: ${errors}`);
  }
}

/**
 * Custom Matcher for Playwright expect
 */
export const matchSchema = (data: unknown, schema: object): { pass: boolean; message: () => string } => {
    try {
        validateSchema(data, schema);
        return { pass: true, message: () => 'Schema matched' };
    } catch (e: unknown) {
        return { pass: false, message: () => e instanceof Error ? e.message : String(e) };
    }
};
