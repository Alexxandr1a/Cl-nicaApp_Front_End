import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, User, Stethoscope, CalendarDays, Monitor, MapPin, Loader2 } from "lucide-react";
import { Button } from "../Components/ui/button";
import { Input } from "../Components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../Components/ui/dialog";
import { Label } from "../Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/ui/select";
import { cn } from "../lib/utils";
import { apiUrl, authHeaders } from "../lib/api";
import { toast } from "sonner";

const CALENDAR_TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const mins = 7 * 60 + i * 30;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

const toLocalYmd = (d: Date) => {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
};

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface RawAppointment {
  id: string | number;
  doctorId: string | number;
  patientId: string | number;
  date: string;
  startTime: string;
  endTime?: string;
  status: string;
  type: string;
}

interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  patient: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: "PRESENCIAL" | "ONLINE";
  status: "CONFIRMADO" | "PENDENTE" | "CANCELADO" | "COMPLETA";
}

const statusCardStyle: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  CONFIRMADO: { border: "border-l-[3px] border-l-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-400" },
  PENDENTE:   { border: "border-l-[3px] border-l-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/40",   text: "text-amber-700 dark:text-amber-300",   dot: "bg-amber-400"   },
  CANCELADO:  { border: "border-l-[3px] border-l-rose-400",    bg: "bg-rose-50 dark:bg-rose-950/40",     text: "text-rose-700 dark:text-rose-300",     dot: "bg-rose-400"    },
  COMPLETA:   { border: "border-l-[3px] border-l-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/40",     text: "text-blue-700 dark:text-blue-300",     dot: "bg-blue-400"    },
};

const statusLabel: Record<string, string> = {
  CONFIRMADO: "Confirmado", PENDENTE: "Pendente", CANCELADO: "Cancelado", COMPLETA: "Concluída",
};

const statusBadge: Record<string, string> = {
  CONFIRMADO: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300",
  PENDENTE: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300",
  CANCELADO: "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/40 dark:text-rose-300",
  COMPLETA: "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300",
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-rose-500 mt-1">{msg}</p>;
}

const toHHMM = (t: string) => (t ?? "").slice(0, 5);

