# 💊 PROMPT: PHARMACYPOS PARAGUAY - SISTEMA POS ROBUSTO PARA FARMACIAS

## 📋 INFORMACIÓN DEL PROYECTO

**Nombre del proyecto:** PharmacyPOS Paraguay  
**Descripción breve:** Sistema POS integrado con inventario, gestión de recetas y cierre de caja con reportes PDF para farmacias  
**Moneda:** Guaraní Paraguayo (PYG)  
**Caso de uso:** Farmacias y droguerías que necesitan POS + inventario + reportes diarios  
**Audiencia:** Vendedores, farmacéuticos, dueños de farmacias, contadores  

---

## 🏗️ STACK OBLIGATORIO (NO CAMBIAR)

```
BACKEND:
✅ Python 3.12
✅ FastAPI (framework web)
✅ SQLAlchemy 2.0 (ORM)
✅ PostgreSQL 16 (base de datos)
✅ Pydantic v2 (validación)
✅ JWT (autenticación)
✅ bcrypt (hash de contraseñas)
✅ ReportLab (generación de PDF para reportes)
✅ APScheduler (tareas programadas)
✅ pytest (testing)

FRONTEND:
✅ React 19 + TypeScript
✅ Vite (bundler)
✅ Tailwind CSS v4 (estilos)
✅ Zustand (state management)
✅ React Router (navegación)
✅ Chart.js o Recharts (gráficos)
✅ Vitest + Testing Library (testing)
✅ lucide-react (iconos)

INFRAESTRUCTURA:
✅ Docker + Docker Compose
✅ nginx (proxy reverso y estáticos en producción)
✅ MinIO (S3-compatible local para PDFs)
✅ Alembic (migraciones DB)
```

---

## 🎯 MÓDULOS PRINCIPALES (OBLIGATORIO)

### **1. AUTENTICACIÓN (No negociable)**
- [ ] Registro de usuario (email + contraseña)
- [ ] Login con JWT (access token + refresh token)
- [ ] Refresh tokens persistidos en DB (revocables)
- [ ] Logout que invalida sesión
- [ ] Recuperación de contraseña (código 6 dígitos, 15 min expiry)
- [ ] Perfil de usuario editable
- [ ] Roles: Admin, Farmacéutico, Vendedor, Contador
- [ ] Hash seguro de contraseña (bcrypt)

---

### **2. GESTIÓN DE PRODUCTOS/MEDICAMENTOS**

#### **Tabla: Medicamento**
- [ ] Código único (SKU/barras)
- [ ] Nombre del medicamento
- [ ] Principio activo
- [ ] Presentación (caja, blíster, frasco, etc.)
- [ ] Precio de costo (PYG)
- [ ] Precio de venta (PYG)
- [ ] Margen de ganancia (calculado automático)
- [ ] Stock actual
- [ ] Stock mínimo (para alertas)
- [ ] Stock máximo (para sugerencias de compra)
- [ ] Requiere receta (sí/no) → medicamentos controlados
- [ ] Fecha de vencimiento
- [ ] Categoría (Analgésicos, Antibióticos, Vitaminas, etc.)
- [ ] Proveedor asociado
- [ ] Activo (sí/no) → para deshabilitar sin eliminar
- [ ] Creado por (usuario)
- [ ] Fecha creación + última actualización

#### **Funcionalidades**
- [ ] CRUD completo (crear, leer, actualizar, eliminar)
- [ ] Búsqueda por nombre, código, principio activo
- [ ] Filtrar por categoría, proveedor, requiere receta
- [ ] Escaneo de código de barras (compatible con lectores USB)
- [ ] Carga en lote (CSV)
- [ ] Actualizar precio de venta/costo en lote
- [ ] Alertas de vencimiento (productos que vencen en 30 días)
- [ ] Alertas de bajo stock (cuando stock < stock mínimo)
- [ ] Historial de cambios de precio

---

### **3. GESTIÓN DE RECETAS**

#### **Tabla: Receta**
- [ ] Código único de receta
- [ ] Paciente: nombre, cédula, fecha nacimiento
- [ ] Medicamentos prescritos (multi-select)
- [ ] Cantidad por medicamento
- [ ] Prescriptor: nombre, cédula, especialidad (si disponible)
- [ ] Fecha emisión
- [ ] Fecha vencimiento (recetas válidas 30 días típicamente)
- [ ] Archivo adjunto (foto o PDF de receta física)
- [ ] Estado: Pendiente, Completada, Parcial, Vencida
- [ ] Notas/observaciones (ej: "Solo vender con presentación original")
- [ ] Usuario que la procesó

