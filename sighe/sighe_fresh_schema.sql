-- =========================================================
-- SIGHE — Esquema completo desde cero
-- Sin módulo de órdenes de compra (fuera de alcance).
-- ADVERTENCIA: este script borra todas las tablas y datos
-- existentes del esquema public. Solo correr porque el
-- proyecto todavía no tiene datos reales.
-- =========================================================

-- ---------------------------------------------------------
-- 0. Limpieza: borrar todo lo existente en orden de dependencia
-- ---------------------------------------------------------
DROP VIEW IF EXISTS public.v_tickets_summary CASCADE;
DROP VIEW IF EXISTS public.v_low_stock CASCADE;
DROP VIEW IF EXISTS public.v_equipment_repair_count CASCADE;

DROP TABLE IF EXISTS public.purchase_order_items CASCADE;
DROP TABLE IF EXISTS public.purchase_orders CASCADE;
DROP TABLE IF EXISTS public.repair_ticket_parts CASCADE;
DROP TABLE IF EXISTS public.repair_tickets CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.equipment CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.floor_plans CASCADE;
DROP TABLE IF EXISTS public.parts CASCADE;
DROP TABLE IF EXISTS public.equipment_types CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

DROP FUNCTION IF EXISTS public.set_ticket_company_id() CASCADE;
DROP FUNCTION IF EXISTS public.current_company_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_of_own_company() CASCADE;

DROP TYPE IF EXISTS purchase_status CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS ticket_status_old CASCADE;
DROP TYPE IF EXISTS fault_type CASCADE;
DROP TYPE IF EXISTS equipment_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ---------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'tecnico', 'usuario');
CREATE TYPE equipment_status AS ENUM ('activo', 'en_reparacion', 'dado_de_baja', 'mejorado', 'irrecuperable');
CREATE TYPE fault_type AS ENUM ('hardware', 'software');
CREATE TYPE ticket_status AS ENUM ('pendiente', 'en_revision', 'resuelto', 'cancelado');

-- ---------------------------------------------------------
-- 2. companies — una fila por empresa cliente (multi-tenant)
-- ---------------------------------------------------------
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  rut text UNIQUE,
  email text,
  phone text,
  address text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- 3. profiles — usuarios con cuenta (Admin y Técnico).
--    El "Trabajador" que reporta por QR no tiene fila aquí.
-- ---------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'usuario',
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- 4. Catálogos compartidos entre todas las empresas
-- ---------------------------------------------------------
CREATE TABLE public.equipment_types (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text
);

