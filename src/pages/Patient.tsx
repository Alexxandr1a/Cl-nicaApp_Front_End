import { useState, useEffect } from "react";
import { Search, Plus, Phone, Mail, ChevronRight } from "lucide-react";

// componentes UI
import { Button } from "../Components/ui/button";
import { Input } from "../Components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../Components/ui/dialog";
import { Label } from "../Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/ui/select";
import { Textarea } from "../Components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Components/ui/tabs";

// Sonner
import { toast } from "sonner";
import { apiUrl } from "../lib/api";

// Estrutura do paciente
interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  medications: string;
  insurance: string;
  address: string;
  observations: string;
  avatarUrl?: string;
}

const emptyPatient: Omit<Patient, "id"> = {
  name: "",
  cpf: "",
  birthDate: "",
  gender: "",
  phone: "",
  email: "",
  bloodType: "",
  allergies: "",
  conditions: "",
  medications: "",
  insurance: "",
  address: "",
  observations: "",
};

export default function Patients() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyPatient);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  
  const fetchPatients = async () => {
    try {
      const response = await fetch(apiUrl("/api/patients"));
      const text = await response.text();

      if (!response.ok) {
        console.error("Erro backend:", text);
        throw new Error("Erro ao buscar pacientes");
      }

      const json = JSON.parse(text);

      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map((p: any) => ({
          id: p.id,
          name: p.fullName,
          cpf: p.cpf,
          birthDate: p.dateOfBirth,
          gender: p.gender,
          phone: p.phone,
          email: p.email,
          bloodType: p.bloodGroup,

          insurance: p.insurance || p.insuranceProvider || "",
          medications: p.medications || p.medicationsInUse || "",

          allergies: p.allergies,
          conditions: p.conditions,
          address: p.address,
          observations: p.observations
        }));

        setPatients(mapped);
      } else {
        console.error("Formato inesperado:", json);
        setPatients([]);
      }

    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar os pacientes.");
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  
  const filtered = Array.isArray(patients)
    ? patients.filter(
      (p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.cpf?.includes(search)
    )
    : [];

  const validateForm = () => {
    if (!form.name.trim()) return "Nome é obrigatório";
    if (!form.cpf.trim()) return "CPF é obrigatório";
    if (!form.birthDate) return "Data de nascimento é obrigatória";
    if (!form.gender) return "Gênero é obrigatório";
    if (!form.phone.trim()) return "Telefone é obrigatório";
    if (!form.email.trim()) return "Email é obrigatório";
    if (!form.bloodType.trim()) return "Tipo sanguíneo é obrigatório";
    if (!form.allergies.trim()) return "Alergias é obrigatório";
    if (!form.conditions.trim()) return "Condições pré-existentes é obrigatório";
    if (!form.medications.trim()) return "Medicações contínuas é obrigatório";
    if (!form.insurance.trim()) return "Convênio é obrigatório";
    if (!form.address.trim()) return "Endereço é obrigatório";
    if (!form.observations.trim()) return "Observações médicas é obrigatório";
    return null;
  };

  const bloodMap: Record<string, string> = {
    "A+": "A_POSITIVO",
    "A-": "A_NEGATIVO",
    "B+": "B_POSITIVO",
    "B-": "B_NEGATIVO",
    "AB+": "AB_POSITIVO",
    "AB-": "AB_NEGATIVO",
    "O+": "O_POSITIVO",
    "O-": "O_NEGATIVO"
  };

  const handleSave = async () => {
    try {
      const error = validateForm();
      if (error) {
        toast.error(error);
        return;
      }

      const payload = {
        fullName: form.name,
        cpf: form.cpf.replace(/\D/g, ""),
        dateOfBirth: form.birthDate,
        gender: form.gender?.toUpperCase(),
        phone: form.phone.replace(/\D/g, ""),
        email: form.email,
        address: form.address,
        bloodGroup: bloodMap[form.bloodType] || null,
        insurance: form.insurance,
        allergies: form.allergies,
        conditions: form.conditions,
        medications: form.medications,
        observations: form.observations
      };

      const response = await fetch(apiUrl("/api/patients"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();

      if (!response.ok) {
        console.error("Erro backend:", text);
        toast.error("Erro ao salvar paciente");
        return;
      }
      toast.success("Paciente cadastrado com sucesso.");
      setDialogOpen(false);
      setForm(emptyPatient);

      await fetchPatients();

    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar com o servidor");
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleDelete = async (id: string) => { // id como string, pois vem do backend
    try {
      const response = await fetch(apiUrl(`/api/patients/${id}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.status === 204) { // sucesso
        toast.success("Paciente removido com sucesso.");
        setDetailsOpen(false);
        await fetchPatients(); 
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


  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    return numbers
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground">{patients.length} pacientes cadastrados</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Paciente
        </Button>
      </div>

      {/* Campo de busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground " />
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-black"
        />
      </div>

      {/* Lista de pacientes */}
      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10">
            Nenhum paciente encontrado
          </div>
        )}

        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              setSelectedPatient(p);
              setDetailsOpen(true);
            }}
            className="stat-card flex items-center gap-4 cursor-pointer group p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0 overflow-hidden">
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                (p.name || "")
                  .split(" ")
                  .map((n) => n[0] || "")
                  .join("")
                  .slice(0, 2)
              )}
            </div>

            {/* Informações principais */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
              <p className="text-xs text-gray-500">
                CPF: {p.cpf} · {p.insurance}
              </p>
            </div>

            {/* Contato */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {p.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {p.email}
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
        </div>

      {/* Modal Novo Paciente */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="!max-w-3xl w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">Dados Básicos</TabsTrigger>
              <TabsTrigger value="medical" className="flex-1">Dados Médicos</TabsTrigger>
              <TabsTrigger value="extra" className="flex-1">Observações</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome Completo</Label>
                  <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={(e) => updateField("cpf", formatCPF(e.target.value))} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" max="2010-12-31" value={form.birthDate} onChange={(e) => updateField("birthDate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gênero</Label>
                  <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => updateField("phone", formatPhone(e.target.value))} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Endereço</Label>
                <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} />
              </div>
            </TabsContent>
            <TabsContent value="medical" className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo Sanguíneo</Label>
                  <Select value={form.bloodType} onValueChange={(v) => updateField("bloodType", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Convênio</Label>
                  <Input value={form.insurance} onChange={(e) => updateField("insurance", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Alergias</Label>
                <Textarea value={form.allergies} onChange={(e) => updateField("allergies", e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Condições Pré-existentes</Label>
                <Textarea value={form.conditions} onChange={(e) => updateField("conditions", e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Medicações Contínuas</Label>
                <Textarea value={form.medications} onChange={(e) => updateField("medications", e.target.value)} rows={2} />
              </div>
            </TabsContent>
            <TabsContent value="extra" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Observações Médicas</Label>
                <Textarea value={form.observations} onChange={(e) => updateField("observations", e.target.value)} rows={6} placeholder="Informações adicionais sobre o paciente..." />
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Paciente</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="!max-w-3xl w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <p><strong>Nome:</strong> {selectedPatient.name}</p>
                <p><strong>CPF:</strong> {selectedPatient.cpf}</p>
                <p><strong>Nascimento:</strong> {selectedPatient.birthDate}</p>
                <p><strong>Gênero:</strong> {selectedPatient.gender}</p>
                <p><strong>Telefone:</strong> {selectedPatient.phone}</p>
                <p><strong>Email:</strong> {selectedPatient.email}</p>
                <p><strong>Convênio:</strong> {selectedPatient.insurance}</p>
                <p><strong>Tipo Sanguíneo:</strong> {selectedPatient.bloodType}</p>
              </div>

              <div>
                <p><strong>Endereço:</strong> {selectedPatient.address}</p>
              </div>

              <div>
                <p><strong>Alergias:</strong> {selectedPatient.allergies}</p>
              </div>

              <div>
                <p><strong>Condições:</strong> {selectedPatient.conditions}</p>
              </div>

              <div>
                <p><strong>Medicações:</strong> {selectedPatient.medications}</p>
              </div>

              <div>
                <p><strong>Observações:</strong> {selectedPatient.observations}</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedPatient.id)}
                >
                  Deletar Paciente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}