#### **Validaciones**
- [ ] Receta no puede estar vencida
- [ ] Medicamentos controlados SOLO se venden con receta válida
- [ ] Si medicamento requiere receta pero no hay receta adjunta → ERROR
- [ ] Una receta puede usarse múltiples veces (no se "consume")
- [ ] Validación de datos del paciente (cédula formato válido, etc.)

#### **Funcionalidades**
- [ ] Cargar receta (escaneo o foto)
- [ ] Búsqueda por código, paciente, medicamento
- [ ] Validación automática (¿está vigente?, ¿tiene medicamentos controlados?)
- [ ] Historial de compras del paciente (qué se le vendió)
- [ ] Alertas si se venden medicamentos no prescritos en receta

---

### **4. PUNTO DE VENTA (POS) - EL CORE**

#### **Flujo de Venta**
1. **Carrito de compras:**
   - [ ] Buscar medicamento (por nombre, código, escaneo barras)
   - [ ] Seleccionar cantidad
   - [ ] Si requiere receta: validar receta antes de agregar al carrito
   - [ ] Mostrar precio unitario + precio total por item
   - [ ] Mostrar subtotal + descuentos + total en PYG
   - [ ] Poder eliminar/modificar items antes de confirmar

2. **Validaciones en carrito:**
   - [ ] Si medicamento requiere receta: debe haber receta adjunta y vigente
   - [ ] Stock disponible: no se puede vender más de lo que hay
   - [ ] Alerta si stock va a quedar bajo mínimo

3. **Descuentos:**
   - [ ] Descuento por cantidad (ej: >10 unidades = 5% desc)
   - [ ] Descuento por cliente frecuente (tabla de clientes, descuento %)
   - [ ] Descuento por medicamento específico (promoción puntual)
   - [ ] Descuento manual (aplicado por vendedor, requiere autorización si es >10%)
   - [ ] Campo de código de cupón/promoción

4. **Métodos de pago:**
   - [ ] Efectivo (PYG)
   - [ ] Tarjeta de débito
   - [ ] Tarjeta de crédito
   - [ ] Cheque (nombre, número, banco, fecha)
   - [ ] Transferencia bancaria (número de comprobante)
   - [ ] Combinar métodos (efectivo + tarjeta)

5. **Confirmación de venta:**
   - [ ] Mostrar resumen: items, precios, descuentos, total
   - [ ] Seleccionar método de pago
   - [ ] Generar recibo (puede imprimir o enviar por email)
   - [ ] Guardar venta en BD
   - [ ] Actualizar stock automáticamente
   - [ ] Crear transacción contable

#### **Tabla: Venta**
- [ ] Número de venta (autoincremental, único)
- [ ] Fecha + hora
- [ ] Vendedor (usuario que procesó)
- [ ] Cliente (si es cliente registrado, sino "Cliente sin registro")
- [ ] Lista de items: medicamento_id, cantidad, precio_unitario, descuento_item, subtotal
- [ ] Subtotal
- [ ] Descuento total (%)
- [ ] Monto descuento (PYG)
- [ ] Total (PYG)
- [ ] Método de pago + detalles (ej: "Tarjeta débito XXX-XXXX")
- [ ] Receta asociada (si aplica)
- [ ] Notas de venta
- [ ] Estado: Completada, Anulada, Devuelto parcial
- [ ] Creado por + fecha

---

### **5. CAJA DIARIA & CIERRE**

#### **Funcionalidades**
- [ ] Una caja por turno/vendedor/día (configurable)
- [ ] Abrir caja: saldo inicial (PYG) + notas
- [ ] Ver balance en vivo: efectivo esperado vs real
- [ ] Registrar movimientos manuales (gastos extraordinarios, depósitos, etc.)
- [ ] Cierre de caja: confirmar saldo final, resolver diferencias
- [ ] Generar PDF de cierre diario (detallado)

