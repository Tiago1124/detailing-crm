# Detailing CRM — Documentación técnica

## Stack
- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Estilos**: CSS Variables custom (dark theme) + Google Fonts (Syne + DM Sans)
- **Auth**: Clerk (login, roles, sesiones)
- **Base de datos**: Supabase (PostgreSQL)
- **WhatsApp**: Twilio Sandbox (dev) → Meta WhatsApp API (producción)
- **Hosting**: Vercel

---

## Estructura del proyecto

```
app/
├── components/
│   ├── FormularioCliente.tsx   # Registro de servicios
│   └── ListaClientes.tsx       # Panel de seguimiento
├── api/
│   ├── send-whatsapp/route.ts  # Envío manual WA
│   └── cron/route.ts           # Recordatorios automáticos
├── globals.css                 # Design system (variables CSS)
├── layout.tsx                  # Root layout con ClerkProvider
└── page.tsx                    # Dashboard principal con sidebar
lib/
└── supabase.js                 # Cliente Supabase
middleware.ts                   # Protección de rutas con Clerk
```

---

## Variables de entorno requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
CRON_SECRET=
```

---

## Base de datos (Supabase SQL)

```sql
create table clientes (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  telefono text not null,
  vehiculo text,
  placa text,
  tipo_servicio text,
  fecha_servicio date not null,
  proximo_recordatorio date not null,
  recordatorio_enviado boolean default false,
  notas text,
  created_at timestamp default now()
);

-- Seguridad RLS
alter table clientes enable row level security;

create policy "Solo usuarios autenticados leen"
on clientes for select using (auth.role() = 'authenticated');

create policy "Solo usuarios autenticados insertan"
on clientes for insert with check (auth.role() = 'authenticated');

create policy "Solo usuarios autenticados actualizan"
on clientes for update using (auth.role() = 'authenticated');
```

---

## Tiempos de recordatorio por servicio

| Servicio | Meses sugeridos |
|---|---|
| Detailing completo | 2 |
| Lavado exterior | 1 |
| Pulida y encerada | 3 |
| Limpieza interior | 2 |
| Ceramic coating | 6 |

El usuario puede ajustar el tiempo manualmente al registrar.

---

## Cron automático

El archivo `vercel.json` configura el cron para ejecutarse todos los días a las 9am (hora Colombia):

```json
{
  "crons": [{ "path": "/api/cron", "schedule": "0 14 * * *" }]
}
```

---

## Módulos pendientes — Discol & Zagamotos

Los siguientes módulos están reservados en el sidebar (sección "Próximamente") y listos para desarrollarse:

### 1. Encuestas de satisfacción
- Página pública sin login
- Campos: sede, asesor, referencia moto, placa, nombre, cédula, teléfono
- Preguntas de satisfacción configurables
- Acepta términos habeas data (Ley 1581)

### 2. Agendamiento público
- Página pública accesible desde el link del WhatsApp
- Campos: nombre, teléfono, sede, fecha, hora
- La cita aparece en el panel interno del usuario sede

### 3. Dashboard admin (Super rol)
- Indicadores por asesor y por sede
- NPS y satisfacción agregada
- Mantenimientos pendientes global
- Exportar a Excel

### 4. Módulo de sedes
- Cada sede tiene su propio usuario (Clerk Organizations)
- RLS en Supabase: cada sede solo ve sus clientes
- Admin ve todo

---

## Migración a Meta WhatsApp API (producción)

Cuando el cliente esté listo para WhatsApp 100% automático sin sandbox:

1. Crear app en developers.facebook.com (tipo Business)
2. Verificar Meta Business Suite con documentos del negocio
3. Agregar número dedicado (sin WhatsApp activo)
4. Reemplazar en `.env`:
   ```
   TWILIO_ACCOUNT_SID → no aplica
   TWILIO_AUTH_TOKEN → no aplica  
   META_ACCESS_TOKEN=tu_token
   META_PHONE_NUMBER_ID=tu_number_id
   ```
5. Actualizar `app/api/send-whatsapp/route.ts` con la API de Meta

---

## Seguridad implementada

- [x] Clerk auth en todas las rutas privadas (middleware.ts)
- [x] RLS activado en Supabase
- [x] Variables de entorno nunca en el código
- [x] CRON_SECRET para proteger el endpoint automático
- [x] HTTPS automático en Vercel
- [ ] Restricción de origen en Supabase (pendiente)
- [ ] 2FA en todas las cuentas (pendiente — hacer manualmente)

---

## Costo operativo mensual (producción)

| Servicio | Plan | Costo/mes |
|---|---|---|
| Supabase | Pro | ~$100.000 COP |
| Vercel | Pro | ~$80.000 COP |
| Meta WhatsApp API | Pay-per-use | ~$40.000 COP |
| **Total** | | **~$220.000 COP** |

Todo bajo cuentas del cliente final (Discol/Zagamotos).
