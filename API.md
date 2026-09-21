# API PharmacyPOS - Documentación de Rutas

Base URL: `http://localhost:8000/api/v1`

## Autenticación

| Método | Ruta | Body | Auth | Descripción |
|--------|------|------|------|-------------|
| POST | /auth/register-public | {email,password,nombre,rol} | No | Primer admin |
| POST | /auth/register | {email,password,nombre,rol} | Admin | Crear usuario |
| POST | /auth/login | {email,password} | No | Retorna access+refresh |
| POST | /auth/refresh | {refresh_token} | No | Nuevo access |
| POST | /auth/logout | {refresh_token} | Bearer | Revoca |
| GET | /auth/me | - | Bearer | Perfil |
| PUT | /auth/me | {nombre,email} | Bearer | Actualizar |
| POST | /auth/change-password | {old_password,new_password} | Bearer | Cambiar pass |
| POST | /auth/recovery/request | {email} | No | Código 6 dígitos 15m |
| POST | /auth/recovery/verify | {email,code,new_password} | No | Reset |
| GET | /auth/users | - | Admin | Listar |

**Ejemplo Login**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@farmacia.py","password":"Admin123!"}'
```

## Medicamentos

| Método | Ruta | Query/Body | Descripción |
|--------|------|------------|-------------|
| POST | /medicamentos/ | body MedicamentoCreate | Crear |
| GET | /medicamentos/ | ?search=&categoria=&requiere_receta=&activo= | Listar con filtros |
| GET | /medicamentos/alertas/bajo-stock | - | Stock < mínimo |
| GET | /medicamentos/alertas/vencimiento | - | Vence en 30 días |
| GET | /medicamentos/{id} | - | Detalle |
| PUT | /medicamentos/{id} | body | Update + historial |
| DELETE | /medicamentos/{id} | - | Soft delete |
| POST | /medicamentos/bulk-precio | {ids, precio_venta, precio_costo} | Lote |
| GET | /medicamentos/{id}/historial | - | Historial precios |

## Recetas

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /recetas/ | Crear, valida cédula 6-8 dígitos, fechas |
| GET | /recetas/ | ?search=&estado= |
| GET | /recetas/{id} | Detalle con medicamentos |
| PUT | /recetas/{id} | Solo farmacéutico/admin cambia estado |
| POST | /recetas/{id}/validar | {valida,motivo} |
| DELETE | /recetas/{id} | Eliminar |

## Ventas (POS)

| Método | Ruta | Body | Validaciones |
|--------|------|------|--------------|
| POST | /ventas/ | {items:[{medicamento_id,cantidad,precio_unitario,descuento_item,subtotal}], descuento_total_porcentaje, metodo_pago, detalle_pago, receta_id, cliente_id} | Stock, receta vigente si requiere, no vencida, medicamento en receta |
| GET | /ventas/ | ?desde=&hasta=&metodo_pago= | Listar |
| GET | /ventas/{id} | - | Detalle |
| POST | /ventas/{id}/anular | - | Devuelve stock |

Métodos pago: `efectivo, tarjeta_debito, tarjeta_credito, cheque, transferencia, mixto`

## Caja Diaria

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /cajas/abrir | {saldo_inicial, turno} |
| GET | /cajas/actual | Balance en vivo: saldo_esperado = inicial + ventas efectivo + movimientos |
| POST | /cajas/{id}/movimiento | {tipo,monto,descripcion} |
| POST | /cajas/{id}/cerrar | {saldo_real} calcula diferencia |
| GET | /cajas/ | Lista (admin ve todas) |
| GET | /cajas/{id}/pdf | ReportLab PDF cierre |

## Dashboard

| Ruta | Params | Descripción |
|------|--------|-------------|
| GET | /dashboard/resumen?periodo=hoy/semana/mes/30dias/12meses | Total, ticket, top5, con/sin receta |
| GET | /dashboard/ventas-por-periodo?periodo= | 24h / 7 días / mes / 12 meses |
| GET | /dashboard/productos?periodo= | Top10, margen, vencimiento |
| GET | /dashboard/financiero?periodo= | Solo admin/contador: ingresos, egresos, ganancia, histórico 6m |
| GET | /dashboard/metodos-pago | Pie |
| GET | /dashboard/clientes | Frecuentes |

## Finanzas

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /finanzas/ingresos | {monto,origen,descripcion} |
| GET | /finanzas/ingresos | ?desde=&hasta=&search= |
| POST | /finanzas/egresos | {monto,tipo,descripcion,proveedor_id} |
| GET | /finanzas/egresos | ?tipo=&search= |
| GET | /finanzas/resumen | ?desde=&hasta= => total_ingresos, total_egresos, saldo_neto |
| DELETE | /finanzas/ingresos/{id} | Eliminar |
| DELETE | /finanzas/egresos/{id} | Eliminar |

## Clientes / Proveedores

CRUD estándar: POST / GET / PUT / DELETE con filtros search.

## Headers Seguridad

- CSP, X-Frame-Options, X-Content-Type-Options
- CORS solo orígenes permitidos
- JWT 30m access, 7d refresh revocable
- Rate limiting login (recomendado 5 intentos)

Ver `SEGURIDAD.md` y `tests/` para 50+ tests IDOR.