#### **PDF de Cierre de Caja**
El PDF debe incluir:
```
===========================================
        CIERRE DE CAJA DIARIO
          [Nombre Farmacia]
===========================================

FECHA: DD/MM/YYYY
CAJA #: [Número]
VENDEDOR: [Nombre]
TURNO: [Mañana/Tarde/Noche]

---SALDO INICIAL---
Efectivo: 50.000 PYG
Observaciones: ---

---VENTAS DEL DÍA---
Total ventas: 450.000 PYG
  - Efectivo: 200.000 PYG (5 transacciones)
  - Tarjeta débito: 150.000 PYG (3 transacciones)
  - Tarjeta crédito: 100.000 PYG (2 transacciones)

---DESCUENTOS APLICADOS---
Total descuentos: 15.000 PYG

---MOVIMIENTOS MANUALES---
Depósito a banco: -100.000 PYG
Gasto extraordinario: -5.000 PYG

---SALDO ESPERADO---
Inicial: 50.000
+ Ventas (efectivo): 200.000
- Depósitos: -100.000
- Gastos: -5.000
= ESPERADO: 145.000 PYG

---SALDO REAL---
Efectivo contado: 145.500 PYG
Diferencia: +500 PYG ✓

---FIRMAS---
Vendedor: __________ Fecha: __/__/____
Supervisor: ________ Fecha: __/__/____

===========================================
```

---

### **6. DASHBOARD CON REPORTES Y ANÁLISIS**

#### **Secciones del Dashboard**

**A) Resumen del Día**
- [ ] Ventas totales de hoy (PYG)
- [ ] Cantidad de transacciones
- [ ] Ticket promedio (total / cantidad)
- [ ] Productos más vendidos (top 5)
- [ ] Productos sin vender
- [ ] Medicamentos con receta vs sin receta

**B) Gráficos: Ventas por Período**
- [ ] **Hoy:** ventas por hora (gráfico de línea)
- [ ] **Esta semana:** ventas diarias (gráfico de barras)
- [ ] **Este mes:** ventas diarias (gráfico de línea con tendencia)
- [ ] **Últimos 12 meses:** ventas mensuales (gráfico de barras)
- [ ] Comparativa mes actual vs mes pasado (%)

**C) Análisis de Productos**
- [ ] Top 10 medicamentos más vendidos (semana/mes/año)
- [ ] Medicamentos menos vendidos
- [ ] Margen de ganancia por medicamento (gráfico de barras)
- [ ] Rotación de stock (últimos 30 días)
- [ ] Medicamentos próximos a vencer

**D) Análisis Financiero**
- [ ] Ingresos totales (día/semana/mes/año)
- [ ] Egresos totales (compras a proveedores, gastos, etc.)
- [ ] Ganancia neta (ingresos - egresos)
- [ ] Margen de ganancia promedio (%)
- [ ] Gráfico de ingresos vs egresos (últimos 6 meses)
- [ ] Proyección de ingresos (basado en promedio)

**E) Métodos de Pago**
- [ ] Distribución de ventas por método (pie chart)
- [ ] Monto promedio por método
- [ ] Tendencia de métodos (línea)

**F) Clientes**
- [ ] Cliente más frecuente
- [ ] Cliente que más gastó (mes/año)
- [ ] Ticket promedio por cliente

#### **Filtros Disponibles**
- [ ] Período: Hoy, Últimos 7 días, Este mes, Últimos 30 días, Últimos 12 meses, Rango personalizado
- [ ] Vendedor (si hay múltiples)
- [ ] Categoría de medicamento
- [ ] Método de pago

#### **Exportación**
- [ ] Exportar gráficos/datos a PDF (reporte completo)
- [ ] Exportar a CSV (para Excel)
- [ ] Programar reportes automáticos (ej: email diario)

---

### **7. REGISTROS DE INGRESOS Y EGRESOS**

#### **Tabla: Ingreso** (separada de Ventas)
- [ ] Fecha + hora
- [ ] Monto (PYG)
- [ ] Origen: Venta, Devolución+dinero, Otro
- [ ] Descripción
- [ ] Método de registro (POS, manual, etc.)
- [ ] Creado por

