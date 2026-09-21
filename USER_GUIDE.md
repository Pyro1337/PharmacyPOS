# Guía de Usuario - PharmacyPOS

## Login

- Usa credenciales según rol. Primer usuario: `register-public`.

## Vendedor - Flujo POS

1. Login → **Caja Diaria** → Abrir caja (saldo inicial PYG, ej 50.000)
2. **POS** → Buscar medicamento (nombre, código, lector barras USB escribe y Enter)
3. Seleccionar cantidad → Si requiere receta: ingresar ID receta válida (vigente 30 días)
4. Aplicar descuento % (si >10% queda logueado)
5. Seleccionar método pago (efectivo etc.), confirmar → recibo, stock actualiza automático
6. Fin día: **Caja** → ver balance en vivo (esperado vs real) → agregar movimientos → Cerrar caja → Descargar PDF → firmes

**Atajos POS:** pantalla limpia, teclado numérico para cantidad, confirmación toast.

## Farmacéutico

1. **Recetas** → ver pendientes → Validar (¿vigente? ¿controlados?) → Aprobar/Rechazar con motivo
2. **Medicamentos** → ver alertas vencimiento (30d) y bajo stock
3. En POS, solo con receta aprobada se venden controlados

## Contador / Admin

1. **Dashboard** → filtros: Hoy, 7d, Este mes, 30d, 12m, vendedor, categoría, método pago
2. Secciones: Resumen día, ventas por período (línea/barras), Top 10, margen, financiero (ingresos vs egresos 6m, proyección), métodos pago (pie), clientes
3. Exportar: PDF (ReportLab) y CSV (futuro: programar email diario via APScheduler)
4. **Finanzas** → registrar ingresos/egresos separados de ventas → ver saldo neto
5. Historial cajas completo

## Gestión

- **Medicamentos:** CRUD, búsqueda, filtrar categoría/proveedor/receta, carga CSV (futuro), bulk precio, historial cambios
- **Clientes:** nombre, cédula 8 dígitos validada, descuento %, historial compras
- **Proveedores:** RUC, condiciones pago, historial

## Formato Paraguay

- Moneda: `50.000 PYG` o `50.000 ₲`, sin decimales, punto miles
- Fecha: `DD/MM/YYYY`, hora 24h, timezone America/Asuncion
- Cédula: 8 dígitos

## Soporte

- Dark mode: toggle en sidebar, respeta `prefers-reduced-motion`, persistent
- Responsive: mobile para tablet vendedor
- Toasts para feedback
