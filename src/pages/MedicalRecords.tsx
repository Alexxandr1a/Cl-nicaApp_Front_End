import { useEffect, useRef, useState } from "react";
import { Search, Plus, FileText, Calendar, Stethoscope, Paperclip, Pill, ChevronRight } from "lucide-react";
import { Button } from "../Components/ui/button";
import { Input } from "../Components/ui/input";
import { Textarea } from "../Components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../Components/ui/dialog";
import { Label } from "../Components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../Components/ui/select";
import { Badge } from "../Components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../Components/ui/tabs";
import { toast } from "sonner";
import { apiUrl } from "../lib/api";

type ApiResponse<T> = {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: T;
};

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

type MedicalRecordsType = "CONSULTA" | "RETORNO" | "EMERGENCIA";

// Estrutura do prontuário
interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  doctorId: string;
  doctor: string;
  diagnosis: string;
  symptoms: string;
  prescription: string;
  notes: string;
  type: MedicalRecordsType;
}

type PatientOption = { id: string; name: string };
type DoctorOption = { id: string; name: string };
type Attachment = {
  id: string;
  fileName: string;
  fileType?: string;
  sizeBytes?: number;
};

// Formulário vazio
const emptyRecord: Omit<MedicalRecord, "id"> = {
  patientId: "",
  patientName: "",
  date: "",
  doctorId: "",
  doctor: "",
  diagnosis: "",
  symptoms: "",
  prescription: "",
  notes: "",
  type: "CONSULTA",
};