#### **Tabla: Egreso**
- [ ] Fecha + hora
- [ ] Monto (PYG)
- [ ] Tipo: Compra a proveedor, Gasto operativo, Devolución a cliente, Mantenimiento, Otro
- [ ] Descripción
- [ ] Proveedor (si aplica)
- [ ] Comprobante/factura (#)
- [ ] Creado por

#### **Registro de Ingresos/Egresos (Sección UI)**
- [ ] Tabla con todos los movimientos del día/período
- [ ] Filtro por tipo, método, rango de fechas
- [ ] Búsqueda por descripción
- [ ] Totales: ingresos vs egresos
- [ ] Saldo neto

---

### **8. FUNCIONALIDADES DE FARMACÉUTICO**

- [ ] Validar recetas (marca como revisada/aprobada)
- [ ] Rechazar receta (con motivo: incompleta, vencida, etc.)
- [ ] Registrar dispensación (cuándo se entregó medicamento)
- [ ] Notas de orientación (impresas en recibo): ej "Tomar 1 tableta cada 8hs"
- [ ] Reportes de medicamentos controlados vendidos

---

### **9. GESTIÓN DE CLIENTES (Opcional pero recomendado)**

- [ ] Registro de cliente: nombre, cédula, email, teléfono
- [ ] Historial de compras (todos los medicamentos que compró)
- [ ] Nivel de descuento asignado
- [ ] Alias (ej: apodo)
- [ ] Direcciones guardadas (para delivery futuro)

---

### **10. PROVEEDORES**

- [ ] Registro de proveedor: nombre, contacto, email, teléfono, RAUC (si aplica)
- [ ] Historial de compras (qué se compró, cuándo, precio)
- [ ] Precio que cobra por medicamento (puede variar)
- [ ] Condiciones de pago (contado, 30/60 días)
- [ ] Órdenes de compra (generadas desde el sistema)

---

## 🔒 REQUISITOS DE SEGURIDAD (Checklist obligatorio)

### **Autenticación & Autorización**
- [ ] JWT con expiración corta (15-30 min)
- [ ] Refresh token separado con almacenamiento seguro
- [ ] CSRF protection en endpoints POST/PUT/DELETE
- [ ] Rate limiting en login (máx 5 intentos, cooldown)
- [ ] Validación de credenciales placeholder en startup (falla en producción si detecta defaults)
- [ ] Todos los endpoints verifican que user pertenece a la farmacia/rol (prevención IDOR)
- [ ] Roles basados en acceso: Admin > Farmacéutico > Vendedor > Contador

### **Datos sensibles**
- [ ] Hash bcrypt para contraseñas (mínimo salt rounds: 12)
- [ ] Código de recuperación no se guarda en texto plano
- [ ] Tokens expirados se limpian de DB
- [ ] Recetas (datos de pacientes) son privados (no se comparten entre usuarios)

### **Infraestructura**
- [ ] Headers de seguridad: CSP, X-Frame-Options, X-Content-Type-Options
- [ ] HTTPS/SSL en producción (automático Railway + Vercel)
- [ ] CORS configurado solo para dominios permitidos
- [ ] Logs sin información sensible (nunca loguear contraseñas, recetas)
- [ ] Variables de entorno nunca hardcodeadas

### **Testing de seguridad**
- [ ] Mínimo 50+ tests IDOR (un usuario NO puede ver datos de otro)
- [ ] Tests de validación (cantidad, precio, stock)
- [ ] Tests de autorización (vendedor no puede ver reportes financieros si no tiene rol)
- [ ] Tests de recetas (medicamentos controlados requieren receta válida)

---

## 📊 REQUISITOS DE TESTING

### **Backend (pytest)**
- **Mínimo:** 120+ tests
- **Cobertura mínima:** 85% de rutas críticas
- **Enfoque:** IDOR, validación de venta, recetas, caja diaria
- **Estructura:**
  ```
  tests/
  ├── conftest.py              # Fixtures: usuario, farmacia, medicamento, venta
  ├── test_auth.py             # Login, registro, roles
  ├── test_medicamentos.py      # CRUD, búsqueda, alertas
  ├── test_recetas.py           # Validación, vencimiento
  ├── test_ventas.py            # Carrito, descuentos, cálculo totales
  ├── test_caja.py              # Cierre, PDF, saldo
  ├── test_dashboard.py         # Gráficos, reportes
  ├── test_seguridad.py         # IDOR, autorización por rol
  └── test_ingresos_egresos.py  # Registros financieros
  ```

### **Frontend (Vitest + Testing Library)**
- **Mínimo:** 90+ tests
- **Enfoque:** Componentes críticos, flujo de venta, validaciones
- **Ejemplos a testear:**
  - Login/registro (componentes + flujo)
  - Carrito de compras (agregar, eliminar, calcular total)
  - Búsqueda de medicamentos (escaneo barras, filtros)
  - Validación de recetas antes de venta
  - Generación de PDF (que se descarga correctamente)
  - Gráficos del dashboard (datos se renderizan)
  - Cálculos de ingresos/egresos

---

## 🎨 REQUISITOS DE UI/UX

- [ ] Dark mode real (light/dark/system), configurable, persistent
- [ ] Responde a `prefers-reduced-motion`
- [ ] Sidebar + header + responsive para mobile (especialmente para vendedores con tablet)
- [ ] Notificaciones toast (venta realizada, caja cerrada, etc.)
- [ ] Estados: vacío, carga, error visibles
- [ ] Búsqueda rápida de medicamentos (debe ser MUY rápida, incluso con barcode scanner)
- [ ] Modales con navegación de teclado (trap focus, Esc cierra)
- [ ] Iconos coherentes (lucide-react, sin emojis)
- [ ] Colores accesibles (contrast mínimo AA)
- [ ] **Especial:** Pantalla de POS debe ser limpia, grande, sin distracciones (para rapidez)
- [ ] **Especial:** Teclado numérico en cantidad (fácil de usar)
- [ ] **Especial:** Confirmación visual cuando se agrega item al carrito

---

## 🚀 DEPLOYMENT (OBLIGATORIO)

### **Desarrollo local:**
- [ ] `docker-compose up` levanta todo (backend + frontend + DB + MinIO)
- [ ] `.env.example` con todas las variables necesarias
- [ ] Script setup rápido (setup.sh con instrucciones)

### **Producción (Railway + Vercel):**
- [ ] `docker-compose.prod.yml` listo para Railway (backend + DB)
- [ ] Vercel config para frontend (vercel.json)
- [ ] Variables de entorno configuradas por plataforma
- [ ] Migraciones automáticas (Alembic on startup)
- [ ] MinIO configurado para guardar PDFs (persistencia entre reinicios)
- [ ] Documentación de deploy de 5 pasos

---

## 📋 CHECKLIST DE ENTREGABLES

El código generado DEBE incluir:

- [ ] Código funcional 100% (sin TODOs, sin "completar después")
- [ ] Tests automatizados (120+ backend, 90+ frontend)
- [ ] Documentación:
  - [ ] README.md (setup, features, stack, instrucciones farmacéutico)
  - [ ] API.md (todas las rutas con ejemplos, validaciones)
  - [ ] SEGURIDAD.md (auditoría, decisiones, roles/permisos)
  - [ ] DEPLOYMENT.md (paso a paso Railway + Vercel)
  - [ ] USER_GUIDE.md (cómo usar el POS, cerrar caja, etc.)
- [ ] Dockerfile para frontend y backend
- [ ] docker-compose.yml (desarrollo) y docker-compose.prod.yml (producción)
- [ ] .env.example con todas las variables (MONEDA=PYG, TIMEZONE=America/Asuncion, etc.)
- [ ] GitHub Actions CI/CD (tests automáticos)
- [ ] Script de seed con datos de ejemplo (medicamentos, proveedores, etc.)

---

## 🎯 PARTICULARIDADES PARA PARAGUAY

### **Moneda: Guaraní Paraguayo (PYG)**
- [ ] Todas las transacciones en PYG
- [ ] Formato: 50.000 PYG (con punto para miles, sin decimales típicamente)
- [ ] Símbolo: ₲ o "PYG"
- [ ] Mostrar siempre: "50.000 ₲" o "50.000 PYG"

### **Localización**
- [ ] Idioma: Español (es-PY)
- [ ] Fecha: DD/MM/YYYY (ej: 17/09/2026)
- [ ] Hora: 24hs
- [ ] Timezone: America/Asuncion

### **Documentación**
- [ ] Cédula de identidad: 8 dígitos (validar formato)
- [ ] Nombre de farmacia en todos los reportes/PDF
- [ ] Datos bancarios (para transacciones): opcional pero preparado

---

## 🔧 FLUJO DE TRABAJO TÍPICO DEL USUARIO

### **Vendedor:**
1. Login
2. Abre caja (saldo inicial)
3. Busca medicamento (por nombre o escanea barras)
4. Selecciona cantidad
5. Si requiere receta: valida receta
6. Aplica descuento si aplica
7. Selecciona método de pago
8. Confirma venta → imprime/envía recibo
9. Al final del día: cierra caja → genera PDF de cierre

### **Farmacéutico:**
1. Login
2. Ve recetas pendientes (en widget del dashboard)
3. Revisa/valida recetas
4. Aprobar medicamentos controlados
5. Dejar notas si es necesario

### **Contador/Admin:**
1. Login
2. Ve dashboard con todos los datos
3. Genera reportes (día/semana/mes/año)
4. Exporta a PDF
5. Ve ingresos vs egresos
6. Accede a historial completo de cajas

---

## ✅ ESPECÍFICO PARA ESTE PROYECTO

**IMPORTANTE - LO QUE NO SE INCLUYE (por ahora):**
- ❌ Delivery / rastreo de pedidos
- ❌ Integración con obra social
- ❌ Facturación electrónica AFIP (se prepara la estructura, pero no se integra)

**LO QUE SÍ SE INCLUYE (core):**
- ✅ POS funcional 100%
- ✅ Gestión de recetas con validación
- ✅ Medicamentos controlados
- ✅ Cierre de caja + PDF
- ✅ Dashboard con gráficos (día/semana/mes/año)
- ✅ Ingresos y egresos registrados
- ✅ Reportes completos
- ✅ Moneda: PYG
- ✅ Seguridad robusta
- ✅ Tests exhaustivos

---

## 📝 PARÁMETROS CONFIRMADOS

```
[NOMBRE_DEL_PROYECTO]       → PharmacyPOS Paraguay
[DESCRIPCION_BREVE]         → Sistema POS integrado con inventario, recetas y reportes PDF en Guaraní
[CASO_DE_USO]              → Farmacias y droguerías que necesitan POS robusto + cierre diario automatizado
[AUDIENCIA]                → Vendedores, farmacéuticos, dueños, contadores
[MODULO_PRINCIPAL]         → Venta de medicamentos, gestión de recetas, caja diaria, dashboard de ingresos/egresos
[ENTIDADES_PRINCIPALES]    → Medicamento, Receta, Venta, Cliente, Transacción, CajaDiala, Ingreso, Egreso, Proveedor
[CAMPOS_ESPECIFICOS]       → Código barras, nombre, presentación, precio_costo, precio_venta, requiere_receta, stock, margen_ganancia, vencimiento
[MONEDA]                   → Guaraní Paraguayo (PYG)
[REPORTES_CLAVE]           → Cierre de caja (PDF), ventas diarias/semanales/mensuales, productos más vendidos, ingresos vs egresos, margen de ganancia
[INTEGRACIONES]            → Escaneo de código de barras, generación de PDF (cierre + reportes), gráficos avanzados (ingresos/egresos)

FUNCIONALIDADES CRÍTICAS:
✅ POS con carrito, descuentos, múltiples métodos de pago
✅ Validación de medicamentos controlados (requieren receta vigente)
✅ Caja diaria con cierre y PDF automático
✅ Dashboard con gráficos: hoy, semana, mes, año
✅ Registro de ingresos/egresos (separado de ventas)
✅ PDF de cierre diario (descargable + imprimible)
✅ Reportes exportables (PDF, CSV)
✅ Seguridad: roles, IDOR, autenticación JWT
✅ Tests: 120+ backend, 90+ frontend
✅ Moneda: PYG en todas las transacciones
```

---

## 🚀 CÓMO USAR ESTE PROMPT

1. **Copia TODO este contenido**
2. **Abre Claude en terminal:**
   ```bash
   claude
   ```
3. **Pega el prompt completo**
4. **Di:** "Genera el proyecto PharmacyPOS Paraguay completamente funcional siguiendo este prompt"
5. **Espera 15-20 minutos** a que genere todo
6. **Descarga el código generado**
7. **En tu terminal:**
   ```bash
   cd PharmacyPOS
   docker-compose up
   # Abre http://localhost:3000
   ```

---

**Creado:** 2026 | Stack: FastAPI + React 19 + PostgreSQL + Docker + ReportLab  
**Tiempo de generación esperado:** 15-20 minutos  
**Tiempo a producción:** 1-2 horas (Railway + Vercel)  
**Moneda:** Guaraní Paraguayo (₲ PYG)

**¡Vamos a generar un POS robusto para farmacias!** 💊🚀
