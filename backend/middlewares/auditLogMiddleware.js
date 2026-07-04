const { AuditLog } = require('../models');

const REDACT_KEYS = ['password', 'token', 'authorization', 'secret'];

const redactSensitiveValues = (value) => {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveValues);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const redacted = {};
  for (const [key, entry] of Object.entries(value)) {
    if (REDACT_KEYS.includes(String(key).toLowerCase())) {
      redacted[key] = '***';
      continue;
    }
    redacted[key] = redactSensitiveValues(entry);
  }

  return redacted;
};

const safePayload = (payload) => {
  if (payload === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(redactSensitiveValues(payload)));
  } catch (error) {
    return { info: 'non-serializable payload' };
  }
};

const getActionByMethod = (method) => {
  const mapping = {
    GET: 'READ',
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };
  return mapping[method] || method;
};

const deriveModuleAndEntityId = (originalUrl = '') => {
  const pathOnly = originalUrl.split('?')[0];
  const segments = pathOnly.split('/').filter(Boolean);
  if (segments.length < 2) {
    return { module: 'system', entityId: null };
  }
  return {
    module: segments[1],
    entityId: segments[2] || null,
  };
};

const auditLogMiddleware = (req, res, next) => {
  // Log only API traffic.
  if (!req.originalUrl.startsWith('/api')) {
    return next();
  }

  const startTime = Date.now();
  let responsePayload;

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body) => {
    responsePayload = body;
    return originalJson(body);
  };

  res.send = (body) => {
    if (responsePayload === undefined) {
      responsePayload = body;
    }
    return originalSend(body);
  };

  res.on('finish', async () => {
    try {
      const { module, entityId } = deriveModuleAndEntityId(req.originalUrl);
      const statusCode = res.statusCode;
      const durationMs = Date.now() - startTime;
      const user = req.user || {};

      await AuditLog.create({
        employeeId: user.id || null,
        empId: user.empId || null,
        role: user.role || null,
        method: req.method,
        action: getActionByMethod(req.method),
        module,
        endpoint: req.originalUrl,
        entityId,
        requestBody: safePayload(req.body),
        queryParams: safePayload(req.query),
        responseStatus: statusCode,
        responseBody: safePayload(responsePayload),
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        durationMs,
        success: statusCode < 400,
        errorMessage: statusCode >= 400 ? 'Request failed' : null,
      });
    } catch (error) {
      console.error('Audit log write failure:', error.message);
    }
  });

  next();
};

module.exports = auditLogMiddleware;
