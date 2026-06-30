-- ============================================================
-- SIGHE — Reporte de fallas vía QR sin cuenta
-- Corré este archivo en Supabase Studio → SQL Editor.
-- ============================================================

-- Lookup público de un equipo por su qr_code (lectura mínima, solo lo
-- necesario para mostrar contexto antes de reportar). SECURITY DEFINER
-- salta el RLS, pero solo devuelve la fila que matchea el código exacto
-- (impreso en el sticker físico) — no expone el resto de la tabla.
CREATE OR REPLACE FUNCTION public_get_equipment_by_qr(p_qr_code TEXT)
RETURNS TABLE (
  equipment_id   UUID,
  company_name   TEXT,
  equipment_type TEXT,
  brand          TEXT,
  model          TEXT,
  code           TEXT,
  status         equipment_status
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id,
    c.name,
    et.name,
    e.brand,
    e.model,
    e.code,
    e.status
  FROM equipment e
  JOIN companies c        ON c.id = e.company_id
  JOIN equipment_types et ON et.id = e.equipment_type_id
  WHERE e.qr_code = p_qr_code;
$$;

REVOKE ALL ON FUNCTION public_get_equipment_by_qr(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public_get_equipment_by_qr(TEXT) TO anon, authenticated;


-- Crea un ticket de reparación para el equipo del qr_code dado, sin
-- requerir sesión (reported_by queda NULL). SECURITY DEFINER salta el RLS
-- únicamente para este insert acotado.
CREATE OR REPLACE FUNCTION public_create_repair_ticket(
  p_qr_code     TEXT,
  p_title       TEXT,
  p_description TEXT,
  p_fault_type  fault_type DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_equipment_id UUID;
  v_company_id   UUID;
  v_ticket_id    UUID;
BEGIN
  SELECT e.id, e.company_id INTO v_equipment_id, v_company_id
  FROM equipment e
  WHERE e.qr_code = p_qr_code;

  IF v_equipment_id IS NULL THEN
    RAISE EXCEPTION 'Equipo no encontrado para el código QR provisto.';
  END IF;

  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'El título del reporte es obligatorio.';
  END IF;

  INSERT INTO repair_tickets (company_id, equipment_id, reported_by, title, description, fault_type)
  VALUES (v_company_id, v_equipment_id, NULL, p_title, p_description, p_fault_type)
  RETURNING id INTO v_ticket_id;

  RETURN v_ticket_id;
END;
$$;

REVOKE ALL ON FUNCTION public_create_repair_ticket(TEXT, TEXT, TEXT, fault_type) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public_create_repair_ticket(TEXT, TEXT, TEXT, fault_type) TO anon, authenticated;