const enrich = (
  raw: RawAppointment,
  dMap: Record<string, string>,
  pMap: Record<string, string>,
): Appointment => ({
  id: String(raw.id),
  doctorId: String(raw.doctorId),
  patientId: String(raw.patientId),
  doctor: dMap[String(raw.doctorId)]  ?? `Médico #${raw.doctorId}`,
  patient: pMap[String(raw.patientId)] ?? `Paciente #${raw.patientId}`,
  specialty: "",
  date: raw.date,
  time: toHHMM(raw.startTime),
  type: (raw.type   as Appointment["type"])   ?? "PRESENCIAL",
  status: (raw.status as Appointment["status"]) ?? "PENDENTE",
});

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [doctorMap,  setDoctorMap]  = useState<Record<string, string>>({});
  const [patientMap, setPatientMap] = useState<Record<string, string>>({});

  const [patientSearch, setPatientSearch] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const docRes  = await fetch(apiUrl("/api/doctors"));
        const docJson = await docRes.json();
        const docList: any[] = docJson.data ?? [];
        setDoctors(docList);
        const dMap: Record<string, string> = {};
        docList.forEach(d => { dMap[String(d.id)] = d.fullName; });
        setDoctorMap(dMap);

        const apptRes  = await fetch(apiUrl("/api/appointments"));
        const apptJson = await apptRes.json();
        const rawList: RawAppointment[] = apptJson.data ?? [];

        const pMap: Record<string, string> = {};
        try {
          const patRes  = await fetch(apiUrl("/api/patients"));
          const patJson = await patRes.json();
          const patList: any[] = patJson.data ?? [];
          patList.forEach(p => { pMap[String(p.id)] = p.fullName; });
        } catch {
          console.warn("Could not load patients list. Names will show as IDs.");
        }
        setPatientMap(pMap);
        setAppointments(rawList.map(r => enrich(r, dMap, pMap)));
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar agendamentos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getWeekDates = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

  const getAppointmentsForDateHour = (date: Date, hour: string) => {
    const dateStr = toLocalYmd(date);
    return appointments.filter(a => a.date === dateStr && a.time === hour);
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  const generateHours = (start: string, end: string, appts: Appointment[], dateStr: string) => {
    const hours: string[] = [];
    const now = new Date();
    const isSelectedToday = dateStr === toLocalYmd(now);
    const current = new Date();
    const [sh, sm] = start.split(":").map(Number);
    current.setHours(sh, sm, 0, 0);
    const endDate = new Date();
    const [eh, em] = end.split(":").map(Number);
    endDate.setHours(eh, em, 0, 0);
    while (current <= endDate) {
      const hourStr = current.toTimeString().slice(0, 5);
      const isPast  = isSelectedToday && current < now;
      const isBusy  = appts.some(a => a.time === hourStr && a.date === dateStr);
      if (!isPast && !isBusy) hours.push(hourStr);
      current.setMinutes(current.getMinutes() + 30);
    }
    return hours;
  };

  const resetForm = () => {
    setPatientSearch(""); setPatientSuggestions([]); setSelectedPatient(null);
    setSelectedDoctor(null); setAvailableHours([]); setSelectedHour("");
    setSelectedDate(""); setSelectedType(""); setSelectedStatus("");
    setFormErrors({}); setIsSubmitting(false);
  };

  //Impede agendamento duplicado no mesmo dia
  const patientAlreadyBookedOnDate = (): boolean => {
    if (!selectedPatient || !selectedDate) return false;
    return appointments.some(
      a =>
        String(a.patientId) === String(selectedPatient.id) &&
        a.date === selectedDate &&
        a.status !== "CANCELADO", 
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedPatient) e.patient = "Selecione um paciente da lista";
    if (!selectedDoctor)  e.doctor  = "Selecione um médico";
    if (!selectedDate)    e.date    = "Selecione uma data";
    if (!selectedHour)    e.hour    = "Selecione um horário";
    if (!selectedType)    e.type    = "Selecione o tipo da consulta";
    if (!selectedStatus)  e.status  = "Selecione o status da consulta";

    // Validação de duplicidade no dia 
    if (selectedPatient && selectedDate && patientAlreadyBookedOnDate()) {
      e.date = `${selectedPatient.fullName} já possui uma consulta neste dia. Escolha outra data.`;
    }

    return e;
  };

  const handleSubmit = async () => {
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (errors.type || errors.status) {
        toast.error("Nenhum campo pode ficar em branco.");
      }
      
      if (errors.date?.includes("já possui uma consulta")) {
        toast.error("Paciente já possui consulta neste dia!", {
          description: "Um paciente só pode ter uma consulta por dia. Selecione outra data.",
        });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/appointments"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          doctorId:  selectedDoctor.id,
          patientId: selectedPatient.id,
          date:      selectedDate,
          startTime: selectedHour,
          type:      selectedType  || "PRESENCIAL",
          status:    selectedStatus || "PENDENTE",
        }),
      });
      const text = await res.text();
      let data: { success?: boolean; message?: string; data?: RawAppointment } = {};
      try { if (text) data = JSON.parse(text); } catch { /* não é JSON */ }
      if (!res.ok || data.success === false) {
        toast.error(data.message || "Erro ao agendar");
        setIsSubmitting(false);
        return;
      }
      toast.success("Consulta agendada com sucesso!");
      if (data.data) {
        const newPMap = { ...patientMap, [String(selectedPatient.id)]: selectedPatient.fullName };
        setPatientMap(newPMap);
        setAppointments(prev => [...prev, enrich(data.data, doctorMap, newPMap)]);
        if (selectedDate) {
          const [y, mo, d] = selectedDate.split("-").map(Number);
          setCurrentDate(new Date(y, mo - 1, d));
        }
      }
      resetForm();
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão com o servidor");
      setIsSubmitting(false);
    }
  };

  const openDetail = (appt: Appointment) => {
    setDetailAppointment(appt);
    setNewStatus(appt.status);
    setChangingStatus(false);
    setDetailOpen(true);
  };

  const handleStatusChange = async () => {
    if (!detailAppointment || newStatus === detailAppointment.status) { setChangingStatus(false); return; }
    try {
      const statusQ = new URLSearchParams({ status: newStatus });
      const res  = await fetch(apiUrl(`/api/appointments/${detailAppointment.id}/status?${statusQ}`), {
        method: "PUT",
        headers: { ...authHeaders() },
      });
      const text = await res.text();
      let data: { success?: boolean; message?: string; data?: RawAppointment } = {};
      try { if (text) data = JSON.parse(text); } catch {}
      if (!res.ok || data.success === false) { toast.error(data.message || "Erro ao atualizar status"); return; }
      const updated = data.data
        ? enrich(data.data, doctorMap, patientMap)
        : { ...detailAppointment, status: newStatus as Appointment["status"] };
      setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      setDetailAppointment(updated);
      setNewStatus(updated.status);
      setChangingStatus(false);
      toast.success("Status atualizado!");
    } catch {
      toast.error("Erro de conexão com o servidor");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/*Header*/}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agendamentos</h1>
          <div className="flex items-center gap-1 mt-0.5">
            <button
              onClick={prevWeek}
              aria-label="Semana anterior"
              className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <p className="text-sm text-muted-foreground select-none">
              Calendário semanal de consultas
            </p>
            <button
              onClick={nextWeek}
              aria-label="Próxima semana"
              className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Consulta
        </Button>
      </div>

      {/*Calendar*/}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={prevWeek}><ChevronLeft className="w-4 h-4" /></Button>
          <h2 className="text-sm font-semibold text-foreground capitalize">
            {currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </h2>
          <Button variant="ghost" size="icon" onClick={nextWeek}><ChevronRight className="w-4 h-4" /></Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Carregando agendamentos...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border pb-2 mb-2">
                <div />
                {weekDates.map((date, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[11px] text-muted-foreground uppercase">{DAYS[i]}</p>
                    <p className={cn("text-xl font-bold", isToday(date) ? "text-primary" : "text-foreground")}>
                      {date.getDate()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-0">
                {CALENDAR_TIME_SLOTS.map(hour => (
                  <div key={hour} className="grid grid-cols-[64px_repeat(7,1fr)] min-h-[58px] border-b border-border/30">
                    <div className="text-[11px] text-muted-foreground font-medium pt-1.5 pr-2 text-right leading-tight">{hour}</div>
                    {weekDates.map((date, i) => {
                      const appts = getAppointmentsForDateHour(date, hour);
                      return (
                        <div key={i} className={cn("border-l border-border/30 px-1.5 py-1", isToday(date) && "bg-primary/5")}>
                          {appts.map(a => {
                            const s = statusCardStyle[a.status] ?? statusCardStyle["PENDENTE"];
                            return (
                              <div
                                key={a.id}
                                onClick={() => openDetail(a)}
                                className={cn(
                                  "rounded-lg px-3 py-2.5 mb-1 cursor-pointer select-none",
                                  "transition-all duration-150 hover:brightness-95 hover:shadow-sm active:scale-[0.98]",
                                  "border border-transparent min-h-13",
                                  s.border, s.bg,
                                )}
                              >
                                <p className={cn("text-xs font-semibold truncate leading-snug", s.text)}>{a.patient}</p>
                                <p className={cn("text-[11px] truncate opacity-80 leading-snug mt-1", s.text)}>{a.doctor}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal*/}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="!max-w-md">
          {detailAppointment && (() => {
            const s = statusCardStyle[detailAppointment.status];
            return (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <DialogTitle className="text-base font-semibold">Detalhes da Consulta</DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">ID #{detailAppointment.id}</p>
                    </div>
                    <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0", statusBadge[detailAppointment.status])}>
                      {statusLabel[detailAppointment.status]}
                    </span>
                  </div>
                </DialogHeader>
                <div className={cn("h-1 rounded-full -mt-1 mb-4", s.dot)} />
                <div className="space-y-3">
                  <div className={cn("flex items-center gap-3 p-3 rounded-lg", s.bg)}>
                    <User className={cn("w-4 h-4 shrink-0", s.text)} />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Paciente</p>
                      <p className="text-sm font-medium text-foreground">{detailAppointment.patient}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                    <Stethoscope className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Médico</p>
                      <p className="text-sm font-medium text-foreground">{detailAppointment.doctor}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                      <CalendarDays className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Data</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(detailAppointment.date + "T00:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                      <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Horário</p>
                        <p className="text-sm font-medium text-foreground">{detailAppointment.time}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                    {detailAppointment.type === "ONLINE"
                      ? <Monitor className="w-4 h-4 shrink-0 text-muted-foreground" />
                      : <MapPin   className="w-4 h-4 shrink-0 text-muted-foreground" />
                    }
                    <div>
                      <p className="text-[10px] text-muted-foreground">Modalidade</p>
                      <p className="text-sm font-medium text-foreground">
                        {detailAppointment.type === "ONLINE" ? "Online" : "Presencial"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border pt-4 mt-4">
                  {!changingStatus ? (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Atualizar status da consulta</p>
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setChangingStatus(true)}>
                        Alterar status
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-xs">Novo status</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["CONFIRMADO", "PENDENTE", "CANCELADO", "COMPLETA"] as const).map(st => {
                          const ss = statusCardStyle[st];
                          const isSelected = newStatus === st;
                          return (
                            <button key={st} onClick={() => setNewStatus(st)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                                isSelected
                                  ? cn(ss.bg, ss.border, ss.text, "shadow-sm")
                                  : "border-border text-muted-foreground hover:bg-muted/50"
                              )}
                            >
                              <span className={cn("w-2 h-2 rounded-full shrink-0", isSelected ? ss.dot : "bg-muted-foreground/30")} />
                              {statusLabel[st]}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" className="text-xs h-8"
                          onClick={() => { setChangingStatus(false); setNewStatus(detailAppointment.status); }}>
                          Cancelar
                        </Button>
                        <Button size="sm" className="text-xs h-8" onClick={handleStatusChange}
                          disabled={newStatus === detailAppointment.status}>
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

    
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="!max-w-3xl">
          <DialogHeader><DialogTitle>Nova Consulta</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 relative">
                <Label>Paciente</Label>
                <Input
                  placeholder="Digite o nome do paciente"
                  value={patientSearch}
                  className={cn(formErrors.patient && "border-rose-400 focus-visible:ring-rose-300")}
                  onChange={async e => {
                    const value = e.target.value;
                    setPatientSearch(value);
                    setSelectedPatient(null);
                    setFormErrors(prev => ({ ...prev, patient: "" }));
                    if (!value) { setPatientSuggestions([]); return; }
                    try {
                      const res  = await fetch(apiUrl(`/api/appointments/search/patients?name=${encodeURIComponent(value)}`));
                      const json = await res.json();
                      setPatientSuggestions(json.data ?? []);
                    } catch { toast.error("Erro ao buscar pacientes"); }
                  }}
                />
                {patientSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full bg-popover border border-border rounded-md shadow-md max-h-40 overflow-y-auto top-full mt-1">
                    {patientSuggestions.map((p: any) => (
                      <div key={p.id} className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                        onMouseDown={e => {
                          e.preventDefault();
                          setPatientSearch(p.fullName);
                          setSelectedPatient(p);
                          setPatientSuggestions([]);
                          setFormErrors(prev => ({ ...prev, patient: "" }));
                        }}>
                        {p.fullName}
                      </div>
                    ))}
                  </div>
                )}
                <FieldError msg={formErrors.patient} />
                {selectedPatient && (
                  <p className="text-xs text-emerald-600 mt-0.5">✓ {selectedPatient.fullName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Médico</Label>
                <Select onValueChange={doctorId => {
                  const doc = doctors.find((d: any) => String(d.id) === doctorId);
                  if (!doc) return;
                  setSelectedDoctor(doc);
                  setFormErrors(prev => ({ ...prev, doctor: "" }));
                  const hours = generateHours(
                    doc.startTime, doc.endTime,
                    appointments.filter(a => a.doctorId === String(doc.id)),
                    selectedDate,
                  );
                  setAvailableHours(hours);
                  if (hours.length === 0 && selectedDate) toast.error("Médico indisponível nessa data");
                }}>
                  <SelectTrigger className={cn(formErrors.doctor && "border-rose-400")}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={formErrors.doctor} />
              </div>

              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  type="date"
                  min={toLocalYmd(new Date())}
                  className={cn(formErrors.date && "border-rose-400 focus-visible:ring-rose-300")}
                  onChange={e => {
                    const date = e.target.value;
                    setSelectedDate(date);
                    setSelectedHour("");
                    setFormErrors(prev => ({ ...prev, date: "", hour: "" }));
                    if (selectedDoctor) {
                      const hours = generateHours(
                        selectedDoctor.startTime, selectedDoctor.endTime,
                        appointments.filter(a => a.doctorId === String(selectedDoctor.id)),
                        date,
                      );
                      setAvailableHours(hours);
                      if (hours.length === 0) toast.error("Médico indisponível nessa data");
                    }
                  }}
                />
                <FieldError msg={formErrors.date} />
              </div>

              <div className="space-y-1.5">
                <Label>Horário</Label>
                {availableHours.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {selectedDoctor && selectedDate ? "Sem horários disponíveis" : "Selecione um médico e uma data"}
                  </p>
                ) : (
                  <Select value={selectedHour}
                    onValueChange={v => { setSelectedHour(v); setFormErrors(prev => ({ ...prev, hour: "" })); }}>
                    <SelectTrigger className={cn(formErrors.hour && "border-rose-400")}>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableHours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <FieldError msg={formErrors.hour} />
              </div>

              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className={cn(formErrors.type && "border-rose-400")}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError msg={formErrors.type} />
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className={cn(formErrors.status && "border-rose-400")}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONFIRMADO">Confirmada</SelectItem>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError msg={formErrors.status} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Agendando..." : "Agendar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}