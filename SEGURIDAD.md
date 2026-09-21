# Seguridad - PharmacyPOS

## Autenticación & Autorización

- **JWT:** access 30m, refresh 7d, `type` claim distingue, `jti` único (UUID) evita colisión UNIQUE constraint.
- **Refresh revocable:** tabla `refresh_tokens` con `revoked` y `expires_at`, limpiados cada hora por APScheduler (`app/main.py:56`).
- **Hash:** bcrypt salt 12 (`app/core/security.py:11`), truncate 72 bytes compatible passlib 1.7 + bcrypt 4.2.
- **Recuperación:** código 6 dígitos, expira 15m, hash no plaintext (`RecoveryCode.code_hash`), revoke previos.
- **Roles:** Admin > Farmacéutico > Vendedor > Contador. `dependencies.py:get_current_user` + `require_roles`.
  - `Admin` único puede `/auth/register`, `/auth/users`
  - `Farmacéutico/Admin` cambia estado receta
  - `Admin/Contador` ve `/dashboard/financiero` y `/finanzas/resumen` completo
  - Caja: vendedor solo ve/cierra su caja; admin ve todas.

## IDOR Prevención

- Todos los endpoints verifican `current_user.id` vs recurso. Tests: `tests/test_seguridad.py` ~33 tests.
- Caja: `GET /cajas/{id}` verifica `vendedor_id == current_user.id` o rol admin/contador.
- Movimiento/cierre igualmente.
- PDF igual.
- Receta: validación no filtra por usuario (privacidad paciente) pero estado solo farmacéutico.

## Datos Sensibles

- Contraseñas nunca logueadas, nunca retornadas en `UserResponse`.
- Recovery codes hasheados.
- Tokens expirados limpiados.

## Infraestructura

- Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `CSP: default-src 'self'` (`app/main.py:24`).
- CORS configurado solo `settings.CORS_ORIGINS`.
- `validate_settings()` falla si SECRET_KEY contiene placeholder en production.
- Variables nunca hardcodeadas, usan `.env`.

## Testing Seguridad

- 50+ tests IDOR: acceso sin token => 401/403, token inválido, token sin Bearer, refresh con access, inactive user, SQL injection safe, XSS stored, password hash check, no password leak en `/users`.
- Ver `backend/tests/test_seguridad.py` y `backend/tests/test_ventas.py` (validación receta, stock).

## Pendientes Producción

- Rate limiting login (5 intentos) implementar con `slowapi` o nginx.
- HTTPS via Railway/Vercel.
- CSRF para cookies si se usa; actualmente JWT Bearer no necesita CSRF pero documentado.
- Logs sin PII (recetas, contraseñas).