// Retorna a data de hoje no formato YYYY-MM-DD 
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MedicalRecords() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<MedicalRecord | null>(null);
  const [form, setForm] = useState(emptyRecord);

  // Lista de registros do backend
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [recordAttachments, setRecordAttachments] = useState<Record<string, Attachment[]>>({});
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [viewSelectedFile, setViewSelectedFile] = useState<File | null>(null);

  const todayStr = getTodayDateString();

  useEffect(() => {
    async function fetchPatients() {
      try {
        const response = await fetch(apiUrl("/api/patients"));
        const text = await response.text();
        if (!response.ok) throw new Error(text || "Erro ao buscar pacientes");
        const json: ApiResponse<any[]> = JSON.parse(text);
        const mapped: PatientOption[] = (json.data || []).map((p: any) => ({
          id: String(p.id),
          name: p.fullName || "",
        }));
        setPatients(mapped);
      } catch (error: any) {
        console.error(error);
        toast.error("Não foi possível carregar os pacientes.");
      }
    }

    async function fetchDoctors() {
      try {
        const response = await fetch(apiUrl("/api/doctors"));
        const text = await response.text();
        if (!response.ok) throw new Error(text || "Erro ao buscar médicos");
        const json: ApiResponse<any[]> = JSON.parse(text);
        const mapped: DoctorOption[] = (json.data || []).map((d: any) => ({
          id: String(d.id),
          name: d.fullName || "",
        }));
        setDoctors(mapped);
      } catch (error: any) {
        console.error(error);
        toast.error("Não foi possível carregar os médicos.");
      }
    }

    async function fetchRecords() {
      try {
        const response = await fetch(
          apiUrl("/api/medical-records?size=200&sort=date,desc")
        );
        const text = await response.text();
        if (!response.ok) throw new Error(text || "Erro ao buscar prontuários");

        const json: ApiResponse<Page<any>> = JSON.parse(text);
        const content = json?.data?.content ?? [];

        const mapped: MedicalRecord[] = content.map((mr: any) => ({
          id: String(mr.id),
          patientId: mr.patientId != null ? String(mr.patientId) : "",
          patientName: mr.patientFullName || "",
          doctorId: mr.doctorId != null ? String(mr.doctorId) : "",
          doctor: mr.doctorFullName || "",
          date: mr.date || "",
          diagnosis: mr.diagnosis || "",
          symptoms: mr.symptoms || "",
          prescription: mr.prescription || "",
          notes: mr.evolutionObservations || "",
          type: (mr.type as MedicalRecordsType) || "CONSULTA",
        }));

        setRecords(mapped);
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível carregar os prontuários.");
      }
    }

    fetchPatients();
    fetchDoctors();
    fetchRecords();
  }, []);

  useEffect(() => {
    async function fetchAttachments(recordId: string) {
      try {
        setLoadingAttachments(true);
        const response = await fetch(
          apiUrl(`/api/medical-records/${recordId}/attachments`)
        );
        const text = await response.text();
        if (!response.ok) throw new Error(text || "Erro ao buscar anexos");

        const json: ApiResponse<any[]> = JSON.parse(text);
        const mapped: Attachment[] = (json.data || []).map((a: any) => ({
          id: String(a.id),
          fileName: a.fileName || "Arquivo",
          fileType: a.fileType,
          sizeBytes: a.sizeBytes,
        }));

        setRecordAttachments((prev) => ({ ...prev, [recordId]: mapped }));
      } catch (e) {
        console.error(e);
        // não trava o modal se falhar
        setRecordAttachments((prev) => ({ ...prev, [recordId]: [] }));
      } finally {
        setLoadingAttachments(false);
      }
    }

    if (viewRecord?.id) {
      fetchAttachments(viewRecord.id);
    }
  }, [viewRecord?.id]);

  const openAttachment = (recordId: string, attachmentId: string) => {
    window.open(
      apiUrl(`/api/medical-records/${recordId}/attachments/${attachmentId}/download`),
      "_blank",
      "noopener,noreferrer"
    );
  };

  const uploadAttachment = async (recordId: string, file: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append("arquivo", file);

      const up = await fetch(apiUrl(`/api/medical-records/${recordId}/attachments`), {
        method: "POST",
        body: formData,
      });

      const upText = await up.text();
      let upJson: ApiResponse<any> | null = null;
      try {
        upJson = upText ? JSON.parse(upText) : null;
      } catch {
        upJson = null;
      }

      if (!up.ok || (upJson && upJson.success === false)) {
        toast.error(upJson?.message ?? "Falha ao enviar anexo.");
        return false;
      }

      const listResponse = await fetch(apiUrl(`/api/medical-records/${recordId}/attachments`));
      const listText = await listResponse.text();
      if (listResponse.ok) {
        const listJson: ApiResponse<any[]> = listText ? JSON.parse(listText) : { success: true, data: [] };
        const mapped: Attachment[] = (listJson.data || []).map((a: any) => ({
          id: String(a.id),
          fileName: a.fileName || "Arquivo",
          fileType: a.fileType,
          sizeBytes: a.sizeBytes,
        }));
        setRecordAttachments((prev) => ({ ...prev, [recordId]: mapped }));
      }

      return true;
    } catch {
      toast.error("Erro ao enviar anexo.");
      return false;
    }
  };

  const filtered = records.filter(
    (r) =>
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  const updateField = (field: keyof typeof form, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      const hasEmptyField =
        !form.patientId ||
        !form.doctorId ||
        !form.date ||
        !form.type ||
        !form.symptoms.trim() ||
        !form.diagnosis.trim() ||
        !form.prescription.trim() ||
        !form.notes.trim() ||
        !selectedFile;

      if (hasEmptyField) {
        toast.error("Nenhum campo pode ficar em branco.");
        return;
      }

      // Regra de negócio: data não pode ser anterior ao dia atual
      if (form.date < todayStr) {
        toast.error("Não é possível registrar um prontuário em data anterior ao dia de hoje.");
        return;
      }

      const payload = {
        patientId: Number(form.patientId),
        doctorId: Number(form.doctorId),
        date: form.date,
        type: form.type,
        symptoms: form.symptoms,
        diagnosis: form.diagnosis,
        prescription: form.prescription,
        evolutionObservations: form.notes,
      };

      const response = await fetch(apiUrl("/api/medical-records"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      if (!response.ok) {
        console.error("Erro backend:", text);
        try {
          const maybe = JSON.parse(text);
          toast.error(maybe?.message ?? "Não foi possível salvar o prontuário.");
        } catch {
          toast.error(text || "Não foi possível salvar o prontuário.");
        }
        return;
      }

      const json: ApiResponse<any> = JSON.parse(text);
      const mr = json.data;

      if (selectedFile && mr?.id != null) {
        const ok = await uploadAttachment(String(mr.id), selectedFile);
        if (ok) {
          toast.success("Prontuário e anexo salvos com sucesso");
        } else {
          toast.error("Prontuário salvo, mas falhou ao enviar o anexo.");
        }
      } else {
        toast.success("Prontuário salvo com sucesso");
      }

      const newRecord: MedicalRecord = {
        id: String(mr.id),
        patientId: mr.patientId != null ? String(mr.patientId) : form.patientId,
        patientName: mr.patientFullName || form.patientName,
        doctorId: mr.doctorId != null ? String(mr.doctorId) : form.doctorId,
        doctor: mr.doctorFullName || form.doctor,
        date: mr.date || form.date,
        diagnosis: mr.diagnosis || form.diagnosis,
        symptoms: mr.symptoms || form.symptoms,
        prescription: mr.prescription || form.prescription,
        notes: mr.evolutionObservations || form.notes,
        type: (mr.type as MedicalRecordsType) || form.type,
      };

      setRecords((prev) => [newRecord, ...prev]);
      setForm(emptyRecord);
      setSelectedFile(null);
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar o prontuário.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const response = await fetch(apiUrl(`/api/medical-records/${recordId}`), {
        method: "DELETE",
      });

      if (!response.ok) {
        const text = await response.text();
        toast.error(text || "Erro ao excluir prontuário.");
        return;
      }

      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      setRecordAttachments((prev) => {
        const copy = { ...prev };
        delete copy[recordId];
        return copy;
      });
      setViewRecord(null);
      toast.success("Prontuário excluído com sucesso.");
    } catch {
      toast.error("Erro ao excluir prontuário.");
    }
  };

  const handleUploadFromView = async () => {
    if (!viewRecord?.id || !viewSelectedFile) {
      toast.error("Selecione um arquivo para enviar.");
      return;
    }
    setUploadingAttachment(true);
    const ok = await uploadAttachment(viewRecord.id, viewSelectedFile);
    setUploadingAttachment(false);
    if (ok) {
      toast.success("Anexo salvo com sucesso.");
      setViewSelectedFile(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prontuários Eletrônicos</h1>
          <p className="text-sm text-muted-foreground">Histórico médico dos pacientes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Registro
        </Button>
      </div>

      {/* Campo de busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente ou diagnóstico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de registros */}
      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10">
            Nenhum prontuário encontrado
          </div>
        )}

        {filtered.map((r) => (
          <div
            key={r.id}
            onClick={() => setViewRecord(r)}
            className="stat-card flex items-center gap-4 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground text-sm">{r.patientName}</p>
                <Badge variant="secondary" className="text-[10px]">{r.type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{r.diagnosis}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{r.date}</span>
                <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{r.doctor}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* View Record Dialog */}
      <Dialog
        open={!!viewRecord}
        onOpenChange={(open) => {
          if (!open) {
            setViewRecord(null);
            setViewSelectedFile(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {viewRecord && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Prontuário - {viewRecord.patientName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{viewRecord.date}</span>
                  <span className="flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5" />{viewRecord.doctor}</span>
                  <Badge variant="secondary">{viewRecord.type}</Badge>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sintomas</h4>
                  <p className="text-sm text-foreground">{viewRecord.symptoms}</p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diagnóstico</h4>
                  <p className="text-sm text-foreground font-medium">{viewRecord.diagnosis}</p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Pill className="w-3.5 h-3.5" /> Prescrição</h4>
                  <pre className="text-sm text-foreground whitespace-pre-wrap bg-muted p-3 rounded-lg">{viewRecord.prescription}</pre>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evolução / Observações</h4>
                  <p className="text-sm text-foreground">{viewRecord.notes}</p>
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5" /> Anexos
                    </h4>
                    {loadingAttachments && (
                      <span className="text-xs text-muted-foreground">Carregando anexos...</span>
                    )}

                    {(recordAttachments[viewRecord.id] || []).length === 0 && !loadingAttachments && (
                      <p className="text-xs text-muted-foreground">Nenhum anexo neste prontuário.</p>
                    )}

                    <div className="grid gap-2">
                      {(recordAttachments[viewRecord.id] || []).map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => openAttachment(viewRecord.id, a.id)}
                          className="w-full text-left flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors px-3 py-2"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm text-foreground truncate">{a.fileName}</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            Abrir
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Enviar novo anexo
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="file"
                      accept="application/pdf,image/jpeg,image/jpg,image/png"
                      onChange={(e) => setViewSelectedFile(e.target.files?.[0] ?? null)}
                    />
                    <Button
                      type="button"
                      onClick={handleUploadFromView}
                      disabled={uploadingAttachment || !viewSelectedFile}
                    >
                      {uploadingAttachment ? "Enviando..." : "Salvar Anexo"}
                    </Button>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleDeleteRecord(viewRecord.id)}
                  >
                    Deletar prontuário
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Record Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="!max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Registro de Prontuário</DialogTitle></DialogHeader>
          <Tabs defaultValue="consultation" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="consultation" className="flex-1">Consulta</TabsTrigger>
              <TabsTrigger value="prescription" className="flex-1">Prescrição</TabsTrigger>
              <TabsTrigger value="attachments" className="flex-1">Anexos</TabsTrigger>
            </TabsList>
            <TabsContent value="consultation" className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Paciente</Label>
                  <Select
                    value={form.patientId}
                    onValueChange={(v) => {
                      updateField("patientId", v);
                      const found = patients.find((p) => p.id === v);
                      updateField("patientName", found?.name || "");
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Médico</Label>
                  <Select
                    value={form.doctorId}
                    onValueChange={(v) => {
                      updateField("doctorId", v);
                      const found = doctors.find((d) => d.id === v);
                      updateField("doctor", found?.name || "");
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    min={todayStr}
                  />
                </div>
                <div className="space-y-1.5"><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => updateField("type", v as MedicalRecordsType)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSULTA">Consulta</SelectItem>
                      <SelectItem value="RETORNO">Retorno</SelectItem>
                      <SelectItem value="EMERGENCIA">Emergência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Sintomas</Label><Textarea rows={3} value={form.symptoms} onChange={(e) => updateField("symptoms", e.target.value)} placeholder="Descreva os sintomas do paciente..." /></div>
              <div className="space-y-1.5"><Label>Diagnóstico</Label><Textarea rows={2} value={form.diagnosis} onChange={(e) => updateField("diagnosis", e.target.value)} placeholder="Diagnóstico..." /></div>
              <div className="space-y-1.5"><Label>Evolução / Observações</Label><Textarea rows={3} value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Notas de evolução..." /></div>
            </TabsContent>
            <TabsContent value="prescription" className="space-y-4 mt-4">
              <div className="space-y-1.5"><Label>Prescrição Médica</Label><Textarea rows={8} value={form.prescription} onChange={(e) => updateField("prescription", e.target.value)} placeholder="Medicamento - Dosagem - Posologia&#10;Ex: Losartana 50mg - 1x ao dia" /></div>
            </TabsContent>
            <TabsContent value="attachments" className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Paperclip className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Arraste exames ou imagens aqui</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (máx. 10MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Selecionar Arquivo
                </Button>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Selecionado: <span className="font-medium">{selectedFile.name}</span>
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Prontuário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}