// Tipos escritos a mano a partir de sighe_fresh_schema.sql (no generados por
// `supabase gen types`, ya que el proyecto no tiene la CLI de Supabase
// vinculada). Si en algún momento se linkea el proyecto, reemplazar este
// archivo por la salida real de `supabase gen types typescript`.

export type EquipmentStatus =
  | "activo"
  | "en_reparacion"
  | "dado_de_baja"
  | "mejorado"
  | "irrecuperable";

export type UserRole = "super_admin" | "admin" | "tecnico" | "usuario";

export type FaultType = "hardware" | "software";

export type TicketStatus = "pendiente" | "en_revision" | "resuelto" | "cancelado";

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
          company_id: string | null;
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
          company_id?: string | null;
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
      locations: {
        Row: {
          id: string;
          company_id: string;
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
        Relationships: [
          {
            foreignKeyName: "equipment_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_equipment_type_id_fkey";
            columns: ["equipment_type_id"];
            isOneToOne: false;
            referencedRelation: "equipment_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_assigned_user_id_fkey";
            columns: ["assigned_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
          company_id: string | null;
          equipment_id: string;
          reported_by: string | null;
          reporter_name: string | null;
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
          company_id?: string | null;
          equipment_id: string;
          reported_by?: string | null;
          reporter_name?: string | null;
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
    };
    Views: {
      v_tickets_summary: {
        Row: {
          company: string;
          status: TicketStatus;
          total: number;
        };
        Relationships: [];
      };
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
    };
    Functions: {
      current_company_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin_of_own_company: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      equipment_status: EquipmentStatus;
      user_role: UserRole;
      fault_type: FaultType;
      ticket_status: TicketStatus;
    };
  };
};
