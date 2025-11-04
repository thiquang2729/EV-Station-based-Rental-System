import { ZodError } from 'zod';

export default function validate(schema) {
  return async (req, res, next) => {
    try {
      if (schema?.body) { req.body = schema.body.parse(req.body); }
      if (schema?.query) { req.query = schema.query.parse(req.query); }
      if (schema?.params) { req.params = schema.params.parse(req.params); }
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(422).json({ 
          success: false, 
          error: 'VALIDATION_ERROR', 
          message: e.errors.map(x => x.message).join('; ') 
        });
      }
      next(e);
    }
  };
}