CREATE TABLE public.parts (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  compatible_types text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- 5. locations — sala/piso dentro de una empresa. x/y son
--    porcentaje (0-100) relativo al contenedor de la sala en
--    el mapa interactivo, NO coordenadas de una imagen real.
-- ---------------------------------------------------------
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  floor integer,
  room text,
  workstation text,
  x_coordinate numeric CHECK (x_coordinate IS NULL OR (x_coordinate >= 0 AND x_coordinate <= 100)),
  y_coordinate numeric CHECK (y_coordinate IS NULL OR (y_coordinate >= 0 AND y_coordinate <= 100)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.locations.x_coordinate IS 'Porcentaje (0-100) del ancho del contenedor de la sala.';
COMMENT ON COLUMN public.locations.y_coordinate IS 'Porcentaje (0-100) del alto del contenedor de la sala.';

-- ---------------------------------------------------------
-- 6. equipment
-- ---------------------------------------------------------
CREATE TABLE public.equipment (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  equipment_type_id uuid NOT NULL REFERENCES public.equipment_types(id),
  location_id uuid REFERENCES public.locations(id),
  assigned_user_id uuid REFERENCES public.profiles(id),
  code text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  serial_number text,
  status equipment_status NOT NULL DEFAULT 'activo',
  purchase_date date,
  warranty_expiry date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- 7. repair_tickets — flujo: pendiente -> en_revision -> resuelto
-- ---------------------------------------------------------
CREATE TABLE public.repair_tickets (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES public.equipment(id),
  reported_by uuid REFERENCES public.profiles(id),
  reporter_name text,
  assigned_to uuid REFERENCES public.profiles(id),
  title text NOT NULL,
  description text,
  fault_type fault_type,
  status ticket_status NOT NULL DEFAULT 'pendiente',
  diagnosis text,
  solution text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.repair_tickets.reporter_name IS
  'Nombre opcional del trabajador anónimo (sin cuenta) que reportó por QR. Null si reported_by está seteado.';
COMMENT ON COLUMN public.repair_tickets.company_id IS
  'Se completa automáticamente por trigger a partir del equipo escaneado, nunca se confía en el valor que mande el cliente.';

-- ---------------------------------------------------------
-- 8. inventory — stock de piezas por empresa
-- ---------------------------------------------------------
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES public.parts(id),
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock integer NOT NULL DEFAULT 2,
  unit_price numeric,
  location_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- 9. repair_ticket_parts — piezas usadas al cerrar un ticket (US-12/US-13)
-- ---------------------------------------------------------
CREATE TABLE public.repair_ticket_parts (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  ticket_id uuid NOT NULL REFERENCES public.repair_tickets(id) ON DELETE CASCADE,
  inventory_id uuid NOT NULL REFERENCES public.inventory(id),
  quantity_used integer NOT NULL CHECK (quantity_used > 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- 10. Índices en columnas de foreign key
-- ---------------------------------------------------------
CREATE INDEX idx_profiles_company_id         ON public.profiles(company_id);
CREATE INDEX idx_locations_company_id        ON public.locations(company_id);
CREATE INDEX idx_equipment_company_id        ON public.equipment(company_id);
CREATE INDEX idx_equipment_location_id       ON public.equipment(location_id);
CREATE INDEX idx_repair_tickets_company_id   ON public.repair_tickets(company_id);
CREATE INDEX idx_repair_tickets_equipment_id ON public.repair_tickets(equipment_id);
CREATE INDEX idx_repair_tickets_status       ON public.repair_tickets(status);
CREATE INDEX idx_repair_tickets_assigned_to  ON public.repair_tickets(assigned_to);
CREATE INDEX idx_inventory_company_id        ON public.inventory(company_id);
CREATE INDEX idx_repair_ticket_parts_ticket  ON public.repair_ticket_parts(ticket_id);

-- ---------------------------------------------------------
-- 11. Funciones auxiliares para multi-tenant
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_of_own_company()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.set_ticket_company_id()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.company_id := (SELECT company_id FROM public.equipment WHERE id = NEW.equipment_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_ticket_company_id
  BEFORE INSERT ON public.repair_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_ticket_company_id();

-- ---------------------------------------------------------
-- 12. Row Level Security
-- ---------------------------------------------------------
ALTER TABLE public.companies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_tickets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_ticket_parts   ENABLE ROW LEVEL SECURITY;

-- companies: cada empresa ve su propia fila; solo super_admin administra
CREATE POLICY companies_select ON public.companies
  FOR SELECT USING (id = public.current_company_id() OR public.is_super_admin());
CREATE POLICY companies_manage ON public.companies
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- profiles: cada usuario se ve a sí mismo y a sus colegas de empresa
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR company_id = public.current_company_id() OR public.is_super_admin()
  );
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR (public.is_admin_of_own_company() AND company_id = public.current_company_id())
    OR public.is_super_admin()
  );

-- catálogos compartidos: lectura para cualquier autenticado, edición solo plataforma
CREATE POLICY catalog_read ON public.equipment_types FOR SELECT TO authenticated USING (true);
CREATE POLICY catalog_manage ON public.equipment_types FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY catalog_read ON public.parts FOR SELECT TO authenticated USING (true);
CREATE POLICY catalog_manage ON public.parts FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- tablas propias de cada empresa: aislamiento por company_id
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['locations', 'equipment', 'inventory']
  LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I
         FOR ALL USING (company_id = public.current_company_id() OR public.is_super_admin())
         WITH CHECK (company_id = public.current_company_id() OR public.is_super_admin())',
      t
    );
  END LOOP;
END $$;

-- repair_ticket_parts no tiene company_id propio, cuelga de repair_tickets
CREATE POLICY tenant_isolation ON public.repair_ticket_parts
  FOR ALL USING (
    ticket_id IN (
      SELECT id FROM public.repair_tickets
      WHERE company_id = public.current_company_id() OR public.is_super_admin()
    )
  )
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.repair_tickets
      WHERE company_id = public.current_company_id() OR public.is_super_admin()
    )
  );

-- repair_tickets: aislamiento normal + reporte anónimo por QR
CREATE POLICY tenant_isolation ON public.repair_tickets
  FOR ALL USING (company_id = public.current_company_id() OR public.is_super_admin())
  WITH CHECK (company_id = public.current_company_id() OR public.is_super_admin());

CREATE POLICY anon_can_view_equipment_for_report ON public.equipment
  FOR SELECT TO anon
  USING (status <> 'dado_de_baja');

CREATE POLICY anon_can_create_tickets ON public.repair_tickets
  FOR INSERT TO anon
  WITH CHECK (
    equipment_id IN (SELECT id FROM public.equipment WHERE status <> 'dado_de_baja')
    AND reported_by IS NULL
  );

-- ---------------------------------------------------------
-- 13. Grants de tabla (además de RLS, Postgres exige grants
--     a nivel de tabla para que anon/authenticated puedan operar)
-- ---------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.equipment TO anon;
GRANT INSERT ON public.repair_tickets TO anon;

-- ---------------------------------------------------------
-- 14. Vistas de reporte
-- ---------------------------------------------------------
CREATE VIEW public.v_tickets_summary AS
SELECT c.name AS company, rt.status, count(*) AS total
FROM public.repair_tickets rt
JOIN public.companies c ON c.id = rt.company_id
GROUP BY c.name, rt.status;

CREATE VIEW public.v_low_stock AS
SELECT i.id AS inventory_id, c.name AS company, p.name AS part_name, p.category,
       i.quantity AS current_stock, i.min_stock, i.unit_price
FROM public.inventory i
JOIN public.companies c ON c.id = i.company_id
JOIN public.parts p ON p.id = i.part_id
WHERE i.quantity <= i.min_stock;

CREATE VIEW public.v_equipment_repair_count AS
SELECT e.id AS equipment_id, c.name AS company, e.brand, e.model, e.code,
       et.name AS equipment_type, count(rt.id) AS total_tickets,
       max(rt.opened_at) AS last_ticket_date
FROM public.equipment e
JOIN public.companies c ON c.id = e.company_id
JOIN public.equipment_types et ON et.id = e.equipment_type_id
LEFT JOIN public.repair_tickets rt ON rt.equipment_id = e.id
GROUP BY e.id, c.name, e.brand, e.model, e.code, et.name;
