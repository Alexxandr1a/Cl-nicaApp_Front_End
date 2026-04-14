import { useState, useEffect } from "react";
import { Search, Plus, Phone, Clock, Star } from "lucide-react";
import { Button } from "../Components/ui/button";
import { Input } from "../Components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../Components/ui/dialog";
import { Label } from "../Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/ui/select";
import { Textarea } from "../Components/ui/textarea";
import { Badge } from "../Components/ui/badge";
import { toast } from "sonner";
import { apiUrl } from "../lib/api";

// Estrutura do médico
interface Doctor {
  id: string;
  name: string;
  crm: string;
  specialty: string;
  phone: string;
  email: string;
  horaInicio: string;
  horaFim: string;
  days: string[];
  bio: string;
  consultations: number;
  avatarUrl?: string;
}

const specialties = [
  "CARDIOLOGIA",
  "DERMATOLOGIA",
  "ORTOPEDIA",
  "NEUROLOGIA",
  "PEDIATRIA",
  "GINECOLOGIA",
  "UROLOGIA",
  "OFTALMOLOGIA",
  "PSIQUIATRIA",
  "ENDOCRINOLOGIA",
];

const emptyDoctor = {
  name: "",
  crm: "",
  specialty: "",
  phone: "",
  email: "",
  horaInicio: "00:00",
  horaFim: "23:59",
  days: [],
  bio: "",
  consultations: 0,
};

export default function Doctors() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState(emptyDoctor);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch(apiUrl("/api/doctors"));
      if (!response.ok) throw new Error("Erro ao buscar médicos");

      const result = await response.json();

      const mapped = result.data.map((d: any) => ({
        id: String(d.id),
        name: d.fullName || "",
        crm: d.licenseNumber || "",
        specialty: d.specialization || "",
        phone: d.phone || "",
        email: d.email || "",
        horaInicio: d.startTime || "",
        horaFim: d.endTime || "",
        bio: d.biography || "",
        days: [],
        consultations: 0,
      }));

      setDoctors(mapped);
    } catch (error: any) {
      console.error("ERRO FETCH:", error.message);
      toast.error("Erro ao carregar médicos");
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filtered = doctors.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    try {
      const hasEmptyField =
        !form.name.trim() ||
        !form.crm.trim() ||
        !form.specialty.trim() ||
        !form.phone.trim() ||
        !form.email.trim() ||
        !form.horaInicio.trim() ||
        !form.horaFim.trim() ||
        !form.bio.trim();

      if (hasEmptyField) {
        toast.error("Nenhum campo pode ficar em branco.");
        return;
      }

      const payload = {
        fullName: form.name,
        licenseNumber: form.crm,
        specialization: form.specialty,
        phone: form.phone,
        email: form.email,
        startTime: form.horaInicio,
        endTime: form.horaFim,
        biography: form.bio,
      };

      console.log("ENVIANDO:", payload); 

      const response = await fetch(apiUrl("/api/doctors"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.text();

      if (!response.ok) {
        console.error("ERRO BACKEND:", data);
        toast.error(data); 
        return;
      }

      toast.success("Médico cadastrado com sucesso");

      await fetchDoctors();

      setForm(emptyDoctor);
      setDialogOpen(false);
    } catch (error: any) {
      console.error("ERRO GERAL:", error.message);
      toast.error("Erro de conexão com o servidor");
    }
  };

  const updateField = (field: keyof typeof form, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    return numbers
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(apiUrl(`/api/doctors/${id}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.status === 204) { // sucesso
        toast.success("Paciente removido com sucesso.");
        setDialogOpen(false);
        await fetchDoctors(); // recarrega a lista
      } else {
        const text = await response.text();
        console.error("Erro backend:", text);
        toast.error("Erro ao deletar paciente.");
      }

    } catch (error) {
      console.error(error);
      toast.error("Erro ao deletar paciente.");
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Médicos</h1>
          <p className="text-sm text-muted-foreground">{doctors.length} profissionais cadastrados</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Médico
        </Button>
      </div>

      {/* Campo de busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou especialidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-black"
        />
      </div>

      {/* Lista de médicos */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10">
            Nenhum médico encontrado
          </div>
        )}

        {filtered.map((d) => (
          <div
            key={d.id}
            onClick={() => {
              setSelectedDoctor(d);
              setDetailsOpen(true);
            }}
            className="stat-card space-y-4 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0 overflow-hidden">
                {d.avatarUrl ? (
                  <img
                    src={d.avatarUrl}
                    alt={d.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (d.name || "")
                    .split(" ")
                    .map((n) => n[0] || "")
                    .join("")
                    .slice(0, 2)
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.crm}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">{d.specialty}</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{d.bio}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{d.horaInicio}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{d.horaFim}</span>

            </div>
            <div className="flex flex-wrap gap-1">
              {d.days.map((day) => (
                <span key={day} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-medium">{day}</span>

              ))}
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
              <span className="text-muted-foreground">{d.consultations} consultas realizadas</span>
              <span className="flex items-center gap-1 text-primary font-medium"><Phone className="w-3 h-3" /></span>
            </div>
          </div>

        ))}
      </div>

      {/* Modal Novo Médico */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="!max-w-3xl w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Médico</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Nome Completo</Label><Input value={form.name} onChange={(e) => updateField("name", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>CRM</Label><Input placeholder="CRM/UF 000000" value={form.crm} onChange={(e) => updateField("crm", e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Especialidade</Label>
                <Select value={form.specialty} onValueChange={(v) => updateField("specialty", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Telefone</Label> <Input value={form.phone} onChange={(e) => updateField("phone", formatPhone(e.target.value))} placeholder="(00) 00000-0000" /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Horário de Atendimento</Label>
                <Input
                  type="time"
                  value={form.horaInicio}
                  onChange={(e) => updateField("horaInicio", e.target.value)}
                />

                <Input
                  type="time"
                  value={form.horaFim}
                  onChange={(e) => updateField("horaFim", e.target.value)}
                /></div>
            </div>

            <div className="space-y-1.5"><Label>Biografia</Label><Textarea rows={3} value={form.bio} onChange={(e) => updateField("bio", e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DETALHES */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="!max-w-3xl w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Médico</DialogTitle>
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <p><strong>Nome:</strong> {selectedDoctor.name}</p>
                <p><strong>CRM:</strong> {selectedDoctor.crm}</p>
                <p><strong>Especialidade:</strong> {selectedDoctor.specialty}</p>
                <p><strong>Telefone:</strong> {selectedDoctor.phone}</p>
                <p><strong>Email:</strong> {selectedDoctor.email}</p>
                <p><strong>Início:</strong> {selectedDoctor.horaInicio}</p>
                <p><strong>Fim:</strong> {selectedDoctor.horaFim}</p>
              </div>

              <div>
                <p><strong>Biografia:</strong> {selectedDoctor.bio}</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedDoctor.id)}
                >
                  Deletar Médico
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}