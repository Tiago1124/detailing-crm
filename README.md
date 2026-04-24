# CRM Discol & Zagamotos

Sistema web de gestión de clientes, encuestas de satisfacción y recordatorios automáticos de mantenimiento para las redes de concesionarios **Discolmotos** y **Zagamotos**.

---

## Stack

| Herramienta | Para qué |
|---|---|
| [Next.js 15](https://nextjs.org) | Frontend + API routes |
| [Supabase](https://supabase.com) | Base de datos PostgreSQL + RLS |
| [Clerk](https://clerk.com) | Autenticación + roles |
| [Twilio](https://twilio.com) | WhatsApp (sandbox en desarrollo) |
| [Vercel](https://vercel.com) | Hosting + cron jobs |

---

## Funcionalidades

- **Encuesta pública** — clientes llenan satisfacción sin login, con habeas data (Ley 1581)
- **Auto-registro** — al enviar la encuesta el cliente queda en el sistema de mantenimientos
- **Panel por sede** — cada sede ve solo sus clientes (RLS estricto)
- **Panel admin** — dashboard con KPIs, NPS e indicadores por sede y asesor
- **Recordatorios automáticos** — cron diario 9am Colombia envía WhatsApp a clientes que cumplen su fecha
- **WhatsApp con link de sede** — el mensaje incluye el link directo de agendamiento de la sede
- **Exportar Excel** — clientes y encuestas exportables desde el panel admin
- **Roles** — `admin` ve todo, `sede` ve solo sus datos

---

## Variables de entorno

Crea un archivo `.env.local` en la raíz con:

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

Agregar las mismas en **Vercel → Settings → Environment Variables**.

---

## Setup local

```bash
# Instalar dependencias
npm install

# Correr en desarrollo
npm run dev
```

---

## Base de datos

Ejecutar en **Supabase → SQL Editor**:

```sql
-- Tabla de clientes
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
  sede text,
  empresa text default 'discol',
  meses_recordatorio integer default 2,
  created_at timestamp default now()
);

-- Tabla de encuestas
create table encuestas (
  id uuid default gen_random_uuid() primary key,
  empresa text not null,
  sede text not null,
  asesor text not null,
  nombre text not null,
  cedula text not null,
  telefono text not null,
  referencia_moto text,
  placa text,
  pregunta_1 integer check (pregunta_1 between 1 and 5),
  pregunta_2 integer check (pregunta_2 between 1 and 5),
  pregunta_3 integer check (pregunta_3 between 1 and 5),
  pregunta_4 integer check (pregunta_4 between 1 and 5),
  pregunta_5 integer check (pregunta_5 between 1 and 5),
  acepta_habeas_data boolean default false,
  created_at timestamp default now()
);

-- Tabla de sedes
create table sedes (
  id uuid default gen_random_uuid() primary key,
  empresa text not null,
  nombre text not null,
  ciudad text,
  direccion text,
  link_citas text,
  activa boolean default true
);
```

---

## Roles de usuario

Los roles se configuran en **Clerk → Users → Public metadata**:

```json
// Admin — ve todas las sedes
{
  "role": "admin",
  "empresa": "discol"
}

// Usuario de sede — ve solo sus clientes
{
  "role": "sede",
  "empresa": "discol",
  "sede": "Las Américas"
}
```

---

## JWT Template (Clerk + Supabase)

En **Clerk → Configure → JWT Templates** crear template llamado `supabase`:

```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "user_metadata": {
    "role": "{{user.public_metadata.role}}",
    "empresa": "{{user.public_metadata.empresa}}",
    "sede": "{{user.public_metadata.sede}}"
  }
}
```

Firmar con el **JWT Secret** de **Supabase → Project Settings → API → JWT Settings**.

---

## Cron automático

El archivo `vercel.json` configura el cron para ejecutarse todos los días a las **9am Colombia (14:00 UTC)**:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 14 * * *"
    }
  ]
}
```

Para probar manualmente:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" https://tuapp.vercel.app/api/cron
```

---

## Estructura del proyecto

```
app/
├── components/
│   ├── FormularioCliente.tsx   # Registro de servicios
│   ├── ListaClientes.tsx       # Panel de seguimiento
│   ├── Dashboard.tsx           # KPIs y NPS para admin
│   └── GestionDatos.tsx        # Tabla + exportar Excel
├── api/
│   ├── send-whatsapp/route.ts  # Envío manual WhatsApp
│   └── cron/route.ts           # Recordatorios automáticos
├── encuesta/
│   └── page.tsx                # Encuesta pública sin login
├── globals.css                 # Design system dark theme
├── layout.tsx                  # Root layout con Clerk
└── page.tsx                    # Dashboard principal
lib/
└── supabase.js                 # Cliente Supabase + token JWT
middleware.ts                   # Protección de rutas
vercel.json                     # Cron job config
```

---

## Rutas públicas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/encuesta` | Público | Encuesta de satisfacción |
| `/sign-in` | Público | Login |
| `/` | Autenticado | Panel principal |
| `/api/cron` | Solo con CRON_SECRET | Recordatorios automáticos |

---

## Empresas y sedes

El sistema maneja dos empresas:

- **`discol`** → Discolmotos (6 sedes en Cauca y Valle del Cauca)
- **`zagamotos`** → Zagamotos (16 sedes en Bogotá, Cali, Medellín, Eje Cafetero y Cauca)

Cada empresa tiene su catálogo de sedes en la tabla `sedes` con el link directo de agendamiento.

---

## Tiempos de recordatorio por servicio

| Servicio | Meses sugeridos |
|---|---|
| Detailing completo | 2 |
| Lavado exterior | 1 |
| Pulida y encerada | 3 |
| Limpieza interior | 2 |
| Ceramic coating | 6 |

El usuario puede ajustar el tiempo manualmente al registrar el servicio.

---

## Migración a Meta WhatsApp API (producción)

Actualmente el sistema usa **Twilio Sandbox** (requiere que el cliente active el número cada 72h). Para migrar a producción sin esta limitación:

1. Crear app en [developers.facebook.com](https://developers.facebook.com) (tipo Business)
2. Verificar Meta Business Suite con documentos del negocio
3. Agregar número dedicado sin WhatsApp activo
4. Reemplazar variables de Twilio por `META_ACCESS_TOKEN` y `META_PHONE_NUMBER_ID`
5. Actualizar `app/api/send-whatsapp/route.ts` y `app/api/cron/route.ts`

---

## Pendientes para producción

- [ ] Crear usuarios de sede reales (22 sedes)
- [ ] Migrar WhatsApp a Meta API oficial
- [ ] Restringir origen en Supabase al dominio de Vercel
- [ ] Activar 2FA en todas las cuentas
- [ ] Pasar infraestructura a cuentas del cliente
- [ ] Prueba end-to-end con datos reales (ver documentacion-crm.docx)

---

## Licencia

Proyecto privado — desarrollado para Discol & Zagamotos.
