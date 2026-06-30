// Tipos escritos a mano a partir de supabase_schema.sql (no generados por
// `supabase gen types`, ya que el proyecto no tiene la CLI de Supabase
// vinculada). Si en algún momento se linkea el proyecto, reemplazar este
// archivo por la salida real de `supabase gen types typescript`.

export type EquipmentStatus =
  | "activo"
  | "en_reparacion"
  | "dado_de_baja"
  | "mejorado"
  | "irrecuperable";

export type PurchaseStatus =
  | "solicitada"
  | "aprobada"
  | "en_proceso"
  | "recibida"
  | "rechazada";

export type UserRole = "super_admin" | "admin" | "tecnico" | "usuario";

export type FaultType = "hardware" | "software";

export type TicketStatus =
  | "abierto"
  | "en_diagnostico"
  | "en_reparacion"
  | "cerrado"
  | "cancelado";

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          rut: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          logo_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rut?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          logo_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          email: string;
          role: UserRole;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      equipment_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["equipment_types"]["Insert"]>;
        Relationships: [];
      };
      floor_plans: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          image_url: string;
          floor_number: number | null;
          building: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          image_url: string;
          floor_number?: number | null;
          building?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["floor_plans"]["Insert"]>;
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          company_id: string;
          floor_plan_id: string | null;
          name: string;
          floor: number | null;
          room: string | null;
          workstation: string | null;
          x_coordinate: number | null;
          y_coordinate: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          floor_plan_id?: string | null;
          name: string;
          floor?: number | null;
          room?: string | null;
          workstation?: string | null;
          x_coordinate?: number | null;
          y_coordinate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["locations"]["Insert"]>;
        Relationships: [];
      };
      equipment: {
        Row: {
          id: string;
          company_id: string;
          equipment_type_id: string;
          location_id: string | null;
          assigned_user_id: string | null;
          code: string;
          qr_code: string | null;
          brand: string;
          model: string;
          serial_number: string | null;
          status: EquipmentStatus;
          purchase_date: string | null;
          warranty_expiry: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          equipment_type_id: string;
          location_id?: string | null;
          assigned_user_id?: string | null;
          code: string;
          qr_code?: string | null;
          brand: string;
          model: string;
          serial_number?: string | null;
          status?: EquipmentStatus;
          purchase_date?: string | null;
          warranty_expiry?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["equipment"]["Insert"]>;
        Relationships: [];
      };
      parts: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          compatible_types: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description?: string | null;
          compatible_types?: string[] | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["parts"]["Insert"]>;
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          company_id: string;
          part_id: string;
          quantity: number;
          min_stock: number;
          unit_price: number | null;
          location_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          part_id: string;
          quantity?: number;
          min_stock?: number;
          unit_price?: number | null;
          location_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory"]["Insert"]>;
        Relationships: [];
      };
      repair_tickets: {
        Row: {
          id: string;
          company_id: string;
          equipment_id: string;
          reported_by: string | null;
          assigned_to: string | null;
          title: string;
          description: string | null;
          fault_type: FaultType | null;
          status: TicketStatus;
          diagnosis: string | null;
          solution: string | null;
          opened_at: string;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          equipment_id: string;
          reported_by?: string | null;
          assigned_to?: string | null;
          title: string;
          description?: string | null;
          fault_type?: FaultType | null;
          status?: TicketStatus;
          diagnosis?: string | null;
          solution?: string | null;
          opened_at?: string;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["repair_tickets"]["Insert"]>;
        Relationships: [];
      };
      repair_ticket_parts: {
        Row: {
          id: string;
          ticket_id: string;
          inventory_id: string;
          quantity_used: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          inventory_id: string;
          quantity_used: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["repair_ticket_parts"]["Insert"]>;
        Relationships: [];
      };
      purchase_orders: {
        Row: {
          id: string;
          company_id: string;
          requested_by: string | null;
          approved_by: string | null;
          status: PurchaseStatus;
          supplier: string | null;
          notes: string | null;
          requested_at: string;
          approved_at: string | null;
          received_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          requested_by?: string | null;
          approved_by?: string | null;
          status?: PurchaseStatus;
          supplier?: string | null;
          notes?: string | null;
          requested_at?: string;
          approved_at?: string | null;
          received_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_orders"]["Insert"]>;
        Relationships: [];
      };
      purchase_order_items: {
        Row: {
          id: string;
          purchase_order_id: string;
          part_id: string;
          quantity: number;
          unit_price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          part_id: string;
          quantity: number;
          unit_price?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_order_items"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      v_low_stock: {
        Row: {
          inventory_id: string;
          company: string;
          part_name: string;
          category: string;
          current_stock: number;
          min_stock: number;
          unit_price: number | null;
        };
        Relationships: [];
      };
      v_equipment_repair_count: {
        Row: {
          equipment_id: string;
          company: string;
          brand: string;
          model: string;
          code: string;
          equipment_type: string;
          total_tickets: number;
          last_ticket_date: string | null;
        };
        Relationships: [];
      };
      v_tickets_summary: {
        Row: {
          company: string;
          status: TicketStatus;
          total: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_my_company_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_my_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      public_get_equipment_by_qr: {
        Args: { p_qr_code: string };
        Returns: {
          equipment_id: string;
          company_name: string;
          equipment_type: string;
          brand: string;
          model: string;
          code: string;
          status: EquipmentStatus;
        }[];
      };
      public_create_repair_ticket: {
        Args: {
          p_qr_code: string;
          p_title: string;
          p_description: string | null;
          p_fault_type?: FaultType | null;
        };
        Returns: string;
      };
    };
    Enums: {
      equipment_status: EquipmentStatus;
      purchase_status: PurchaseStatus;
      user_role: UserRole;
      fault_type: FaultType;
      ticket_status: TicketStatus;
    };
  };
};
